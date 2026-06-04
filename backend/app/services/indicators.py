from typing import List, Optional


class TechnicalIndicators:
    """Real technical indicator calculations using standard formulas."""
    
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> Optional[float]:
        """
        Calculate Relative Strength Index (RSI).
        
        RSI = 100 - (100 / (1 + RS))
        where RS = Average Gain / Average Loss
        """
        if len(prices) < period + 1:
            return None  # Insufficient data
        
        gains = []
        losses = []
        
        for i in range(1, len(prices)):
            change = prices[i] - prices[i - 1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(change))
        
        # Calculate average gains and losses
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        
        if avg_loss == 0:
            return 100 if avg_gain > 0 else 50
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> Optional[float]:
        """
        Calculate Exponential Moving Average (EMA).
        
        EMA = (Price * Multiplier) + (Previous EMA * (1 - Multiplier))
        where Multiplier = 2 / (period + 1)
        """
        if len(prices) < period:
            return None  # Insufficient data
        
        multiplier = 2 / (period + 1)
        
        # Start with SMA for the first EMA value
        ema = sum(prices[:period]) / period
        
        # Calculate EMA for remaining prices
        for price in prices[period:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return ema
    
    @staticmethod
    def calculate_macd(prices: List[float], fast_period: int = 12, slow_period: int = 26, signal_period: int = 9) -> Optional[dict]:
        """
        Calculate MACD (Moving Average Convergence Divergence).
        
        MACD Line = EMA(fast) - EMA(slow)
        Signal Line = EMA(MACD Line)
        Histogram = MACD Line - Signal Line
        """
        if len(prices) < slow_period + signal_period:
            return None  # Insufficient data
        
        # Calculate EMA series for MACD line
        # This is more efficient than the previous O(N^2) approach
        fast_emas = []
        slow_emas = []
        
        # Seed first EMA with SMA
        f_ema = sum(prices[:fast_period]) / fast_period
        s_ema = sum(prices[:slow_period]) / slow_period
        
        fast_multiplier = 2 / (fast_period + 1)
        slow_multiplier = 2 / (slow_period + 1)
        
        macd_history = []
        
        # Use common loop to calculate both EMA series
        # We need enough history to calculate the signal line (EMA of MACD)
        for i in range(len(prices)):
            price = prices[i]
            
            # Update Fast EMA
            if i >= fast_period:
                f_ema = (price * fast_multiplier) + (f_ema * (1 - fast_multiplier))
            
            # Update Slow EMA
            if i >= slow_period:
                s_ema = (price * slow_multiplier) + (s_ema * (1 - slow_multiplier))
                
            # MACD is valid once Slow EMA is valid
            if i >= slow_period - 1:
                macd_history.append(f_ema - s_ema)
        
        if len(macd_history) < signal_period:
            return None
            
        macd_line = macd_history[-1]
        
        # Calculate Signal Line (EMA of MACD line)
        signal_line = TechnicalIndicators.calculate_ema(macd_history, signal_period)
        
        if signal_line is None:
            signal_line = macd_line * 0.9  # Fallback
        
        histogram = macd_line - signal_line
        
        return {
            "macd": macd_line,
            "macd_signal": signal_line,
            "macd_histogram": histogram
        }
    
    @staticmethod
    def calculate_momentum(prices: List[float], period: int = 10) -> Optional[float]:
        """
        Calculate Momentum indicator.
        
        Momentum = ((Current Price - Price N periods ago) / Price N periods ago) * 100
        """
        if len(prices) < period + 1:
            return None  # Insufficient data
        
        current_price = prices[-1]
        past_price = prices[-period - 1]
        
        if past_price == 0:
            return 0.0
            
        momentum = ((current_price - past_price) / past_price) * 100
        
        return momentum


# Singleton instance
technical_indicators = TechnicalIndicators()
