import pandas as pd
from datetime import date
from pathlib import Path

from universe import TICKERS, BENCHMARK, ALL_TICKERS, SIGNA_TICKERS, AI_SECTOR_TICKERS
from data import fetch_prices
from ranking import rank_universe
from filters import minervini_filters
from signals import macro_trend

OUTPUT_DIR = Path("output")
TOP_N = 15


def build_output(ranked: pd.DataFrame, filter_results: dict, prices: dict) -> pd.DataFrame:
    rows = []
    for _, r in ranked.iterrows():
        ticker = r["ticker"]
        f = filter_results.get(ticker)
        if f is None:
            continue
        prices_df = prices.get(ticker)
        if prices_df is not None and len(prices_df) >= 2:
            day_chg = round(
                (prices_df["Close"].iloc[-1] / prices_df["Close"].iloc[-2] - 1) * 100, 2
            )
            mt = macro_trend(prices_df["Close"])
        else:
            day_chg = 0.0
            mt = {"state": "BULL", "spread_pct": 0.0, "ema_fast": None, "ema_slow": None}
        rows.append({
            "ticker":             ticker,
            "rank":               int(r["rank"]),
            "score":              r["score"],
            "annualized_slope":   r["annualized_slope"],
            "r_squared":          r["r_squared"],
            "m1": f["m1"], "m2": f["m2"], "m3": f["m3"], "m4": f["m4"],
            "m5": f["m5"], "m6": f["m6"], "m7": f["m7"], "m8": f["m8"],
            "all_pass":           f["all_pass"],
            "close":              f["close"],
            "sma50":              f["sma50"],
            "sma150":             f["sma150"],
            "sma200":             f["sma200"],
            "dist_from_52w_high_pct": f["dist_from_52w_high_pct"],
            "ret_5d":             f["ret_5d"],
            "dist_from_10d_high": f["dist_from_10d_high"],
            "pullback":           f["pullback"],
            "day_chg":            day_chg,
            "mt_state":           mt["state"],
            "mt_spread_pct":      mt["spread_pct"],
            "mt_ema_fast":        mt["ema_fast"],
            "mt_ema_slow":        mt["ema_slow"],
        })

    df = pd.DataFrame(rows)
    df = df.sort_values(["all_pass", "score"], ascending=[False, False]).reset_index(drop=True)
    return df


def print_top(df: pd.DataFrame, n: int = TOP_N):
    print(f"\n{'='*78}")
    print(f"  STOCK SCOUT  {date.today()}  |  top {n} of {len(df)} ranked")
    print(f"{'='*78}")
    print(f"{'#':>3}  {'TICKER':<6}  {'SCORE':>7}  {'R2':>5}  "
          f"{'PASS':>4}  {'DIST52H':>7}  {'5D%':>6}  {'10DH%':>6}  {'PB':>3}  FAILED")
    print("-" * 78)

    for _, row in df.head(n).iterrows():
        failed = [f"M{i}" for i in range(1, 9) if not row[f"m{i}"]]
        failed_str = ",".join(failed) if failed else "none"
        pass_str  = "YES" if row["all_pass"] else "no"
        pb_str    = "<<<" if row["pullback"] else ""
        print(
            f"{int(row['rank']):>3}  {row['ticker']:<6}  {row['score']:>7.1f}  "
            f"{row['r_squared']:>5.3f}  {pass_str:>4}  "
            f"{row['dist_from_52w_high_pct']:>+6.1f}%  "
            f"{row['ret_5d']:>+5.1f}%  "
            f"{row['dist_from_10d_high']:>+5.1f}%  "
            f"{pb_str:<3}  {failed_str}"
        )


