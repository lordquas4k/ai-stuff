import json
import pandas as pd
from pathlib import Path

BENCHMARK = "SPY"
_TICKER_CACHE = Path("cache/sp500_tickers.json")


def _fetch_sp500_from_wiki() -> list:
    import requests, io
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; stock-scout/1.0)"}
    html = requests.get(url, headers=headers, timeout=15).text
    df = pd.read_html(io.StringIO(html))[0]
    tickers = df["Symbol"].str.replace(".", "-", regex=False).tolist()
    return sorted(set(tickers))


def load_tickers(refresh: bool = False) -> list:
    """Return S&P 500 tickers, fetching from Wikipedia when cache is absent."""
    _TICKER_CACHE.parent.mkdir(exist_ok=True)
    if not refresh and _TICKER_CACHE.exists():
        return json.loads(_TICKER_CACHE.read_text())
    print("Fetching S&P 500 tickers from Wikipedia...", end=" ", flush=True)
    try:
        tickers = _fetch_sp500_from_wiki()
        _TICKER_CACHE.write_text(json.dumps(tickers))
        print(f"{len(tickers)} tickers cached.")
        return tickers
    except Exception as e:
        print(f"FAILED: {e}")
        if _TICKER_CACHE.exists():
            print("Falling back to cached list.")
            return json.loads(_TICKER_CACHE.read_text())
        raise


TICKERS = load_tickers()
ALL_TICKERS = TICKERS + [BENCHMARK]

SIGNA_TICKERS = [
    "BKSY", "LASR", "GLW", "BE", "SWMR", "SNDK", "LAES", "LPTH", "ABSI",
    "IMNM", "MOB", "AVAV", "ONDS", "KTOS", "RDW", "AAPL", "RKLB", "ASTS",
    "GEV", "MU", "EWY", "DRAM", "PL", "AVGO", "SPY", "QQQ", "GOOGL",
    "WYFI", "AMZN", "GS", "C", "VOYG", "FLY",
]

AI_SECTOR_TICKERS = [
    "NVDA", "AMD", "TSM", "000660.KS", "MU", "ASML", "AMAT", "LRCX", "KLAC",
    "8035.T", "AVGO", "MRVL", "ASX", "CEG", "VST", "CCJ", "VRT", "ETN",
    "SU.PA", "PWR", "ANET", "COHR", "MSFT", "GOOGL", "META", "AMZN", "PLTR",
    "NOC", "LHX", "TSLA", "6861.T", "6954.T", "ROK",
]
