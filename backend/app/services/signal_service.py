from typing import Optional, Dict

from app.services.signal_engine import SignalEngine
from app.services.market_service import get_market_insights
from app.services.market_data import market_data_service
from app.services.news_service import classify_news_event, calculate_macro_risk
from app.services.news_fetcher_service import fetch_market_news
import logging

logger = logging.getLogger(__name__)


signal_engine = SignalEngine()


def build_safe_indicators(price_history: list, market_data: dict) -> Dict:
    """Construct a safe indicators object ensuring no empty indicator set.

    Uses historical prices to estimate simple RSI, EMA, MACD, momentum when possible.
    Returns dict with keys: rsi, macd, macd_signal, macd_histogram, ema_short, ema_long, momentum, volume
    """
    try:
        # Neutral defaults
        indicators = {
            'rsi': 50.0,
            'macd': 0.0,
            'macd_signal': 0.0,
            'macd_histogram': 0.0,
            'ema_short': None,
            'ema_long': None,
            'momentum': 0.0,
            # normalized name expected by other parts of the app
            'volume_24h_change': None
        }

        # Use history if available
        if price_history and len(price_history) >= 3:
            # momentum: pct change over last 10 (or available) points
            try:
                lookback = min(10, len(price_history)-1)
                recent = price_history[-1]
                past = price_history[-1-lookback]
                indicators['momentum'] = ((recent - past) / past) * 100 if past != 0 else 0.0
            except Exception:
                indicators['momentum'] = 0.0

            # simple RSI-like estimate using gains/losses over last N
            try:
                gains = 0.0
                losses = 0.0
                period = min(14, len(price_history)-1)
                for i in range(-period, 0):
                    change = price_history[i] - price_history[i-1]
                    if change > 0:
                        gains += change
                    else:
                        losses += abs(change)
                avg_gain = gains / period if period else 0.0
                avg_loss = losses / period if period else 0.0
                if avg_loss == 0 and avg_gain == 0:
                    indicators['rsi'] = 50.0
                elif avg_loss == 0:
                    indicators['rsi'] = 100.0
                else:
                    rs = avg_gain / avg_loss
                    indicators['rsi'] = 100 - (100 / (1 + rs))
            except Exception:
                indicators['rsi'] = 50.0

            # EMA approximations: simple moving average windows as fallback
            try:
                short_period = min(12, len(price_history))
                long_period = min(26, len(price_history))
                indicators['ema_short'] = sum(price_history[-short_period:]) / short_period
                indicators['ema_long'] = sum(price_history[-long_period:]) / long_period
                indicators['macd'] = indicators['ema_short'] - indicators['ema_long']
                indicators['macd_signal'] = indicators['macd'] * 0.9
                indicators['macd_histogram'] = indicators['macd'] - indicators['macd_signal']
            except Exception:
                indicators['ema_short'] = indicators['ema_long'] = None

        # Ensure keys exist and are valid numbers
        for k in ['rsi', 'macd', 'macd_signal', 'macd_histogram', 'momentum']:
            if indicators.get(k) is None:
                indicators[k] = 0.0 if k != 'rsi' else 50.0

        # volume fallback - try a few likely fields from market_data
        if market_data:
            vol_keys = ['volume_24h_change', 'volume_change_24h', 'volume_change', 'volume']
            for vk in vol_keys:
                if indicators.get('volume_24h_change') is None and market_data.get(vk) is not None:
                    indicators['volume_24h_change'] = market_data.get(vk)
                    break
        if indicators.get('volume_24h_change') is None:
            indicators['volume_24h_change'] = 0.0

        # Compute a simple data quality score (0-100)
        dq = 100
        try:
            if not price_history or len(price_history) < 10:
                dq -= 50
            elif len(price_history) < 30:
                dq -= 20

            if not market_data:
                dq -= 20

            # If EMAs were approximated because history short, reduce quality
            if indicators.get('ema_short') is None or indicators.get('ema_long') is None:
                dq -= 10

            # clamp
            dq = max(0, min(100, int(dq)))
        except Exception:
            dq = 0

        indicators['data_quality_score'] = dq

        return indicators
    except Exception:
        # Return conservative defaults
        dq = 0
        try:
            if market_data:
                dq = 30
        except Exception:
            dq = 0
        return {
            'rsi': 50.0,
            'macd': 0.0,
            'macd_signal': 0.0,
            'macd_histogram': 0.0,
            'ema_short': None,
            'ema_long': None,
            'momentum': 0.0,
            'volume_24h_change': market_data.get('volume') if market_data else 0,
            'data_quality_score': dq
        }


