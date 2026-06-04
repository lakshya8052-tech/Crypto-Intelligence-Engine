from typing import Dict, List, Optional
import statistics
import math

from app.services.market_data import market_data_service, get_historical_prices
from app.services.indicators import technical_indicators


def calculate_trend_strength(price_history: List[float]) -> Dict[str, object]:
    """Calculate 7-day trend direction and strength from price history.

    Returns a dict with:
      - direction: 'up', 'down', or 'sideways' (or 'neutral')
      - strength: int 0-100 (higher = stronger trend)

    Fails safely and returns neutral values when history is insufficient.
    """
    try:
        if not price_history or len(price_history) < 2:
            return {"direction": "neutral", "strength": 50}

        # Use oldest vs newest available window to estimate multi-day trend.
        start = price_history[0]
        end = price_history[-1]
        if start == 0:
            return {"direction": "neutral", "strength": 50}

        pct_change = ((end - start) / start) * 100.0

        # Direction thresholds (tunable): >+2% up, <-2% down
        if pct_change > 2.0:
            direction = "up"
        elif pct_change < -2.0:
            direction = "down"
        else:
            direction = "sideways"

        # Map absolute pct change to 0-100 strength (5% -> 25, 20%+ -> 100)
        strength = int(min(100, abs(pct_change) * 5))
        # Ensure baseline for small moves
        if strength < 10:
            strength = 50 if direction == "sideways" else max(30, strength)

        return {"direction": direction, "strength": strength}

    except Exception:
        return {"direction": "neutral", "strength": 50}


def calculate_volume_strength(volumes: List[float]) -> Dict[str, object]:
    """Estimate recent volume trend and strength.

    Expects a list of historical volumes ending with most recent.
    Returns:
      - trend: 'increasing'|'decreasing'|'neutral'
      - strength: int 0-100

    If volumes are not available, returns neutral values.
    """
    try:
        if not volumes or len(volumes) < 2:
            return {"trend": "neutral", "strength": 50}

        recent = volumes[-1]
        prev = volumes[:-1]
        avg_prev = statistics.mean(prev) if prev else 0

        if avg_prev == 0 or recent == 0:
            return {"trend": "neutral", "strength": 50}

        ratio = recent / avg_prev

        # small tolerance
        if ratio > 1.1:
            trend = "increasing"
        elif ratio < 0.9:
            trend = "decreasing"
        else:
            trend = "neutral"

        # Strength scaled 0-100 based on deviation from baseline
        strength = int(min(100, abs(ratio - 1) * 100))
        if strength == 0:
            strength = 50

        return {"trend": trend, "strength": strength}

    except Exception:
        return {"trend": "neutral", "strength": 50}


def calculate_volatility_score(price_history: List[float]) -> int:
    """Calculate a volatility score (0-100) from historical prices.

    Uses percent returns stddev and maps to 0-100 where higher = more volatile.
    Returns 50 (neutral) when insufficient data.
    """
    try:
        if not price_history or len(price_history) < 2:
            return 50

        # Calculate percent returns
        returns = []
        for i in range(1, len(price_history)):
            prev = price_history[i - 1]
            cur = price_history[i]
            if prev == 0:
                continue
            returns.append((cur - prev) / prev)

        if not returns:
            return 50

        std = statistics.pstdev(returns)
        vol_pct = std * 100.0  # e.g., 0.02 -> 2%

        # Map vol_pct to 0-100 (e.g., 0% -> 0, 5% -> 50, 10% -> 100)
        score = int(min(100, (vol_pct / 10.0) * 100))
        # Keep a sensible default floor/ceiling
        score = max(0, min(100, score))
        return score

    except Exception:
        return 50


async def get_market_insights(symbol: str) -> Dict[str, object]:
    """Fetch market data and compute analytic signals.

    Returns a dict containing base market fields plus:
      - trend_7d: 'up'|'down'|'sideways'|'neutral'
      - trend_strength: int 0-100
      - volume_trend: 'increasing'|'decreasing'|'neutral'
      - volume_strength: int 0-100
      - volatility_score: int 0-100
      - momentum_strength: int 0-100

    Functions are defensive: on any missing data or error, neutral defaults are returned
    and the base market structure is preserved.
    """
    neutral_resp = {
        "symbol": symbol.upper(),
        "price": None,
        "change_24h": None,
        "volume": None,
        "timestamp": None,
        "trend_7d": "neutral",
        "trend_strength": 50,
        "volume_trend": "neutral",
        "volume_strength": 50,
        "volatility_score": 50,
        "momentum_strength": 50,
    }

    try:
        market = await market_data_service.get_market_price(symbol)
        if not market:
            return neutral_resp

        # Base fields (keep original keys for compatibility)
        resp: Dict[str, object] = {
            "symbol": market.get("symbol", symbol.upper()),
            "price": market.get("price"),
            "change_24h": market.get("change_24h"),
            "volume": market.get("volume"),
            "timestamp": market.get("timestamp")
        }

        # Gather price history: prefer stored history, otherwise try historical API
        price_history = market_data_service.get_price_history(symbol)

        # If stored history is small, try fetching historical prices (Binance klines)
        if len(price_history) < 24:
            hist = await get_historical_prices(symbol)
            if hist:
                price_history = hist

        # Trend and strength
        trend_info = calculate_trend_strength(price_history)
        resp["trend_7d"] = trend_info.get("direction", "neutral")
        resp["trend_strength"] = trend_info.get("strength", 50)

        # Volume trend - historical volumes are not consistently stored; default to neutral
        # If market provides a single current volume, we cannot compute reliable trend.
        resp["volume_trend"] = "neutral"
        resp["volume_strength"] = 50

        # Volatility score
        resp["volatility_score"] = calculate_volatility_score(price_history)

        # Momentum: try to compute from history using indicators helper
        try:
            momentum_val = None
            if price_history and len(price_history) >= 11:
                m = technical_indicators.calculate_momentum(price_history, period=10)
                if m is not None:
                    momentum_val = m
            # Fallback to 24h change as momentum proxy
            if momentum_val is None:
                change = market.get("change_24h")
                if change is not None:
                    momentum_val = change

            # Normalize momentum to 0-100 strength
            if momentum_val is None:
                resp["momentum_strength"] = 50
            else:
                resp["momentum_strength"] = int(min(100, max(0, abs(momentum_val))))
        except Exception:
            resp["momentum_strength"] = 50

        return resp

    except Exception:
        return neutral_resp
