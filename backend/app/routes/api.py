try:
    from fastapi import APIRouter, HTTPException
    _FASTAPI_AVAILABLE = True
except Exception:
    # Allow importing this module in test environments without fastapi installed
    class _DummyRouter:
        def __init__(self, prefix=None):
            self.prefix = prefix
        def get(self, path):
            def _decorator(func):
                return func
            return _decorator

    APIRouter = _DummyRouter
    HTTPException = Exception
    _FASTAPI_AVAILABLE = False

from app.services.signal_engine import SignalEngine
from app.services.signal_service import generate_signal_with_insights, build_safe_indicators
import logging
from app.services.market_data import market_data_service
from app.services.indicators import technical_indicators
from app.services.backtest import backtest_engine
from app.services.analysis_engine import generate_market_analysis
from app.services.opportunity_engine import rank_opportunities, get_top_opportunities
from datetime import datetime
from typing import Dict


router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
signal_engine = SignalEngine()


def calculate_indicators_from_history(price_history: list, current_price: float, change_24h: float) -> Dict:
    """
    Calculate real technical indicators from price history.
    
    Uses proper RSI, EMA, MACD, and momentum calculations.
    Falls back to simplified calculations if history is insufficient.
    """
    # Try to calculate real indicators from history
    if len(price_history) >= 30:
        # Sufficient history for real calculations
        rsi = technical_indicators.calculate_rsi(price_history, period=14)
        ema_short = technical_indicators.calculate_ema(price_history, period=12)
        ema_long = technical_indicators.calculate_ema(price_history, period=26)
        macd_result = technical_indicators.calculate_macd(price_history, fast_period=12, slow_period=26, signal_period=9)
        momentum = technical_indicators.calculate_momentum(price_history, period=10)
        
        # Use real values if available
        if rsi is None:
            rsi = 50 + (change_24h * 5)
            rsi = max(20, min(80, rsi))
        if ema_short is None:
            ema_short = current_price * (1 + (change_24h / 100))
        if ema_long is None:
            ema_long = current_price * (1 + (change_24h / 200))
        if macd_result is None:
            macd = (change_24h / 100) * 0.01
            macd_signal = macd * 0.9
            macd_histogram = macd - macd_signal
        else:
            macd = macd_result["macd"]
            macd_signal = macd_result["macd_signal"]
            macd_histogram = macd_result["macd_histogram"]
        if momentum is None:
            momentum = change_24h
    else:
        # Insufficient history - use simplified calculations
        rsi = 50 + (change_24h * 5)
        rsi = max(20, min(80, rsi))
        momentum = change_24h
        ema_short = current_price * (1 + (change_24h / 100))
        ema_long = current_price * (1 + (change_24h / 200))
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


def calculate_indicators_from_price(price: float, change_24h: float) -> Dict:
    """
    Calculate simple technical indicators from real price data (fallback).
    
    Uses approximations for demonstration when no history is available.
    """
    # Simple RSI approximation based on price change
    rsi = 50 + (change_24h * 5)
    rsi = max(20, min(80, rsi))  # Clamp between 20-80
    
    # Momentum is the 24h change percentage
    momentum = change_24h
    
    # Simple EMA approximation
    ema_short = price * (1 + (change_24h / 100))
    ema_long = price * (1 + (change_24h / 200))
    
    # Simplified MACD
    macd = (change_24h / 100) * 0.01
    macd_signal = macd * 0.9
    macd_histogram = macd - macd_signal
    
    return {
        "price": price,
        "rsi": rsi,
        "macd": macd,
        "macd_signal": macd_signal,
        "macd_histogram": macd_histogram,
        "ema_short": ema_short,
        "ema_long": ema_long,
        "momentum": momentum
    }


