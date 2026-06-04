import httpx
from typing import List, Optional
import random
from datetime import datetime, timedelta


class HistoricalDataService:
    """Service for fetching historical market data from Binance public API."""
    
    def __init__(self):
        self.base_url = "https://api.binance.com/api/v3"
        self.timeout = 10.0
    
    async def get_historical_prices(self, symbol: str, limit: int = 100) -> Optional[List[float]]:
        """
        Fetch historical closing prices from Binance API.
        
        Returns list of closing prices for the given symbol.
        Returns None if API call fails.
        """
        try:
            # Map symbol to Binance format
            binance_symbol = f"{symbol.upper()}USDT"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/klines",
                    params={
                        "symbol": binance_symbol,
                        "interval": "1h",
                        "limit": limit
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # Extract closing prices (index 4 in kline data)
                    closing_prices = [float(kline[4]) for kline in data]
                    return closing_prices
                
                return None
                
        except Exception as e:
            print(f"Error fetching historical data for {symbol}: {e}")
            return None
    
    def generate_synthetic_prices(self, symbol: str, length: int = 100) -> List[float]:
        """
        Generate synthetic price series as fallback.
        
        Creates realistic price movement with trend and volatility.
        """
        base_price = 50000 if symbol.upper() == "BTC" else 3000
        if symbol.upper() == "ETH":
            base_price = 3000
        elif symbol.upper() == "SOL":
            base_price = 100
        elif symbol.upper() == "AVAX":
            base_price = 35
        
        prices = []
        current_price = base_price
        
        for _ in range(length):
            # Add trend (slight upward bias)
            trend = 0.0002
            
            # Add volatility
            volatility = random.uniform(-0.02, 0.02)
            
            # Calculate new price
            change = trend + volatility
            current_price = current_price * (1 + change)
            
            # Ensure price doesn't go negative
            current_price = max(current_price, 1)
            
            prices.append(current_price)
        
        return prices
    
    async def get_prices_with_fallback(self, symbol: str, limit: int = 100) -> List[float]:
        """
        Get historical prices with fallback to synthetic data.
        
        Tries Binance API first, falls back to synthetic generation on failure.
        """
        prices = await self.get_historical_prices(symbol, limit)
        
        if prices is None or len(prices) == 0:
            # Fallback to synthetic data
            prices = self.generate_synthetic_prices(symbol, limit)
        
        return prices


# Singleton instance
historical_data_service = HistoricalDataService()
