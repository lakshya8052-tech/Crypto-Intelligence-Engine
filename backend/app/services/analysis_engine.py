from typing import Dict, Optional


def generate_market_analysis(symbol: str, signal_data: Dict, market_data: Dict) -> Dict:
    """
    Generate lightweight market analysis based on signal and market data.
    
    Synchronized with SignalEngine indicators to prevent descriptive contradictions.
    """
    signal = signal_data.get("signal", "HOLD")
    confidence = signal_data.get("confidence", 50)
    rsi = signal_data.get("rsi", 50)
    momentum = signal_data.get("momentum", 0)
    price = market_data.get("price", 0)
    change_24h = market_data.get("change_24h", 0)
    
    # Logic Sync: Align trend assessment with the SignalEngine's indicators
    # We prioritize RSI and momentum over simple 24h change
    if rsi > 65 and momentum > 2:
        trend = "Strong Uptrend"
    elif rsi > 55 or momentum > 0:
        trend = "Moderate Uptrend"
    elif rsi < 35 and momentum < -2:
        trend = "Strong Downtrend"
    elif rsi < 45 or momentum < 0:
        trend = "Moderate Downtrend"
    else:
        trend = "Sideways/Consolidation"
    
    # Determine risk level based on RSI and volatility
    if rsi > 70 or rsi < 30:
        risk_level = "High"
    elif rsi > 60 or rsi < 40:
        risk_level = "Medium"
    else:
        risk_level = "Low"
    
    # Generate recommendation based on signal and trend
    if signal == "BUY":
        if "Uptrend" in trend:
            recommendation = "Strong Buy - Trend following entry"
        elif "Sideways" in trend:
            recommendation = "Buy - Potential breakout setup"
        else:
            recommendation = "Buy - Contrarian setup in downtrend"
    elif signal == "SELL":
        if "Downtrend" in trend:
            recommendation = "Strong Sell - Trend continuation"
        elif "Sideways" in trend:
            recommendation = "Sell - Potential breakdown setup"
        else:
            recommendation = "Sell - Profit taking at local peak"
    else:
        recommendation = "Hold - Wait for clearer setup"
    
    # Calculate entry zone based on current price and RSI
    if signal == "BUY":
        if rsi < 30:
            entry_zone = f"Immediate - Oversold conditions at ${price:.2f}"
        elif rsi < 50:
            entry_zone = f"${price * 0.98:.2f} - ${price:.2f} - Accumulation"
        else:
            entry_zone = f"Pullback zone: ${price * 0.94:.2f} - ${price * 0.97:.2f}"
    elif signal == "SELL":
        entry_zone = f"Current - Exit target ${price:.2f}"
    else:
        entry_zone = f"Range: ${price * 0.97:.2f} - ${price * 1.03:.2f}"
    
    # Calculate volatility based on 24h change magnitude
    volatility = abs(change_24h)
    if volatility > 5:
        volatility_level = "High"
    elif volatility > 2:
        volatility_level = "Medium"
    else:
        volatility_level = "Low"
    
    # Calculate invalidation level (stop loss)
    if signal == "BUY":
        invalidation_level = price * 0.94  # 6% buffer
    elif signal == "SELL":
        invalidation_level = price * 1.06  # 6% buffer
    else:
        invalidation_level = price * 0.95
    
    # Sync: Use opportunity scoring logic for the daily_score
    # This represents "How good is this setup?" (0-100)
    # Both strong BUYS and strong SELLS should get high scores
    signal_score = signal_data.get("score", 50)
    if signal == "SELL":
        base_opp_score = (100 - signal_score)
    elif signal == "BUY":
        base_opp_score = signal_score
    else:
        base_opp_score = 40
    
    # Weight setup quality by confidence
    daily_score = (base_opp_score * 0.7) + (confidence * 0.3)
    daily_score = max(0, min(100, int(daily_score)))
    
    # Determine daily recommendation based on score
    if daily_score >= 80:
        daily_recommendation = "High Precision Setup"
    elif daily_score >= 65:
        daily_recommendation = "Active Opportunity"
    elif daily_score >= 45:
        daily_recommendation = "Monitoring"
    else:
        daily_recommendation = "Low Probability"
    
    # Reasoning (detailed analysis)
    reasoning = f"{symbol} setup: {trend}. "
    reasoning += f"RSI at {rsi:.1f} ({'Oversold' if rsi < 30 else 'Overbought' if rsi > 70 else 'Neutral'}). "
    reasoning += f"Volatility is {volatility_level.lower()}. "
    reasoning += f"Momentum at {momentum:.2f} supports current bias."
    
    return {
        "market_trend": trend,
        "momentum": momentum,
        "volatility": volatility_level,
        "risk_level": risk_level,
        "confidence": confidence,
        "entry_zone": entry_zone,
        "invalidation_level": f"${invalidation_level:.2f}",
        "reasoning": reasoning,
        "daily_score": daily_score,
        "daily_recommendation": daily_recommendation,
        "why_today": [trend, f"Vol: {volatility_level}", f"Conf: {confidence:.0f}%"],
        "summary": reasoning.split(". ")[0] + ".",
        "trend": trend,
        "recommendation": recommendation,
        "confidence_reason": f"Indicators aligned with {confidence:.0f}% technical consensus"
    }
