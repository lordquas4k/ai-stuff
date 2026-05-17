import pandas as pd


def macro_trend(closes: pd.Series, fast: int = 12, slow: int = 25,
                fresh_window: int = 4) -> dict:
    """Weekly EMA crossover signal — '12/25 W' Macro Trend.

    Returns {state, spread_pct, ema_fast, ema_slow}.
    state ∈ {BULL, FRESH_BULL, BEAR, FRESH_BEAR}.
    fresh_window: how many weeks back to look for the cross.
    """
    weekly = closes.resample("W").last().dropna()
    if len(weekly) < slow + fresh_window + 2:
        return {"state": "BULL", "spread_pct": 0.0, "ema_fast": None, "ema_slow": None}

    ema_f = weekly.ewm(span=fast, adjust=False).mean()
    ema_s = weekly.ewm(span=slow, adjust=False).mean()

    above_now  = ema_f.iloc[-1] > ema_s.iloc[-1]
    above_then = ema_f.iloc[-fresh_window - 1] > ema_s.iloc[-fresh_window - 1]

    if   above_now and not above_then: state = "FRESH_BULL"
    elif above_now:                    state = "BULL"
    elif not above_now and above_then: state = "FRESH_BEAR"
    else:                              state = "BEAR"

    spread = float((ema_f.iloc[-1] - ema_s.iloc[-1]) / ema_s.iloc[-1] * 100)
    return {
        "state": state,
        "spread_pct": round(spread, 2),
        "ema_fast": round(float(ema_f.iloc[-1]), 2),
        "ema_slow": round(float(ema_s.iloc[-1]), 2),
    }
