from typing import Dict, List, Optional, Union


class SignalEngine:
    """
    Dynamic signal scoring engine for crypto trading signals.
    Uses weighted multi-indicator analysis to generate unbiased trading signals.
    """
    
    def __init__(self):
        # Indicator weights (sum to 100)
        # Increased EMA and momentum weights for stronger trend sensitivity
        self.weights = {
            'rsi': 25,
            'macd': 20,
            'ema': 35,
            'momentum': 20
        }
    
    def _validate_input(self, value: Union[float, int, None], name: str) -> float:
        """Validate and normalize input values."""
        if value is None or not isinstance(value, (int, float)):
            raise ValueError(f"Invalid {name}: must be a number")
        return float(value)
    
    def _calculate_rsi_score(self, rsi: float) -> float:
        """
        Calculate RSI contribution to score (0-100).
        RSI < 30: Oversold (bullish bias)
        RSI 30-40: Strong bullish zone
        RSI > 70: Overbought (bearish bias)
        RSI 60-70: Strong bearish zone
        """
        if rsi < 30:
            # Deep oversold - very strong bullish
            return 50 + (30 - rsi) * 2.5
        elif rsi < 40:
            # Oversold to neutral - strong bullish
            return 50 + (40 - rsi) * 1.5
        elif rsi > 70:
            # Deep overbought - very strong bearish
            return 50 - (rsi - 70) * 2.5
        elif rsi > 60:
            # Overbought to neutral - strong bearish
            return 50 - (rsi - 60) * 1.5
        else:
            # Neutral zone
            return 50
    
    def _calculate_macd_score(self, macd: float, signal: float, histogram: float) -> float:
        """
        Calculate MACD contribution to score (0-100).
        MACD above signal: bullish
        MACD below signal: bearish
        Histogram direction: momentum confirmation
        """
        if macd > signal:
            # Bullish crossover
            base_score = 60
            # Add histogram strength
            if histogram > 0:
                base_score += min(histogram * 10, 30)
            return min(base_score, 100)
        elif macd < signal:
            # Bearish crossover
            base_score = 40
            # Subtract histogram strength
            if histogram < 0:
                base_score += max(histogram * 10, -30)
            return max(base_score, 0)
        else:
            # Neutral
            return 50
    
    def _calculate_ema_score(self, price: float, ema_short: float, ema_long: float) -> float:
        """
        Calculate EMA trend contribution to score (0-100).
        Price above both EMAs: strong uptrend (+30 impact)
        Price below both EMAs: strong downtrend (-30 impact)
        EMAs crossing: trend change
        """
        if price > ema_short > ema_long:
            # Strong uptrend - maximum bullish boost
            return 85
        elif price < ema_short < ema_long:
            # Strong downtrend - maximum bearish penalty
            return 15
        elif ema_short > ema_long:
            # Bullish alignment but price below
            return 60
        elif ema_short < ema_long:
            # Bearish alignment but price above
            return 40
        else:
            # Neutral
            return 50
    
    def _calculate_momentum_score(self, momentum: float) -> float:
        """
        Calculate price momentum contribution to score (0-100).
        Positive momentum > +3%: strong bullish
        Negative momentum < -3%: strong bearish
        """
        # Normalize momentum to 0-100 range with stronger sensitivity
        # Assuming momentum is percentage change
        if momentum > 3:
            # Strong positive momentum
            return min(50 + momentum * 8, 100)
        elif momentum < -3:
            # Strong negative momentum
            return max(50 + momentum * 8, 0)
        else:
            # Mild momentum - linear scaling
            return 50 + momentum * 5
    
    def _get_rsi_vote(self, rsi: float) -> str:
        """Determine RSI vote: BUY, SELL, or NEUTRAL."""
        if rsi < 40:
            return "BUY"
        elif rsi > 60:
            return "SELL"
        else:
            return "NEUTRAL"
    
    def _get_macd_vote(self, macd: float, signal: float) -> str:
        """Determine MACD vote: BUY, SELL, or NEUTRAL."""
        if macd > signal:
            return "BUY"
        elif macd < signal:
            return "SELL"
        else:
            return "NEUTRAL"
    
    def _get_ema_vote(self, price: float, ema_short: float, ema_long: float) -> str:
        """Determine EMA vote: BUY, SELL, or NEUTRAL."""
        if price > ema_short > ema_long:
            return "BUY"
        elif price < ema_short < ema_long:
            return "SELL"
        else:
            return "NEUTRAL"
    
    def _get_momentum_vote(self, momentum: float) -> str:
        """Determine momentum vote: BUY, SELL, or NEUTRAL."""
        if momentum > 2:
            return "BUY"
        elif momentum < -2:
            return "SELL"
        else:
            return "NEUTRAL"
    
    def _calculate_agreement_confidence(self, votes: Dict[str, str], final_signal: str) -> float:
        """
        Calculate confidence based on indicator agreement.
        
        Args:
            votes: Dictionary of indicator votes
            final_signal: The final signal (BUY, SELL, or HOLD)
        
        Returns:
            Confidence score (0-100) based on agreement level
        """
        if not votes:
            return 0
        
        # Count votes that agree with the final signal
        agreement_count = 0
        total_votes = len(votes)
        
        for indicator, vote in votes.items():
            if final_signal == "BUY" and vote == "BUY":
                agreement_count += 1
            elif final_signal == "SELL" and vote == "SELL":
                agreement_count += 1
            elif final_signal == "HOLD" and vote == "NEUTRAL":
                agreement_count += 1
        
        # Calculate agreement percentage
        agreement_pct = (agreement_count / total_votes) * 100
        
        # Map agreement to confidence ranges
        if agreement_pct >= 75:  # 3-4 indicators aligned (high agreement)
            return 70 + (agreement_pct - 75) * 1  # 70-95 range
        elif agreement_pct >= 50:  # 2 indicators aligned (medium agreement)
            return 40 + (agreement_pct - 50) * 1.2  # 40-70 range
        else:  # 0-1 indicators aligned (low agreement)
            return 10 + agreement_pct * 0.3  # 10-40 range
    
    def generate_signal(
        self,
        rsi: Optional[float] = None,
        macd: Optional[float] = None,
        macd_signal: Optional[float] = None,
        macd_histogram: Optional[float] = None,
        price: Optional[float] = None,
        ema_short: Optional[float] = None,
        ema_long: Optional[float] = None,
        momentum: Optional[float] = None
    ) -> Dict:
        """
        Generate trading signal based on multiple indicators.
        
        Args:
            rsi: RSI value (0-100)
            macd: MACD line value
            macd_signal: MACD signal line value
            macd_histogram: MACD histogram value
            price: Current price
            ema_short: Short-term EMA
            ema_long: Long-term EMA
            momentum: Price momentum (percentage change)
        
        Returns:
            Dict with signal, score, confidence, and reasoning
        """
        reasoning = []
        scores = {}
        
        try:
            # Calculate individual indicator scores
            if rsi is not None:
                rsi = self._validate_input(rsi, 'RSI')
                scores['rsi'] = self._calculate_rsi_score(rsi)
                if rsi < 30:
                    reasoning.append(f"RSI {rsi:.1f} indicates oversold conditions")
                elif rsi > 70:
                    reasoning.append(f"RSI {rsi:.1f} indicates overbought conditions")
                else:
                    reasoning.append(f"RSI {rsi:.1f} in neutral zone")
            
            if all(v is not None for v in [macd, macd_signal, macd_histogram]):
                macd = self._validate_input(macd, 'MACD')
                macd_signal = self._validate_input(macd_signal, 'MACD Signal')
                macd_histogram = self._validate_input(macd_histogram, 'MACD Histogram')
                scores['macd'] = self._calculate_macd_score(macd, macd_signal, macd_histogram)
                if macd > macd_signal:
                    reasoning.append(f"MACD ({macd:.4f}) above signal ({macd_signal:.4f}) - bullish")
                else:
                    reasoning.append(f"MACD ({macd:.4f}) below signal ({macd_signal:.4f}) - bearish")
            
            if all(v is not None for v in [price, ema_short, ema_long]):
                price = self._validate_input(price, 'Price')
                ema_short = self._validate_input(ema_short, 'EMA Short')
                ema_long = self._validate_input(ema_long, 'EMA Long')
                scores['ema'] = self._calculate_ema_score(price, ema_short, ema_long)
                if price > ema_short > ema_long:
                    reasoning.append(f"Price above both EMAs - strong uptrend")
                elif price < ema_short < ema_long:
                    reasoning.append(f"Price below both EMAs - strong downtrend")
                else:
                    reasoning.append("Mixed EMA signals - trend uncertainty")
            
            if momentum is not None:
                momentum = self._validate_input(momentum, 'Momentum')
                scores['momentum'] = self._calculate_momentum_score(momentum)
                if momentum > 0:
                    reasoning.append(f"Positive momentum {momentum:.2f}%")
                else:
                    reasoning.append(f"Negative momentum {momentum:.2f}%")
            
            # Calculate weighted final score
            if not scores:
                return {
                    "signal": "HOLD",
                    "score": 50,
                    "confidence": 0,
                    "reasoning": ["No valid indicators provided"]
                }
            
            weighted_sum = sum(scores.get(key, 50) * weight for key, weight in self.weights.items())
            total_weight = sum(self.weights.values())
            final_score = weighted_sum / total_weight
            
            # Determine signal based on score
            if final_score > 65:
                signal = "BUY"
            elif final_score < 35:
                signal = "SELL"
            else:
                signal = "HOLD"
            
            # Calculate confidence based on indicator agreement
            votes = {}
            if rsi is not None:
                votes['rsi'] = self._get_rsi_vote(rsi)
            if all(v is not None for v in [macd, macd_signal]):
                votes['macd'] = self._get_macd_vote(macd, macd_signal)
            if all(v is not None for v in [price, ema_short, ema_long]):
                votes['ema'] = self._get_ema_vote(price, ema_short, ema_long)
            if momentum is not None:
                votes['momentum'] = self._get_momentum_vote(momentum)
            
            confidence = self._calculate_agreement_confidence(votes, signal)
            
            # Add score-based reasoning
            if signal == "BUY":
                reasoning.append(f"Weighted score {final_score:.1f} indicates bullish bias")
            elif signal == "SELL":
                reasoning.append(f"Weighted score {final_score:.1f} indicates bearish bias")
            else:
                reasoning.append(f"Weighted score {final_score:.1f} indicates neutral stance")
            
            return {
                "signal": signal,
                "score": round(final_score, 1),
                "confidence": round(confidence, 1),
                "reasoning": reasoning
            }
            
        except ValueError as e:
            return {
                "signal": "HOLD",
                "score": 50,
                "confidence": 0,
                "reasoning": [f"Input error: {str(e)}"]
            }
        except Exception as e:
            return {
                "signal": "HOLD",
                "score": 50,
                "confidence": 0,
                "reasoning": [f"Unexpected error: {str(e)}"]
            }


