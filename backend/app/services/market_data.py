import httpx
from typing import Dict, Optional, List
from datetime import datetime
from collections import deque


class MarketDataService:
    """Service for fetching real market data from CoinGecko API with price history storage."""
    
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.timeout = 10.0
        self.price_history: Dict[str, deque] = {}  # Store last 50 prices per symbol
        self.max_history_size = 50
    
    async def get_market_price(self, symbol: str) -> Optional[Dict]:
        """
        Fetch real market data from CoinGecko API.
        
        Returns price, volume, 24h change for the given symbol.
        Returns None if API call fails.
        """
        try:
            # Map common symbols to CoinGecko IDs
            symbol_map = {
                "BTC": "bitcoin",
                "ETH": "ethereum",
                "SOL": "solana",
                "AVAX": "avalanche-2",
                "DOT": "polkadot",
                "ADA": "cardano",
                "XRP": "ripple",
                "LINK": "chainlink",
                "MATIC": "matic-network",
                "UNI": "uniswap"
            }
            
            coin_id = symbol_map.get(symbol.upper(), symbol.lower())
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/coins/markets",
                    params={
                        "vs_currency": "usd",
                        "ids": coin_id,
                        "order": "market_cap_desc",
                        "per_page": 1,
                        "page": 1,
                        "sparkline": "false"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        coin_data = data[0]
                        price = coin_data.get("current_price", 0)
                        
                        # Store price in history
                        self._add_to_history(symbol.upper(), price)
                        
                        return {
                            "symbol": symbol.upper(),
                            "price": price,
                            "change_24h": coin_data.get("price_change_percentage_24h", 0),
                            "volume": coin_data.get("total_volume", 0),
                            "timestamp": datetime.utcnow().isoformat()
                        }
                
                return None
                
        except Exception as e:
            print(f"Error fetching market data for {symbol}: {e}")
            return None
    
    def _add_to_history(self, symbol: str, price: float) -> None:
        """Add price to history for the symbol."""
        if symbol not in self.price_history:
            self.price_history[symbol] = deque(maxlen=self.max_history_size)
        self.price_history[symbol].append(price)
    
    def get_price_history(self, symbol: str) -> List[float]:
        """Get price history for the symbol."""
        return list(self.price_history.get(symbol.upper(), []))
    
async def get_historical_prices(symbol: str) -> List[float]:
    """
    Fetch last 100 closing prices from Binance klines API.
    
    Args:
        symbol: Trading pair symbol (e.g., "BTC", "ETH")
    
    Returns:
        List of last 100 closing prices as floats.
        Returns empty list if request fails.
    """
    try:
        # Binance API endpoint for klines
        binance_url = "https://api.binance.com/api/v3/klines"
        
        # Convert symbol to Binance format (e.g., BTC -> BTCUSDT)
        binance_symbol = f"{symbol.upper()}USDT"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                binance_url,
                params={
                    "symbol": binance_symbol,
                    "interval": "1h",  # 1-hour candles
                    "limit": 100  # Last 100 candles
                }
            )
            
            if response.status_code == 200:
                klines = response.json()
                # Extract closing prices (index 4 in each kline array)
                closing_prices = [float(kline[4]) for kline in klines]
                return closing_prices
            
            return []
            
    except Exception as e:
        print(f"Error fetching historical prices for {symbol}: {e}")
        return []


# Singleton instance
market_data_service = MarketDataService()
