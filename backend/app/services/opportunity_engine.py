from typing import List, Dict, Optional
from app.services.analysis_engine import generate_market_analysis
from app.services.signal_engine import SignalEngine
from app.services.market_data import market_data_service, get_historical_prices


def rank_opportunities(symbol_data_list: List[Dict]) -> List[Dict]:
    """
    Rank setups by probability strength (absolute distance from neutral).
    Both BUY and SELL setups can be top opportunities.
    """
    def calculate_opportunity_strength(data: Dict) -> float:
        # Use setup-specific daily_score if available from analysis_engine
        # Otherwise fallback to distance-based scoring
        if "daily_score" in data:
            return float(data["daily_score"])
            
        base_score = data.get("score", 50)
        confidence = data.get("confidence", 50)
        
        # Setup strength is how far we are from 'No Signal' (50)
        setup_strength = abs(base_score - 50) * 2 # Scale 0-50 diff to 0-100
        return (setup_strength * 0.7) + (confidence * 0.3)
    
    scored_opportunities = []
    for data in symbol_data_list:
        score = calculate_opportunity_strength(data)
        scored_opportunities.append({
            **data,
            "opportunity_score": round(score, 2)
        })
    
    scored_opportunities.sort(key=lambda x: x["opportunity_score"], reverse=True)
    return scored_opportunities[:3]


async def get_top_opportunities() -> List[Dict]:
    """
    Get top opportunities ranked by setup precision (BUY or SELL).
    """
    assets = ["BTC", "ETH", "SOL", "DOGE", "BNB", "XRP"]
    opportunities = []
    signal_engine = SignalEngine()
    
    for asset in assets:
        try:
            market_data = await market_data_service.get_market_price(asset)
            if not market_data:
                continue
            
            history = await get_historical_prices(asset)
            
            if len(history) >= 30:
                from app.services.indicators import technical_indicators
                rsi = technical_indicators.calculate_rsi(history)
                ema_short = technical_indicators.calculate_ema(history, 12)
                ema_long = technical_indicators.calculate_ema(history, 26)
                macd_data = technical_indicators.calculate_macd(history)
                momentum = technical_indicators.calculate_momentum(history)
                
                macd = macd_data["macd"] if macd_data else 0
                macd_signal = macd_data["macd_signal"] if macd_data else 0
                macd_histogram = macd_data["macd_histogram"] if macd_data else 0
            else:
                change_24h = market_data.get("change_24h", 0)
                price = market_data.get("price", 0)
                
                # FIX: RSI correctly follows price action (Pump = High RSI)
                rsi = 50 + (change_24h * 2.5) 
                rsi = max(5, min(95, rsi))
                
                momentum = change_24h
                ema_short = price * (1 + (change_24h / 150))
                ema_long = price
                macd = (change_24h / 100) * 0.002
                macd_signal = 0
                macd_histogram = macd
            
            signal_data = signal_engine.generate_signal(
                rsi=rsi,
                macd=macd,
                macd_signal=macd_signal,
                macd_histogram=macd_histogram,
                price=market_data.get("price"),
                ema_short=ema_short,
                ema_long=ema_long,
                momentum=momentum
            )
            
            analysis = generate_market_analysis(
                symbol=asset,
                signal_data=signal_data,
                market_data=market_data
            )
            
            opportunity = {
                "symbol": asset,
                "daily_score": analysis.get("daily_score", 0),
                "daily_recommendation": analysis.get("daily_recommendation", "Neutral"),
                "market_trend": analysis.get("market_trend", "Sideways"),
                "volatility": analysis.get("volatility", "Low"),
                "risk_level": analysis.get("risk_level", "Medium"),
                "confidence": signal_data.get("confidence", 0)
            }
            
            opportunities.append(opportunity)
            
        except Exception as e:
            print(f"Skipping {asset} due to engine error: {e}")
            continue
    
    # Rank by setup precision (daily_score already accounts for setup strength)
    opportunities.sort(key=lambda x: (x["daily_score"], x["confidence"]), reverse=True)
    return opportunities