async def generate_signal_with_insights(
    symbol: str,
    rsi: Optional[float] = None,
    macd: Optional[float] = None,
    macd_signal: Optional[float] = None,
    macd_histogram: Optional[float] = None,
    price: Optional[float] = None,
    ema_short: Optional[float] = None,
    ema_long: Optional[float] = None,
    momentum: Optional[float] = None,
    news_events: Optional[list] = None,
    data_quality_score: Optional[int] = None,
) -> Dict:
    """Generate a trading signal enhanced with market insights.

    This function fetches market insights (trend_7d, trend_strength, volume_strength,
    volatility_score, momentum_strength) and adjusts the base signal generated by
    the existing SignalEngine accordingly.

    The returned structure is compatible with the existing signal format:
    { signal, score, confidence, reasoning }

    The function fails safely: if insights cannot be fetched, it returns the
    base signal from SignalEngine unchanged.
    """
    try:
        # If core indicators are missing, build safe/reconstructed indicators
        reconstructed_reasons = []
        if any(v is None for v in (rsi, macd, macd_signal, ema_short, ema_long, momentum)):
            # Attempt to reconstruct from available market service - but the caller (api.py)
            # should pass price_history/market_data via build_safe_indicators. If they didn't,
            # we still ensure neutral defaults here.
            safe = build_safe_indicators(price_history=[], market_data={})
            # Only overwrite missing values, keep provided ones
            rsi = rsi if rsi is not None else safe.get('rsi')
            macd = macd if macd is not None else safe.get('macd')
            macd_signal = macd_signal if macd_signal is not None else safe.get('macd_signal')
            macd_histogram = macd_histogram if macd_histogram is not None else safe.get('macd_histogram')
            ema_short = ema_short if ema_short is not None else safe.get('ema_short')
            ema_long = ema_long if ema_long is not None else safe.get('ema_long')
            momentum = momentum if momentum is not None else safe.get('momentum')
            if safe.get('data_quality_score', 0) < 100:
                reconstructed_reasons.append("Using reconstructed indicators")

        # Base result from existing engine (synchronous)
        base = signal_engine.generate_signal(
            rsi=rsi,
            macd=macd,
            macd_signal=macd_signal,
            macd_histogram=macd_histogram,
            price=price,
            ema_short=ema_short,
            ema_long=ema_long,
            momentum=momentum,
        )

        # If the underlying engine returned the old placeholder reasoning, replace it
        br = base.get("reasoning", []) or []
        if any(isinstance(x, str) and "No valid indicators provided" in x for x in br):
            # Build conservative HOLD response preserving shape
            base = {
                "signal": "HOLD",
                "score": 50,
                "confidence": 0,
                "reasoning": ["Market data quality limited", "Using reconstructed indicators"]
            }

        # Attempt to fetch market insights
        insights = await get_market_insights(symbol)

        # Extract insight metrics with safe defaults
        trend_7d = insights.get("trend_7d", "neutral")
        trend_strength = int(insights.get("trend_strength", 50) or 50)
        volume_strength = int(insights.get("volume_strength", 50) or 50)
        volatility_score = int(insights.get("volatility_score", 50) or 50)
        momentum_strength = int(insights.get("momentum_strength", 50) or 50)
        # Try to extract macro / news sentiment if present
        macro = insights.get("macro", {}) if isinstance(insights, dict) else {}
        macro_score = int(macro.get("risk_score", insights.get("macro_risk", 50)) or 50)
        # News sentiment heuristic: positive -> >50, negative -> <50
        news_sentiment = insights.get("news_sentiment", 50)
        # simple bullish/bearish flags
        macro_bullish = macro_score <= 40
        macro_bearish = macro_score >= 65

        # Start with base values
        final_score = float(base.get("score", 50))
        final_confidence = float(base.get("confidence", 0))
        reasoning = list(base.get("reasoning", []))

        # === MARKET REGIME DETECTION ===
        market_regime = None
        try:
            ts = trend_strength or 50
            ms = momentum_strength or 50
            vs = volatility_score or 50
            vol = volume_strength or 50
            rs = None
            try:
                rs = float(rsi) if rsi is not None else None
            except Exception:
                rs = None

            # NEWS-DRIVEN SPECULATION: abnormal momentum + high volatility + weak trend + strong news signal
            if (abs(ms - 50) >= 25) and vs >= 70 and ts <= 55 and (news_sentiment is not None and (news_sentiment >= 65 or news_sentiment <= 35)):
                market_regime = "NEWS_DRIVEN_SPECULATION"

            # HIGH_RISK_VOLATILE: volatility extremely high or conflicting indicators
            if market_regime is None and vs >= 85:
                market_regime = "HIGH_RISK_VOLATILE"

            # STRONG_BULL
            if market_regime is None and ts >= 70 and ms >= 60 and vol >= 60 and vs <= 70 and macro_score <= 60:
                market_regime = "STRONG_BULL"

            # WEAK_BULL
            if market_regime is None and ts >= 55 and ms >= 50 and vol >= 50 and vs <= 75:
                market_regime = "WEAK_BULL"

            # STRONG_BEAR
            if market_regime is None and ts <= 30 and ms <= 40 and vs >= 60 and macro_score >= 60:
                market_regime = "STRONG_BEAR"

            # WEAK_BEAR
            if market_regime is None and ts <= 45 and ms <= 50 and vs >= 50:
                market_regime = "WEAK_BEAR"

            # SIDEWAYS
            if market_regime is None and ts >= 45 and ts <= 60 and abs(ms - 50) <= 10 and (rs is None or (rs >= 45 and rs <= 55)):
                market_regime = "SIDEWAYS"

            if market_regime is None:
                market_regime = "UNKNOWN"
        except Exception:
            market_regime = "UNKNOWN"

        # Apply regime-aware adjustments and reasoning
        try:
            if market_regime == "STRONG_BULL":
                # allow stronger BUY confidence and slightly reduce fake-breakout sensitivity
                final_confidence = min(100.0, final_confidence + 8.0)
                reasoning.append("Trend structure remains constructive despite short-term pullbacks")
            elif market_regime == "WEAK_BULL":
                final_confidence = min(100.0, final_confidence + 4.0)
                reasoning.append("Bullish bias present but confirmations are moderate")
            elif market_regime == "SIDEWAYS":
                # heavily bias HOLD
                final_score = (final_score + 50) / 2
                final_confidence = max(0.0, final_confidence - 10.0)
                reasoning.append("Sideways market conditions reduce reliability of breakout signals")
            elif market_regime == "STRONG_BEAR":
                # avoid beginner BUYs
                final_confidence = max(0.0, final_confidence - 20.0)
                reasoning.append("Broader bearish conditions increase downside continuation risk")
            elif market_regime == "HIGH_RISK_VOLATILE":
                final_confidence = max(0.0, final_confidence - 30.0)
                final_score = (final_score + 50) / 2
                reasoning.append("Current environment resembles a high-volatility risk regime")
            elif market_regime == "NEWS_DRIVEN_SPECULATION":
                final_confidence = max(0.0, final_confidence - 25.0)
                final_score = (final_score + 50) / 2
                reasoning.append("The market currently shows speculative conditions rather than stable trend development")
        except Exception:
            pass

        # === MULTI-TIMEFRAME & SUSTAINABILITY ANALYSIS ===
        try:
            # Fetch price history for multi-timeframe view (best-effort)
            price_history = []
            try:
                price_history = market_data_service.get_price_history(symbol) or []
            except Exception:
                price_history = []

            def pct_change(a, b):
                try:
                    if a == 0:
                        return 0.0
                    return ((b - a) / a) * 100.0
                except Exception:
                    return 0.0

            # Define windows (adapt to available history)
            n = len(price_history)
            short_n = min(5, n-1) if n >= 3 else 0
            medium_n = min(20, n-1) if n >= 6 else 0
            long_n = min(60, n-1) if n >= 21 else 0

            def window_direction(window_n, short_threshold=0.5):
                if window_n <= 0 or len(price_history) < window_n + 1:
                    return "neutral", 0.0
                start = price_history[-1-window_n]
                end = price_history[-1]
                pc = pct_change(start, end)
                if pc > short_threshold:
                    return "up", pc
                if pc < -short_threshold:
                    return "down", pc
                return "sideways", pc

            short_dir, short_pc = window_direction(short_n, short_threshold=0.5)
            medium_dir, medium_pc = window_direction(medium_n, short_threshold=1.5)
            long_dir, long_pc = window_direction(long_n, short_threshold=3.0)

            # Trend alignment score (0-100)
            votes = {short_dir: 1, medium_dir: 1, long_dir: 1}
            up_votes = sum(1 for d in (short_dir, medium_dir, long_dir) if d == "up")
            down_votes = sum(1 for d in (short_dir, medium_dir, long_dir) if d == "down")
            if up_votes == 3 or down_votes == 3:
                trend_alignment_score = 100
            elif up_votes == 2 or down_votes == 2:
                trend_alignment_score = 70
            elif up_votes == 1 or down_votes == 1:
                trend_alignment_score = 40
            else:
                trend_alignment_score = 50

            # Momentum sustainability: compare recent short momentum vs medium
            try:
                # short momentum: pct over short window
                short_mom = abs(short_pc)
                medium_mom = abs(medium_pc)
                mom_sustain = 50
                if short_mom and medium_mom:
                    if short_mom >= medium_mom:
                        # accelerating or stable
                        ratio = short_mom / (medium_mom or 1)
                        mom_sustain = int(min(100, 60 + (ratio - 1) * 40))
                    else:
                        # fading
                        ratio = short_mom / (medium_mom or 1)
                        mom_sustain = int(max(0, 40 * ratio))
                elif short_mom:
                    mom_sustain = min(80, int(short_mom * 5))
                else:
                    mom_sustain = 50
            except Exception:
                mom_sustain = 50

            # Trend exhaustion detection
            exhaustion = False
            try:
                rsi_val = None
                try:
                    rsi_val = float(rsi) if rsi is not None else None
                except Exception:
                    rsi_val = None

                if ((rsi_val is not None and rsi_val >= 75) or (mom_sustain < 40 and short_pc > 0) or (volatility_score or 0) >= 70) and (volume_strength or 0) <= 50:
                    exhaustion = True
                    reasoning.append("Current move may be losing structural strength")
            except Exception:
                exhaustion = False

            # Trend sustainability score combines alignment, momentum sustainability, volume participation and volatility stability
            try:
                vol_stability = max(0, 100 - (volatility_score or 50))
                vol_participation = (volume_strength or 50)
                trend_sustainability_score = int(min(100, max(0, (
                    0.4 * trend_alignment_score +
                    0.3 * mom_sustain +
                    0.15 * vol_participation +
                    0.15 * vol_stability
                ))))
            except Exception:
                trend_sustainability_score = 50

            # Apply adjustments based on alignment/sustainability
            if trend_alignment_score < 50 or trend_sustainability_score < 50:
                # reduce confidence sharply and bias HOLD
                final_confidence = max(0.0, final_confidence - 20.0)
                if final_score > 55:
                    final_score = max(50.0, final_score - 12.0)
                reasoning.append("Multi-timeframe alignment remains weak - prefer caution")

            # If momentum is fading while price moves up, reduce BUY conviction
            if short_pc > 0 and mom_sustain < 45:
                final_confidence = max(0.0, final_confidence - 12.0)
                reasoning.append("Momentum strength appears to be weakening despite recent price movement")

            # If exhaustion detected, suppress aggressive BUYs
            if exhaustion:
                final_confidence = max(0.0, final_confidence - 15.0)
                if final_score > 60:
                    final_score = max(50.0, final_score - 15.0)
                reasoning.append("Current move may be losing structural strength")

            # Beginner safety V3: short bullish but medium/long bearish
            if short_dir == "up" and (medium_dir == "down" or long_dir == "down"):
                # avoid strong BUY
                final_confidence = max(0.0, final_confidence - 25.0)
                final_score = max(final_score, 50.0)
                reasoning.append("Short-term movement conflicts with broader trend structure")

            # If alignment high and sustainability strong and regime supportive allow stronger confidence
            supportive_regimes = ("STRONG_BULL", "WEAK_BULL")
            if trend_alignment_score >= 75 and trend_sustainability_score >= 75 and market_regime in supportive_regimes:
                final_confidence = min(100.0, final_confidence + 12.0)
                reasoning.append("Price action remains structurally constructive across multiple timeframes")

        except Exception:
            # Keep existing values on failure
            pass

        # If caller supplied a data quality score, apply stronger adjustments when low
        dq = None
        if data_quality_score is not None:
            try:
                dq = int(data_quality_score)
            except Exception:
                dq = None

        # If upstream provided reconstructed_reasons, add them
        for rr in reconstructed_reasons:
            if rr not in reasoning:
                reasoning.append(rr)

        if dq is not None:
            # mild penalty for moderate data quality, stronger for low quality
            if dq < 80:
                penalty = (80 - dq) / 8.0
                final_confidence = max(0.0, final_confidence - penalty)
                reasoning.append("Analysis confidence reduced due to limited live market data")
            if dq < 40:
                # Force conservative HOLD and cap confidence
                final_signal = "HOLD"
                final_confidence = min(final_confidence, 40.0)
                if "Market data quality limited" not in reasoning:
                    reasoning.append("Market data quality limited")
                if "Using reconstructed indicators" not in reasoning:
                    reasoning.append("Using reconstructed indicators")

        # --- PROFESSIONAL CONFIRMATION LAYER (BEGIN) ---
        # Detect fake breakout risk: strong momentum WITHOUT supporting volume/trend or with very high volatility
        fake_breakout_risk = False
        try:
            if (momentum_strength or 0) >= 65 and (
                (volume_strength or 0) <= 40 or (volatility_score or 0) >= 80 or (trend_strength or 0) <= 50
            ):
                fake_breakout_risk = True
                # Strong penalty to confidence and reduce aggressive BUY score
                final_confidence = max(0.0, final_confidence - 20.0)
                if final_score > 60:
                    final_score = max(50.0, final_score - 15.0)
                reasoning.append("Price movement lacks healthy breakout confirmation")
                reasoning.append("Momentum appears unstable without sufficient volume support")
        except Exception:
            fake_breakout_risk = False

        # Detect overextended/overheated market
        overextended_risk = False
        try:
            rsi_val = None
            try:
                rsi_val = float(rsi) if rsi is not None else None
            except Exception:
                rsi_val = None

            if (
                (rsi_val is not None and rsi_val >= 75) or
                (volatility_score or 0) >= 90 or
                ((momentum_strength or 0) >= 80 and (trend_strength or 0) <= 60)
            ):
                overextended_risk = True
                final_confidence = max(0.0, final_confidence - 15.0)
                # Prevent extreme BUYs
                if final_score > 70:
                    final_score = min(final_score, 70)
                reasoning.append("Market may be overheated after rapid upside movement")
                reasoning.append("Risk of short-term pullback elevated")
        except Exception:
            overextended_risk = False

        # Dead-cat bounce: short-term momentum with confirmed larger bearish trend
        dead_cat_bounce = False
        try:
            bearish_trend_confirmed = (str(trend_7d).lower() in ("down", "downtrend") and (trend_strength or 0) >= 65)
            if (momentum_strength or 0) > 55 and bearish_trend_confirmed:
                dead_cat_bounce = True
                # Bias HOLD and reduce confidence
                final_confidence = max(0.0, final_confidence - 20.0)
                # soften BUYs
                if final_score > 50:
                    final_score = max(50.0, final_score - 10.0)
                reasoning.append("Short-term recovery may not reflect true trend reversal")
        except Exception:
            dead_cat_bounce = False

        # Trend reversal confirmation - require multiple improving signals to confirm a reversal
        reversal_unconfirmed = False
        try:
            # Heuristic: bullish reversal confirmed only if momentum & volume improving and volatility not extreme and trend_strength > neutral
            bullish_reversal_confirmed = (
                (momentum_strength or 0) >= 55 and (volume_strength or 0) >= 55 and (volatility_score or 0) < 75 and (trend_strength or 0) >= 55
            )
            bearish_reversal_confirmed = (
                (momentum_strength or 0) <= 45 and (volume_strength or 0) >= 55 and (trend_strength or 0) <= 45
            )

            if base.get("signal") == "BUY" and not bullish_reversal_confirmed:
                reversal_unconfirmed = True
                final_confidence = max(0.0, final_confidence - 12.0)
                # prevent overly aggressive BUY
                if final_score > 60:
                    final_score = max(50.0, final_score - 8.0)
                reasoning.append("Trend reversal lacks full confirmation")

            if base.get("signal") == "SELL" and not bearish_reversal_confirmed:
                reversal_unconfirmed = True
                final_confidence = max(0.0, final_confidence - 10.0)
                reasoning.append("Trend reversal lacks full confirmation")
        except Exception:
            reversal_unconfirmed = False

        # Smart confidence weighting: increase when all align, sharply reduce when conflicts
        try:
            alignment_count = 0
            if str(trend_7d).lower() in ("up", "uptrend") and (trend_strength or 0) >= 60:
                alignment_count += 1
            if (momentum_strength or 0) >= 60:
                alignment_count += 1
            if (volume_strength or 0) >= 60:
                alignment_count += 1
            # macro_bullish defined earlier
            if 'macro_score' in locals() and macro_bullish:
                alignment_count += 1

            if alignment_count >= 4:
                final_confidence = min(100.0, final_confidence + 10.0)
                reasoning.append("Multiple confirmations across trend, momentum, volume, and macro increase confidence")

            # Conflict detection examples
            conflict_detected = False
            if (momentum_strength or 0) >= 60 and ('macro_score' in locals() and macro_bearish):
                conflict_detected = True
            if str(trend_7d).lower() in ("up", "uptrend") and (volume_strength or 0) <= 40:
                conflict_detected = True
            if (momentum_strength or 0) >= 60 and (volatility_score or 0) >= 75:
                conflict_detected = True

            if conflict_detected:
                final_confidence = max(0.0, final_confidence - 15.0)
                reasoning.append("Indicators conflict across momentum, volume, volatility, and macro signals - reducing confidence")
        except Exception:
            pass

        # Beginner protection mode v2: hard cap on confidence in unstable situations
        try:
            dq_val = dq if dq is not None else 100
            if (volatility_score or 0) >= 80 or fake_breakout_risk or reversal_unconfirmed or (dq_val < 40):
                final_confidence = min(final_confidence, 55.0)
                reasoning.append("Beginner-safe cap applied due to unstable market conditions or low data quality")
        except Exception:
            pass
        # --- PROFESSIONAL CONFIRMATION LAYER (END) ---

        # Apply rules:
        # 1) Strong uptrend + strong momentum + healthy volume => bullish bias
        if trend_7d == "up" and trend_strength >= 65 and momentum_strength >= 60 and volume_strength >= 60:
            final_score += 10.0
            reasoning.append("7d trend remains bullish - strengthening bias")
            reasoning.append("Momentum confirms breakout strength")

        # 2) Sideways trend biases HOLD
        if trend_7d == "sideways":
            # Pull towards HOLD by nudging score to neutral
            final_score = (final_score + 50) / 2
            reasoning.append("7d trend is sideways - biasing toward HOLD")

        # 3) Weak volume prevents strong BUY
        if volume_strength < 40 and final_score > 65:
            final_score -= 12.0
            reasoning.append("Volume support is weak - reducing BUY conviction")

        # 4) High volatility lowers confidence and caps strong BUYs
        if volatility_score >= 75:
            # Reduce confidence proportionally to volatility
            vol_penalty = (volatility_score - 50) / 2.0  # e.g., 80 -> 15
            final_confidence = max(0.0, final_confidence - vol_penalty)
            reasoning.append("High volatility increases risk - lowering confidence")
            # Prevent extreme BUY during extreme volatility
            if final_score > 80:
                final_score = 80

        # 5) Avoid SELL panic during pullbacks: if 7d trend up but score indicates SELL, soften
        if trend_7d == "up" and final_score < 40:
            final_score = max(final_score, 45)
            final_confidence = max(10.0, final_confidence - 10.0)
            reasoning.append("7d trend remains bullish despite short-term weakness - avoid panic SELL")

        # 6) Conflicting indicators reduce confidence: if base confidence high but insights conflict
        # We'll consider conflict when trend_strength and momentum_strength disagree with base score direction
        try:
            base_signal = base.get("signal", "HOLD")
            conflict = False
            if base_signal == "BUY":
                if trend_7d == "down" or momentum_strength < 30:
                    conflict = True
            elif base_signal == "SELL":
                if trend_7d == "up" or momentum_strength > 70:
                    conflict = True

            if conflict:
                final_confidence = max(0.0, final_confidence - 15.0)
                reasoning.append("Indicators conflict with market insights - reduced confidence")
        except Exception:
            # On any edge-case, do not crash
            pass

            # Step: fetch recent news automatically (best-effort)
            try:
                news_events = await fetch_market_news(symbol)
                logger.info("Fetched %d news items for %s", len(news_events), symbol)
            except Exception as e:
                news_events = []
                logger.exception("Failed to fetch news for %s: %s", symbol, e)

            # Macro / News adjustments (conservative)
            try:
                macro_risk = None
                # Classify either fetched news or provided news_events input (prefer fetched)
                source_news = news_events if news_events else []
                if source_news:
                    classified = []
                    for ev in source_news:
                        try:
                            head = ev.get("headline") or ev.get("title") or ""
                            desc = ev.get("description") or ev.get("body") or ""
                            c = classify_news_event(head, desc)
                            classified.append(c)
                        except Exception:
                            continue

                    macro_risk = calculate_macro_risk(classified)

                # Apply conservative macro influence only when macro_risk present
                if macro_risk:
                    risk_score = macro_risk.get("risk_score", 50)
                    # High macro risk reduces BUY confidence
                    if risk_score >= 65 and base.get("signal") == "BUY":
                        reduction = (risk_score - 50) / 3.0  # modest reduction
                        final_confidence = max(0.0, final_confidence - reduction)
                        reasoning.append("Macro conditions remain risk-sensitive - reduced confidence")

                    # Strong bullish macro signals (low risk_score but bullish events) slightly increase confidence
                    if risk_score <= 40 and base.get("signal") == "BUY":
                        final_confidence = min(100.0, final_confidence + 5.0)
                        reasoning.append("ETF/adoption news supports bullish sentiment")

                    # Geopolitical/war risk increases caution
                    for d in macro_risk.get("details", []):
                        if "war/geopolitics" in d or "war" in d or "geopolit" in d:
                            final_confidence = max(0.0, final_confidence - 8.0)
                            reasoning.append("Geopolitical uncertainty increases volatility risk")
                            break

                    # High inflation/interest rate risk reduces aggressive BUY scoring
                    for d in macro_risk.get("details", []):
                        if "inflation" in d or "interest rates" in d or "interest rate" in d:
                            final_score = min(final_score, 75)
                            final_confidence = max(0.0, final_confidence - 7.0)
                            reasoning.append("Inflation/interest rate signals reduce aggressive BUY scoring")
                            break

                    # ETF/adoption news improves bullish confidence (extra reasoning covered above)
            except Exception:
                # If news integration fails, keep prior values and do not crash
                pass

        # === Final confirmation / beginner-safety layer ===
        try:
            # Normalize trend naming (support both 'up'/'down' and 'uptrend'/'downtrend')
            t7 = str(trend_7d).lower() if trend_7d is not None else "neutral"
            # macro_risk may be None or a dict
            macro_score = 50
            if isinstance(macro_risk, dict):
                macro_score = int(macro_risk.get("risk_score", 50) or 50)

            # Confirmation flags
            bullish_trend_confirmed = (t7 in ("up", "uptrend") and (trend_strength or 0) >= 65)
            bearish_trend_confirmed = (t7 in ("down", "downtrend") and (trend_strength or 0) >= 65)
            strong_momentum = (momentum_strength or 0) >= 60
            weak_volume = (volume_strength or 0) <= 40
            high_risk_market = (volatility_score or 0) >= 75
            macro_bearish = macro_score >= 65
            macro_bullish = macro_score <= 35

            # Strict BUY filter: only allow strong BUY confidence when all confirmations present
            if base.get("signal") == "BUY":
                buy_ok = all([
                    bullish_trend_confirmed,
                    strong_momentum,
                    not weak_volume,
                    not high_risk_market,
                    not macro_bearish
                ])

                if not buy_ok:
                    # Gradual reductions, with reasons for the user
                    if not bullish_trend_confirmed:
                        final_confidence = max(0.0, final_confidence - 12.0)
                        reasoning.append("Trend confirmation remains weak")
                    if not strong_momentum:
                        final_confidence = max(0.0, final_confidence - 8.0)
                        final_score = max(0.0, final_score - 8.0)
                        reasoning.append("Momentum is insufficient for high-confidence BUY")
                    if weak_volume:
                        final_confidence = max(0.0, final_confidence - 10.0)
                        final_score = max(0.0, final_score - 10.0)
                        reasoning.append("Volume does not support breakout")
                    if high_risk_market:
                        final_confidence = max(0.0, final_confidence - 12.0)
                        final_score = max(0.0, final_score - 12.0)
                        reasoning.append("Macro risk or volatility prevents aggressive entries")
                    if macro_bearish:
                        final_confidence = max(0.0, final_confidence - 12.0)
                        final_score = max(0.0, final_score - 10.0)
                        reasoning.append("Macro risk prevents aggressive entries")

                    # Bias toward HOLD rather than aggressive BUY
                    if final_score < 60:
                        # nudge signal toward HOLD
                        reasoning.append("Reducing BUY conviction toward HOLD due to missing confirmations")
                        # do not force, but lower score further
                        final_score = max(final_score, 50)

            # Prevent emotional SELLs: soften SELLs when broader structure supportive
            if base.get("signal") == "SELL":
                if macro_bullish or bullish_trend_confirmed:
                    # Reduce SELL severity
                    final_score = max(final_score, 45)
                    final_confidence = min(100.0, final_confidence + 8.0)
                    reasoning.append("Broader market structure remains supportive - soften SELL pressure")
                    reasoning.append("Sell pressure not fully confirmed")

            # Sideways market detection
            if (trend_strength or 0) >= 40 and (trend_strength or 0) <= 60 and (momentum_strength or 0) < 55:
                # Strongly bias toward HOLD
                final_score = (final_score + 50) / 2
                final_confidence = max(0.0, final_confidence - 10.0)
                reasoning.append("Market is consolidating without strong directional conviction")

            # Beginner safety: if confidence too low, force HOLD
            if final_confidence < 45:
                reasoning.append("Signal confidence too low for beginner-safe entry")
                final_signal = "HOLD"
            else:
                final_signal = base.get("signal", "HOLD")

        except Exception:
            # On any error in confirmation layer, preserve previous values
            final_signal = base.get("signal", "HOLD")

        # Clamp score and confidence
        final_score = max(0.0, min(100.0, final_score))
        final_confidence = max(0.0, min(100.0, final_confidence))

        # Convert reasoning to unique list preserving order
        seen = set()
        final_reasoning = []
        for r in reasoning:
            if r not in seen:
                final_reasoning.append(r)
                seen.add(r)

        return {
            "signal": final_signal,
            "score": round(final_score, 1),
            "confidence": round(final_confidence, 1),
            "reasoning": final_reasoning
        }

    except Exception as e:
        # Fail safely: return a conservative HOLD signal with base reasoning if available
        try:
            base = signal_engine.generate_signal(
                rsi=rsi,
                macd=macd,
                macd_signal=macd_signal,
                macd_histogram=macd_histogram,
                price=price,
                ema_short=ema_short,
                ema_long=ema_long,
                momentum=momentum,
            )
            return base
        except Exception:
            return {"signal": "HOLD", "score": 50, "confidence": 0, "reasoning": [f"Error generating signal: {str(e)}"]}
