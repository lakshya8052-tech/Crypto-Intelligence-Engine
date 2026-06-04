from typing import Dict, List, Tuple


def _safe_text(headline: str, description: str) -> str:
    try:
        parts = []
        if headline:
            parts.append(str(headline))
        if description:
            parts.append(str(description))
        return " ".join(parts).lower()
    except Exception:
        return ""


# Category keywords (simple rule-based mapping)
CATEGORY_KEYWORDS = {
    "ETF": ["etf", "exchange-traded fund", "spot etf", "approval", "approved"],
    "regulation": ["regulat", "ban", "ban on", "lawsuit", "ruling", "compliance", "fine", "sanction"],
    "exchange hack": ["hack", "breach", "exploit", "compromise", "security breach"],
    "war/geopolitics": ["war", "invasion", "sanction", "geopolit", "conflict", "missile", "attacked"],
    "inflation": ["inflation", "cpi", "consumer price", "price index"],
    "interest rates": ["interest rate", "fed", "rate hike", "rate cut", "federal reserve", "central bank"],
    "tariffs/trade": ["tariff", "trade war", "trade deal", "tariffs"],
    "oil/energy": ["oil", "opec", "energy", "barrel", "crude", "gasoline"],
    "whale activity": ["whale", "large transfer", "wallet", "movement to exchange", "whale moved"]
}


# Sentiment keywords
BULLISH_KEYWORDS = ["approval", "approved", "adoption", "partnership", "launch", "support", "upgrade", "bullish", "outperform"]
BEARISH_KEYWORDS = ["hack", "breach", "ban", "lawsuit", "collapse", "downturn", "selloff", "war", "attack", "sanction"]
NEUTRAL_KEYWORDS = ["uncertainty", "volatility", "mixed", "unclear", "delayed", "postponed"]


def classify_news_event(headline: str, description: str) -> Dict:
    """Classify a news item into category, sentiment and compute an initial impact/confidence.

    Returns a dict:
      { category, sentiment, impact_score, confidence, reasoning }

    Safe: returns neutral output on any error or missing input.
    """
    try:
        text = _safe_text(headline, description)

        if not text:
            return {
                "category": "unknown",
                "sentiment": "neutral",
                "impact_score": 50,
                "confidence": 50,
                "reasoning": ["Empty or malformed news content"]
            }

        matched_cats: List[Tuple[str, int]] = []
        reasoning: List[str] = []

        # Find categories
        for cat, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if kw in text:
                    matched_cats.append((cat, len(kw)))
                    reasoning.append(f"matched keyword '{kw}' for category '{cat}'")
                    break

        category = matched_cats[0][0] if matched_cats else "other"

        # Sentiment detection
        sentiment = "neutral"
        sentiment_hits = 0
        for kw in BULLISH_KEYWORDS:
            if kw in text:
                sentiment = "bullish"
                sentiment_hits += 1
                reasoning.append(f"bullish keyword '{kw}' detected")
        for kw in BEARISH_KEYWORDS:
            if kw in text:
                sentiment = "bearish"
                sentiment_hits += 1
                reasoning.append(f"bearish keyword '{kw}' detected")
        for kw in NEUTRAL_KEYWORDS:
            if kw in text:
                sentiment = "neutral"
                sentiment_hits += 1
                reasoning.append(f"neutral/caution keyword '{kw}' detected")

        # Adjust sentiment when conflicting hits exist
        if sentiment_hits > 1 and any(k in text for k in ("and", "but", "however", ",")):
            # presence of conjunctions with multiple hits suggests mixed signals
            sentiment = "neutral"
            reasoning.append("mixed signals detected; setting sentiment to neutral")

        impact_score, confidence = score_market_impact(category, sentiment)

        return {
            "category": category,
            "sentiment": sentiment,
            "impact_score": int(impact_score),
            "confidence": int(confidence),
            "reasoning": reasoning or ["No specific keywords matched; neutral classification"]
        }

    except Exception:
        return {
            "category": "unknown",
            "sentiment": "neutral",
            "impact_score": 50,
            "confidence": 50,
            "reasoning": ["Error classifying news; returned neutral values"]
        }


def score_market_impact(event_type: str, sentiment: str) -> Tuple[int, int]:
    """Score expected market impact based on event type and sentiment.

    Returns (impact_score 0-100, confidence 0-100).
    """
    try:
        base_importance = {
            "ETF": 90,
            "regulation": 85,
            "exchange hack": 80,
            "war/geopolitics": 85,
            "inflation": 90,
            "interest rates": 95,
            "tariffs/trade": 70,
            "oil/energy": 70,
            "whale activity": 60,
            "other": 50,
            "unknown": 50
        }

        importance = base_importance.get(event_type, 50)

        # Sentiment adjustments
        if sentiment == "bullish":
            impact = importance
            confidence = min(95, 50 + int(importance * 0.4))
        elif sentiment == "bearish":
            impact = importance
            confidence = min(95, 55 + int(importance * 0.45))
        else:
            impact = int(importance * 0.6)
            confidence = 50

        # Cap values
        impact_score = max(0, min(100, int(impact)))
        confidence = max(0, min(100, int(confidence)))

        return impact_score, confidence

    except Exception:
        return 50, 50


def calculate_macro_risk(news_events: List[Dict]) -> Dict:
    """Aggregate a list of classified news events into a macro risk profile.

    Returns:
      { risk_score: 0-100, details: [reasons], breakdown: {category: aggregated_score} }

    Safe: returns neutral risk when input malformed.
    """
    try:
        if not news_events:
            return {"risk_score": 50, "details": ["No events provided"], "breakdown": {}}

        # Weight macro-sensitive categories higher
        macro_categories = {"inflation", "interest rates", "tariffs/trade", "war/geopolitics", "oil/energy"}

        total_weight = 0.0
        weighted_sum = 0.0
        breakdown: Dict[str, float] = {}
        details: List[str] = []

        for ev in news_events:
            try:
                cat = ev.get("category", "other")
                impact = float(ev.get("impact_score", 50))
                sentiment = ev.get("sentiment", "neutral")

                weight = 2.0 if cat in macro_categories else 1.0
                # Bearish macro events increase risk contribution; bullish reduce it
                direction = 1.0
                if sentiment == "bullish":
                    direction = -1.0
                elif sentiment == "neutral":
                    direction = 0.0

                contrib = weight * (impact / 100.0) * direction
                weighted_sum += contrib
                total_weight += weight

                breakdown[cat] = breakdown.get(cat, 0.0) + impact * weight
                details.append(f"{cat}: {sentiment} (impact {impact})")
            except Exception:
                # skip malformed event but keep processing
                details.append("skipped malformed event")
                continue

        if total_weight == 0:
            return {"risk_score": 50, "details": details, "breakdown": breakdown}

        # Normalize weighted_sum to a 0-100 risk scale where higher means more macro risk
        # weighted_sum can be negative (bullish skew). We map -1.0..+1.0 to 0..100 with 50 neutral.
        normalized = (weighted_sum / total_weight)  # in approx -1..1
        risk_score = int(max(0, min(100, round(50 + normalized * 50))))

        return {"risk_score": risk_score, "details": details, "breakdown": breakdown}

    except Exception:
        return {"risk_score": 50, "details": ["Error aggregating events"], "breakdown": {}}


__all__ = ["classify_news_event", "score_market_impact", "calculate_macro_risk"]
