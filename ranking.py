import numpy as np
import pandas as pd

LOOKBACK = 90


def clenow_score(closes: pd.Series) -> dict:
    """
    Clenow 'Stocks on the Move' momentum score.
    Returns annualized_slope, r_squared, and score (slope * r²).
    Returns None values if insufficient data.
    """
    closes = closes.dropna()
    if len(closes) < LOOKBACK:
        return {"annualized_slope": None, "r_squared": None, "score": None}

    y = np.log(closes.iloc[-LOOKBACK:].values)
    x = np.arange(len(y))

    # OLS: slope and intercept
    x_mean, y_mean = x.mean(), y.mean()
    ss_xx = ((x - x_mean) ** 2).sum()
    ss_xy = ((x - x_mean) * (y - y_mean)).sum()
    slope = ss_xy / ss_xx
    intercept = y_mean - slope * x_mean

    # R²
    y_hat = slope * x + intercept
    ss_res = ((y - y_hat) ** 2).sum()
    ss_tot = ((y - y_mean) ** 2).sum()
    r_squared = 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0

    # Annualize the daily log-slope
    annualized_slope = (np.exp(slope * 252) - 1) * 100

    return {
        "annualized_slope": round(annualized_slope, 2),
        "r_squared": round(r_squared, 4),
        "score": round(annualized_slope * r_squared, 2),
    }


def rank_universe(prices: dict) -> pd.DataFrame:
    """
    Compute Clenow score for every ticker in prices dict.
    Returns DataFrame sorted by score descending with rank column.
    """
    rows = []
    for ticker, df in prices.items():
        result = clenow_score(df["Close"])
        rows.append({"ticker": ticker, **result})

    df_out = pd.DataFrame(rows)
    df_out = df_out.dropna(subset=["score"])
    df_out = df_out.sort_values("score", ascending=False).reset_index(drop=True)
    df_out.insert(0, "rank", df_out.index + 1)
    return df_out
