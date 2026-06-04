from typing import List, Dict
from app.services.signal_engine import SignalEngine
from app.services.market_data import get_historical_prices
import random


class BacktestEngine:
    """Lightweight backtesting engine for signal strategy evaluation."""
    
    TRADING_FEE = 0.001  # 0.1% per trade
    
    def __init__(self):
        self.signal_engine = SignalEngine()
    
    def generate_test_price_series(self, symbol: str, length: int = 100) -> List[float]:
        """
        Generate test price series simulating BTC-like trend.
        
        Creates a realistic price movement with trend and volatility.
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
        
        for i in range(length):
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
    
    async def run_backtest(self, symbol: str, price_series: List[float] = None) -> Dict:
        """
        Run backtest simulation on price series using signal engine.
        
        Simulates trading with virtual balance and tracks performance metrics.
        """
        # Generate price series if not provided
        if price_series is None:
            price_series = await get_historical_prices(symbol)
            # Fallback to synthetic data if historical prices are empty
            if not price_series:
                price_series = self.generate_test_price_series(symbol, length=100)
        
        # Initialize backtest state
        starting_balance = 10000.0
        current_balance = starting_balance
        position = 0.0  # Amount of asset held
        entry_price = None
        total_trades = 0
        wins = 0
        losses = 0
        fees_paid = 0.0
        
        # Simulate trading through price series
        for i, price in enumerate(price_series):
            # Get price history for indicators
            history = price_series[:i+1]
            
            # Only generate signal if we have enough history
            if len(history) < 30:
                continue
            
            # Generate simplified indicators from price history
            indicators = self._generate_indicators_from_history(history, price)
            
            # Get signal from signal engine
            signal_result = self.signal_engine.generate_signal(
                rsi=indicators["rsi"],
                macd=indicators["macd"],
                macd_signal=indicators["macd_signal"],
                macd_histogram=indicators["macd_histogram"],
                price=indicators["price"],
                ema_short=indicators["ema_short"],
                ema_long=indicators["ema_long"],
                momentum=indicators["momentum"]
            )
            
            signal = signal_result.get("signal", "HOLD")
            
            # Execute trades based on signal
            if signal == "BUY" and position == 0:
                # Enter long position with fee
                fee = current_balance * self.TRADING_FEE
                fees_paid += fee
                position = (current_balance - fee) / price
                entry_price = price
                total_trades += 1
                
            elif signal == "SELL" and position > 0:
                # Close position with fee
                sale_amount = position * price
                fee = sale_amount * self.TRADING_FEE
                fees_paid += fee
                current_balance = sale_amount - fee
                position = 0
                
                # Track win/loss
                if price > entry_price:
                    wins += 1
                else:
                    losses += 1
                
                entry_price = None
        
        # Close any remaining position at end with fee
        if position > 0:
            sale_amount = position * price_series[-1]
            fee = sale_amount * self.TRADING_FEE
            fees_paid += fee
            current_balance = sale_amount - fee
            if price_series[-1] > entry_price:
                wins += 1
            else:
                losses += 1
        
        # Calculate metrics
        return_percent = ((current_balance - starting_balance) / starting_balance) * 100
        win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
        
        return {
            "symbol": symbol.upper(),
            "starting_balance": round(starting_balance, 2),
            "ending_balance": round(current_balance, 2),
            "return_percent": round(return_percent, 2),
            "total_trades": total_trades,
            "wins": wins,
            "losses": losses,
            "win_rate": round(win_rate, 2),
            "fees_paid": round(fees_paid, 2)
        }
    
    def _generate_indicators_from_history(self, history: List[float], current_price: float) -> Dict:
        """
        Generate simplified indicators from price history.
        
        Uses simple calculations for backtesting demonstration.
        """
        if len(history) < 2:
            return {
                "price": current_price,
                "rsi": 50,
                "macd": 0,
                "macd_signal": 0,
                "macd_histogram": 0,
                "ema_short": current_price,
                "ema_long": current_price,
                "momentum": 0
            }
        
        # Calculate price change
        change_24h = ((history[-1] - history[-2]) / history[-2]) * 100
        
        # Simple RSI approximation
        rsi = 50 + (change_24h * 5)
        rsi = max(20, min(80, rsi))
        
        # Momentum
        momentum = change_24h
        
        # Simple EMA approximation
        ema_short = current_price * (1 + (change_24h / 100))
        ema_long = current_price * (1 + (change_24h / 200))
        
        # Simplified MACD
        macd = (change_24h / 100) * 0.01
        macd_signal = macd * 0.9
        macd_histogram = macd - macd_signal
        
        return {
            "price": current_price,
            "rsi": rsi,
            "macd": macd,
            "macd_signal": macd_signal,
            "macd_histogram": macd_histogram,
            "ema_short": ema_short,
            "ema_long": ema_long,
            "momentum": momentum
        }


# Singleton instance
backtest_engine = BacktestEngine()
