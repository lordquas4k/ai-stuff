import numpy as np
import pandas as pd

TRADING_DAYS_52W = 252
TRADING_DAYS_13W = 65


def _sma(closes: pd.Series, period: int) -> pd.Series:
    return closes.rolling(period).mean()


def minervini_filters(prices: dict, spy_df: pd.DataFrame) -> dict:
    """
    Minervini 8-point trend template applied to each ticker.
    spy_df is used only for the RS filter (m8).
    Returns dict: ticker -> filter booleans + supporting values.
    """
    spy_closes = spy_df["Close"].dropna()

    # --- RS (m8): 13-week return relative to SPY, rank top 30% of universe ---
    spy_13w = spy_closes.iloc[-1] / spy_closes.iloc[-TRADING_DAYS_13W] - 1

    rs_relative = {}
    for ticker, df in prices.items():
        c = df["Close"].dropna()
        if len(c) >= TRADING_DAYS_13W:
            rs_relative[ticker] = (c.iloc[-1] / c.iloc[-TRADING_DAYS_13W] - 1) - spy_13w

    sorted_by_rs = sorted(rs_relative, key=rs_relative.get, reverse=True)
    cutoff = max(1, int(len(sorted_by_rs) * 0.30))
    rs_top30 = set(sorted_by_rs[:cutoff])

    results = {}

    for ticker, df in prices.items():
        closes = df["Close"].dropna()

        if len(closes) < TRADING_DAYS_52W:
            print(f"  {ticker}: skipping — only {len(closes)} bars (need {TRADING_DAYS_52W})")
            continue

        sma50  = _sma(closes, 50)
        sma150 = _sma(closes, 150)
        sma200 = _sma(closes, 200)

        c        = closes.iloc[-1]
        s50      = sma50.iloc[-1]
        s150     = sma150.iloc[-1]
        s200     = sma200.iloc[-1]
        s200_20d = sma200.iloc[-21]   # 20 trading days ago

        high_52w  = closes.iloc[-TRADING_DAYS_52W:].max()
        low_52w   = closes.iloc[-TRADING_DAYS_52W:].min()
        high_10d  = closes.iloc[-10:].max()
        ret_5d    = (c / closes.iloc[-6] - 1) * 100  # 5-trading-day return

        m1 = bool(c > s150 and c > s200)
        m2 = bool(s150 > s200)
        m3 = bool(s200 > s200_20d)
        m4 = bool(s50 > s150 and s50 > s200)
        m5 = bool(c > s50)
        m6 = bool(c >= 1.30 * low_52w)
        m7 = bool(c >= 0.75 * high_52w)
        m8 = ticker in rs_top30

        # Pullback: short-term weakness inside an intact uptrend
        pullback = bool(ret_5d < -1.0 and c > s50)

        results[ticker] = {
            "m1": m1, "m2": m2, "m3": m3, "m4": m4,
            "m5": m5, "m6": m6, "m7": m7, "m8": m8,
            "all_pass": all([m1, m2, m3, m4, m5, m6, m7, m8]),
            "close":    round(c, 2),
            "sma50":    round(s50, 2),
            "sma150":   round(s150, 2),
            "sma200":   round(s200, 2),
            "high_52w": round(high_52w, 2),
            "low_52w":  round(low_52w, 2),
            "dist_from_52w_high_pct": round((c / high_52w - 1) * 100, 1),
            "ret_5d":              round(ret_5d, 2),
            "dist_from_10d_high":  round((c / high_10d - 1) * 100, 1),
            "pullback":            pullback,
        }

    return results
