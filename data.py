import yfinance as yf
import pandas as pd
from pathlib import Path
from datetime import date, timedelta

CACHE_DIR = Path("cache")
MIN_BARS = 200
BATCH_SIZE = 50


def _safe_filename(ticker: str) -> str:
    return ticker.replace("-", "_")


def _fetch_ticker(ticker: str, **kwargs) -> pd.DataFrame:
    """Single-ticker fetch via yfinance Ticker object."""
    t = yf.Ticker(ticker)
    df = t.history(auto_adjust=True, **kwargs)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df.index = pd.to_datetime(df.index).tz_localize(None)
    cols = [c for c in ["Open", "High", "Low", "Close", "Volume"] if c in df.columns]
    return df[cols]


def _batch_fetch(tickers: list, period: str) -> dict:
    """Download a list of uncached tickers in chunks via yf.download."""
    result = {}
    n_batches = max(1, (len(tickers) - 1) // BATCH_SIZE + 1)

    for i in range(0, len(tickers), BATCH_SIZE):
        chunk = tickers[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        print(f"  Batch {batch_num}/{n_batches} — {len(chunk)} tickers...", end=" ", flush=True)
        try:
            raw = yf.download(
                chunk, period=period, auto_adjust=True,
                group_by="ticker", progress=False, threads=True
            )
            ok = 0
            for ticker in chunk:
                try:
                    df = raw[ticker] if len(chunk) > 1 else raw
                    if isinstance(df.columns, pd.MultiIndex):
                        df.columns = df.columns.get_level_values(0)
                    df.index = pd.to_datetime(df.index).tz_localize(None)
                    cols = [c for c in ["Open", "High", "Low", "Close", "Volume"] if c in df.columns]
                    df = df[cols].dropna(how="all")
                    if df.empty or len(df) < MIN_BARS:
                        continue
                    (CACHE_DIR / f"{_safe_filename(ticker)}.parquet").write_bytes(
                        pd.DataFrame(df).to_parquet()
                    )
                    result[ticker] = df
                    ok += 1
                except Exception:
                    pass
            print(f"{ok}/{len(chunk)} ok")
        except Exception as e:
            print(f"error — {e}")

    return result


def fetch_prices(tickers: list, period: str = "2y") -> dict:
    CACHE_DIR.mkdir(exist_ok=True)
    result = {}
    uncached = []
    cache_hits = 0
    gaps_filled = 0

    for ticker in tickers:
        cache_file = CACHE_DIR / f"{_safe_filename(ticker)}.parquet"
        if cache_file.exists():
            try:
                df = pd.read_parquet(cache_file)
                last_date = df.index[-1].date()
                today = date.today()
                if last_date < today - timedelta(days=1):
                    gap_start = (last_date + timedelta(days=1)).strftime("%Y-%m-%d")
                    try:
                        new_df = _fetch_ticker(ticker, start=gap_start)
                        if not new_df.empty:
                            df = pd.concat([df, new_df])
                            df = df[~df.index.duplicated(keep="last")]
                            df.sort_index(inplace=True)
                            df.to_parquet(cache_file)
                            gaps_filled += 1
                    except Exception:
                        pass
                if len(df) >= MIN_BARS:
                    result[ticker] = df
                    cache_hits += 1
                else:
                    print(f"  {ticker}: only {len(df)} bars — skipping")
            except Exception as e:
                print(f"  {ticker}: cache error — {e}")
                uncached.append(ticker)
        else:
            uncached.append(ticker)

    if cache_hits:
        gap_note = f", {gaps_filled} gaps filled" if gaps_filled else ""
        print(f"  Cache: {cache_hits} tickers loaded{gap_note}")

    if uncached:
        print(f"  {len(uncached)} new tickers — batch downloading ({BATCH_SIZE}/chunk)...")
        batch_result = _batch_fetch(uncached, period)
        result.update(batch_result)
        skipped = len(uncached) - len(batch_result)
        if skipped:
            print(f"  Note: {skipped} tickers skipped (no data or <{MIN_BARS} bars)")

    return result