@router.get("/signal/{symbol}")
async def get_signal(symbol: str):
    """
    Get trading signal for a symbol using the signal engine.
    
    Returns signal, score, confidence, and reasoning based on technical indicators.
    Uses real market data with real technical indicators from price history.
    Falls back to simplified calculations if history is insufficient.
    Includes market analysis with trend, risk level, and recommendations.
    """
    try:
        # Try to get real market data
        market_data = await market_data_service.get_market_price(symbol)

        if not market_data:
            raise HTTPException(status_code=503, detail=f"Live market data unavailable for {symbol.upper()}")

        # Get price history
        price_history = market_data_service.get_price_history(symbol)

        # Build safe indicators using history+market_data; always returns required keys
        indicators = build_safe_indicators(price_history or [], market_data or {})

        try:
            # Pass data_quality_score through so the signal generator can adjust conservatively
            signal_result = await generate_signal_with_insights(
                symbol=symbol,
                rsi=indicators.get("rsi"),
                macd=indicators.get("macd"),
                macd_signal=indicators.get("macd_signal"),
                macd_histogram=indicators.get("macd_histogram"),
                price=indicators.get("price", market_data.get("price")),
                ema_short=indicators.get("ema_short"),
                ema_long=indicators.get("ema_long"),
                momentum=indicators.get("momentum"),
                data_quality_score=indicators.get("data_quality_score")
            )
        except Exception as e:
            # If the wrapper fails, log and fall back to synchronous engine
            logger.exception("Signal wrapper failed for %s - falling back to base engine: %s", symbol, e)
            signal_result = signal_engine.generate_signal(
                rsi=indicators["rsi"],
                macd=indicators["macd"],
                macd_signal=indicators["macd_signal"],
                macd_histogram=indicators["macd_histogram"],
                price=indicators["price"],
                ema_short=indicators["ema_short"],
                ema_long=indicators["ema_long"],
                momentum=indicators["momentum"]
            )
        
        # Add symbol to response
        signal_result["symbol"] = symbol.upper()
        
        # Generate market analysis
        analysis = generate_market_analysis(
            symbol=symbol.upper(),
            signal_data=signal_result,
            market_data=market_data
        )
        
        # Add analysis to response (backward-compatible)
        signal_result["analysis"] = analysis
        
        return signal_result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/market/{symbol}")
async def get_market(symbol: str):
    """
    Get market data for a symbol.
    
    Returns price, 24h change, and volume.
    Uses real CoinGecko API data.
    """
    try:
        # Try to get real market data
        market_data = await market_data_service.get_market_price(symbol)
        
        if not market_data:
            raise HTTPException(status_code=503, detail=f"Live market data unavailable for {symbol.upper()}")
        return market_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/backtest/{symbol}")
def get_backtest(symbol: str):
    """
    Run backtest simulation for a symbol using signal engine.
    
    Simulates trading with virtual balance and returns performance metrics.
    Uses generated test price series for demonstration.
    """
    try:
        backtest_result = backtest_engine.run_backtest(symbol)
        return backtest_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/opportunities")
async def get_opportunities():
    """
    Get top opportunities for fixed asset list.
    
    Returns sorted list of opportunities with daily_score, daily_recommendation,
    market_trend, volatility, risk_level, and confidence.
    Sorted by daily_score DESC, with confidence as tie-breaker.
    """
    try:
        return await get_top_opportunities()
    except Exception as e:
        # Return empty list on failure
        return []


if __name__ == "__main__":
    # Simple local test runner so maintainers can validate endpoints without FastAPI installed.
    import sys
    import asyncio
    sys.path.insert(0, '/Users/apple/Desktop/crypto-signals-app/backend')

    async def _run_tests():
        for sym in ('BTC', 'ETH'):
            try:
                res = await get_signal(sym)
                # Only print if structured
                ok = all(k in res for k in ('signal', 'score', 'confidence', 'reasoning', 'analysis'))
                print(sym, 'STRUCTURED' if ok else 'MISSING_KEYS')
            except Exception as e:
                print(sym, 'ERROR', str(e))

    asyncio.run(_run_tests())