def print_pullback_entries(df: pd.DataFrame):
    candidates = df[df["all_pass"] & df["pullback"]].copy()
    if candidates.empty:
        print("\n  No pullback entries today (all trending names are extended).")
        return

    print(f"\n{'='*78}")
    print(f"  PULLBACK ENTRIES  |  trending + pulled back >1% in last 5 days")
    print(f"{'='*78}")
    print(f"{'#':>3}  {'TICKER':<6}  {'SCORE':>7}  {'R2':>5}  "
          f"{'5D%':>6}  {'10DH%':>6}  {'DIST52H':>7}  NOTE")
    print("-" * 78)

    for _, row in candidates.iterrows():
        # Qualitative note based on depth of pullback
        depth = row["dist_from_10d_high"]
        if depth > -3:
            note = "shallow — tight stop"
        elif depth > -6:
            note = "moderate — good risk/reward"
        else:
            note = "deep — confirm trend intact"
        print(
            f"{int(row['rank']):>3}  {row['ticker']:<6}  {row['score']:>7.1f}  "
            f"{row['r_squared']:>5.3f}  {row['ret_5d']:>+5.1f}%  "
            f"{row['dist_from_10d_high']:>+5.1f}%  "
            f"{row['dist_from_52w_high_pct']:>+6.1f}%  {note}"
        )


def run_signa(spy_df: pd.DataFrame):
    """Fetch, rank and filter the Signa watchlist; save signa_YYYY-MM-DD.csv."""
    need = [t for t in SIGNA_TICKERS if t != BENCHMARK]
    print(f"\nFetching Signa watchlist ({len(need)} tickers)...")
    prices = fetch_prices(need + [BENCHMARK], period="2y")
    spy = prices.pop(BENCHMARK, spy_df)
    signa_prices = {t: prices[t] for t in need if t in prices}

    print(f"Ranking {len(signa_prices)} Signa tickers...")
    ranked = rank_universe(signa_prices)

    print("Running Minervini filters on Signa tickers...")
    filter_results = minervini_filters(signa_prices, spy)

    df = build_output(ranked, filter_results, signa_prices)
    out_path = OUTPUT_DIR / f"signa_{date.today()}.csv"
    df.to_csv(out_path, index=False)
    print(f"Saved: {out_path}  ({len(df)} rows)")
    return df


def run_ai_sector(spy_df: pd.DataFrame):
    """Fetch, rank and filter the AI Sector watchlist; save ai_sector_YYYY-MM-DD.csv."""
    need = [t for t in AI_SECTOR_TICKERS if t != BENCHMARK]
    print(f"\nFetching AI Sector watchlist ({len(need)} tickers)...")
    prices = fetch_prices(need + [BENCHMARK], period="2y")
    spy = prices.pop(BENCHMARK, spy_df)
    ai_prices = {t: prices[t] for t in need if t in prices}

    print(f"Ranking {len(ai_prices)} AI Sector tickers...")
    ranked = rank_universe(ai_prices)

    print("Running Minervini filters on AI Sector tickers...")
    filter_results = minervini_filters(ai_prices, spy)

    df = build_output(ranked, filter_results, ai_prices)
    out_path = OUTPUT_DIR / f"ai_sector_{date.today()}.csv"
    df.to_csv(out_path, index=False)
    print(f"Saved: {out_path}  ({len(df)} rows)")
    return df


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    print("Loading price data...")
    prices = fetch_prices(ALL_TICKERS, period="2y")
    spy_df = prices.pop(BENCHMARK)
    universe_prices = {t: prices[t] for t in TICKERS if t in prices}

    print(f"\nRanking {len(universe_prices)} tickers...")
    ranked = rank_universe(universe_prices)

    print("Running Minervini filters...")
    filter_results = minervini_filters(universe_prices, spy_df)

    df = build_output(ranked, filter_results, universe_prices)

    out_path = OUTPUT_DIR / f"scout_{date.today()}.csv"
    df.to_csv(out_path, index=False)
    print(f"\nSaved: {out_path}  ({len(df)} rows)")

    print_top(df, TOP_N)
    print_pullback_entries(df)

    run_signa(spy_df)
    run_ai_sector(spy_df)


if __name__ == "__main__":
    main()