def test_signal_engine():
    """
    Test function to validate the signal engine with 3 market scenarios.
    """
    engine = SignalEngine()
    
    print("=" * 80)
    print("SIGNAL ENGINE TEST")
    print("=" * 80)
    
    # Scenario A: Bullish market
    print("\n--- SCENARIO A: BULLISH MARKET ---")
    print("RSI: 35, MACD: 0.0025 (above signal), EMA: Price above both, Momentum: +5%")
    result_a = engine.generate_signal(
        rsi=35,
        macd=0.0025,
        macd_signal=0.0015,
        macd_histogram=0.0010,
        price=50000,
        ema_short=49500,
        ema_long=48000,
        momentum=5.0
    )
    print(f"Signal: {result_a['signal']}")
    print(f"Score: {result_a['score']}")
    print(f"Confidence: {result_a['confidence']}")
    print("Reasoning:")
    for reason in result_a['reasoning']:
        print(f"  - {reason}")
    
    print("\n" + "-" * 80)
    
    # Scenario B: Bearish market
    print("\n--- SCENARIO B: BEARISH MARKET ---")
    print("RSI: 75, MACD: -0.0020 (below signal), EMA: Price below both, Momentum: -6%")
    result_b = engine.generate_signal(
        rsi=75,
        macd=-0.0020,
        macd_signal=-0.0010,
        macd_histogram=-0.0010,
        price=45000,
        ema_short=45500,
        ema_long=47000,
        momentum=-6.0
    )
    print(f"Signal: {result_b['signal']}")
    print(f"Score: {result_b['score']}")
    print(f"Confidence: {result_b['confidence']}")
    print("Reasoning:")
    for reason in result_b['reasoning']:
        print(f"  - {reason}")
    
    print("\n" + "-" * 80)
    
    # Scenario C: Sideways market
    print("\n--- SCENARIO C: SIDEWAYS MARKET ---")
    print("RSI: 50, MACD: 0.0001 (near signal), EMA: Price near EMAs, Momentum: +0.5%")
    result_c = engine.generate_signal(
        rsi=50,
        macd=0.0001,
        macd_signal=0.0000,
        macd_histogram=0.0001,
        price=47500,
        ema_short=47450,
        ema_long=47550,
        momentum=0.5
    )
    print(f"Signal: {result_c['signal']}")
    print(f"Score: {result_c['score']}")
    print(f"Confidence: {result_c['confidence']}")
    print("Reasoning:")
    for reason in result_c['reasoning']:
        print(f"  - {reason}")
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)
    
    # Summary
    print("\n--- SUMMARY ---")
    print(f"Bullish scenario: {result_a['signal']} (score: {result_a['score']})")
    print(f"Bearish scenario: {result_b['signal']} (score: {result_b['score']})")
    print(f"Sideways scenario: {result_c['signal']} (score: {result_c['score']})")
    
    expected = {"BUY", "SELL", "HOLD"}
    actual = {result_a['signal'], result_b['signal'], result_c['signal']}
    
    if expected == actual:
        print("\n✓ All three signal types generated correctly")
    else:
        print(f"\n✗ Expected {expected}, got {actual}")


if __name__ == "__main__":
    test_signal_engine()
