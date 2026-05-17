# Stock Scout v2 — Backend Handoff

This doc tells Claude Code (or you) how to wire the v2 dashboard into the existing Python scout pipeline.

## What's already done (frontend)

Three files in `output/` (or wherever you put them):
- `Stock Scout v2.html` — static. Don't regenerate.
- `stock-scout-app.js` — static. Classifier (PULLBACK / BREAKOUT / TRENDING / CAUTION / EXTENDED / BASING / WEAK), trade plan generator, table renderer, detail panel, LCD ticker tape, narrative. **Don't regenerate.**
- `stock-scout-data.js` — **THIS is what Python needs to produce each scan.**

The HTML imports the JS files via `<script src>`. As long as `stock-scout-data.js` exists in the same folder with the right shape, the app works.

## Schema `stock-scout-data.js` must export

```js
const SCAN_DATE = "YYYY-MM-DD";
const UNIVERSE = "S&P 500";
const SPY = { close: 592.40, change_pct: 0.32 };

const SECTOR_OF = { TICKER: "Tech" | "Healthcare" | "Financials" | "Cons. Disc." |
                            "Industrials" | "Comm. Svcs" | "Energy" | "Staples" |
                            "Utilities" | "Real Estate" | "Materials", ... };

const SECTOR_COLORS = { /* unchanged from current file — keep as-is */ };

const DATA       = [/* full universe scan rows */];
const SIGNA      = [/* signa watchlist scan rows */];
const AI_SECTOR  = [/* ai sector watchlist scan rows */];

const XO_DATA = {
  TICKER: { state: "BULL" | "FRESH_BULL" | "BEAR" | "FRESH_BEAR", spread: 4.2 },
  ...
};
```

### Each row shape (matches existing CSV + 4 new fields)
```js
{
  ticker: "AAPL",
  rank: 153,
  score: 6.10,
  r_squared: 0.2432,
  m1: 1, m2: 1, m3: 1, m4: 0, m5: 1, m6: 1, m7: 1, m8: 0,
  all_pass: 0,
  close: 300.23,
  sma50: 265.97, sma150: 266.35, sma200: 258.65,
  dist_52h: 0.0,
  ret_5d: 2.45,
  dist_10dh: 0.0,
  pullback: 0,
  day_chg: 0.82          // NEW — single-day % change
}
```

The four NEW fields (`xo_state`, `xo_spread_pct`, `xo_ema_fast`, `xo_ema_slow`)
are auto-merged by `mergeXO()` in the data file — you only need to populate `XO_DATA`.

`day_chg` is a simple add: `(close_today / close_yesterday - 1) * 100`. The Python
pipeline already has the price history.

## Python work

### 1. New file: `signals.py`

```python
import pandas as pd

def xo_macro_trend(closes: pd.Series, fast: int = 12, slow: int = 25,
                   fresh_window: int = 4) -> dict:
    """Weekly EMA crossover signal — '12/25 W' a la XO Macro Trend.

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
```

### 2. Modify `scout.py`

In `build_output()`, after the existing fields, add:

```python
from signals import xo_macro_trend

# inside the for loop, after computing existing fields:
prices_df = price_lookup[ticker]            # the full price DataFrame
xo = xo_macro_trend(prices_df["Close"])
rows.append({
    ...existing fields...,
    "day_chg": round((prices_df["Close"].iloc[-1] / prices_df["Close"].iloc[-2] - 1) * 100, 2),
    "xo_state":      xo["state"],
    "xo_spread_pct": xo["spread_pct"],
    "xo_ema_fast":   xo["ema_fast"],
    "xo_ema_slow":   xo["ema_slow"],
})
```

You'll need to pass the prices dict through to `build_output()` — currently it
takes `ranked` and `filter_results` only. Add `prices` as a third arg.

### 3. New file: `generate_dashboard_v2.py` (or extend dashboard.py)

Reads the three latest CSVs (scout, signa, ai_sector), writes
`output/stock-scout-data.js` with the exact shape above, then opens the v2 HTML.

```python
import csv, json
from pathlib import Path

OUTPUT_DIR = Path("output")
SECTOR_MAP = {...}  # copy from existing dashboard.py SECTOR_ABBREV

def csv_to_rows(path):
    rows = []
    with open(path, newline="") as f:
        for r in csv.DictReader(f):
            rows.append({
                "ticker":    r["ticker"],
                "rank":      int(r["rank"]),
                "score":     float(r["score"]),
                "r_squared": float(r["r_squared"]),
                "m1": int(r["m1"] == "True"), "m2": int(r["m2"] == "True"),
                "m3": int(r["m3"] == "True"), "m4": int(r["m4"] == "True"),
                "m5": int(r["m5"] == "True"), "m6": int(r["m6"] == "True"),
                "m7": int(r["m7"] == "True"), "m8": int(r["m8"] == "True"),
                "all_pass":  int(r["all_pass"] == "True"),
                "close":     float(r["close"]),
                "sma50":     float(r["sma50"]),
                "sma150":    float(r["sma150"]),
                "sma200":    float(r["sma200"]),
                "dist_52h":  float(r["dist_from_52w_high_pct"]),
                "ret_5d":    float(r["ret_5d"]),
                "dist_10dh": float(r["dist_from_10d_high"]),
                "pullback":  int(r["pullback"] == "True"),
                "day_chg":   float(r.get("day_chg", 0)),
            })
    return rows

def build_xo(rows):
    xo = {}
    for r in rows:
        # read from CSV (Python wrote these in scout.py)
        xo[r["ticker"]] = {
            "state":  r.get("xo_state", "BULL"),
            "spread": r.get("xo_spread_pct", 0.0),
        }
    return xo

def main():
    scout_csv  = sorted(OUTPUT_DIR.glob("scout_*.csv"), reverse=True)[0]
    signa_csv  = sorted(OUTPUT_DIR.glob("signa_*.csv"), reverse=True)
    ai_csv     = sorted(OUTPUT_DIR.glob("ai_sector_*.csv"), reverse=True)

    data       = csv_to_rows(scout_csv)
    signa      = csv_to_rows(signa_csv[0]) if signa_csv else []
    ai_sector  = csv_to_rows(ai_csv[0])    if ai_csv    else []

    all_rows = data + signa + ai_sector
    xo_data = build_xo(all_rows)

    scan_date = scout_csv.stem.replace("scout_", "")

    js = f"""// AUTO-GENERATED by generate_dashboard_v2.py — do not edit by hand
const SCAN_DATE = {json.dumps(scan_date)};
const UNIVERSE = "S&P 500";
const SPY = {{ close: 0, change_pct: 0 }};       // TODO: pull from scout CSV or yfinance
const SECTOR_OF = {json.dumps(SECTOR_MAP, indent=2)};
const SECTOR_COLORS = {{
  "Tech":"#4da6ff","Healthcare":"#3ee0a8","Financials":"#b18bff",
  "Cons. Disc.":"#ff9340","Industrials":"#6680ff","Comm. Svcs":"#ff6b9c",
  "Energy":"#f4c860","Staples":"#7dd6a0","Utilities":"#88c4ff",
  "Real Estate":"#ff8fbe","Materials":"#c9a96e"
}};
const DATA = {json.dumps(data)};
const SIGNA = {json.dumps(signa)};
const AI_SECTOR = {json.dumps(ai_sector)};
const XO_DATA = {json.dumps(xo_data)};

// classifier + helpers are exported by mergeXO + the rest of stock-scout-data.js
// — leave the helper block at the bottom of THIS file or move it into app.js.
// Copy the mergeXO/classify/tradePlan/fmt block from the current mock data file
// and append it below this line, OR move them into stock-scout-app.js so this
// file is pure data.
"""

    (OUTPUT_DIR / "stock-scout-data.js").write_text(js)
    print(f"Wrote stock-scout-data.js  ({len(data)} + {len(signa)} + {len(ai_sector)} rows)")

if __name__ == "__main__":
    main()
```

### 4. Final layout in `output/`

```
output/
  Stock Scout v2.html        (static)
  stock-scout-app.js         (static — contains classifier + tradePlan + render logic)
  stock-scout-data.js        (regenerated each scan by generate_dashboard_v2.py)
  scout_YYYY-MM-DD.csv
  signa_YYYY-MM-DD.csv
  ai_sector_YYYY-MM-DD.csv
```

Recommendation: **move `classify()`, `tradePlan()`, `mergeXO()`, `fmt()` from
`stock-scout-data.js` into `stock-scout-app.js`** so the data file becomes
pure data (auto-generated) and the logic stays static. Search the current
`stock-scout-data.js` for `function classify` and below — that whole block
should live in `stock-scout-app.js`.

## Daily run

```bash
python scout.py                    # produces fresh CSVs incl. XO fields
python generate_dashboard_v2.py    # produces fresh stock-scout-data.js + opens HTML
```

Or chain them at the bottom of `scout.py`.

## What's still NOT real

- The **LCD ticker tape** at the top is synthetic. Real index/Mag7 quotes
  need a separate yfinance call at scan time → write `tape.json` →
  modify `renderTape()` in `stock-scout-app.js` to fetch from it.
  Or just delete the wiggle and let the chart in the detail panel
  carry the live-price job.
- The **SPY mini-quote** in the header is hardcoded — same fix pattern.

## Sanity tests after porting

1. Run `python scout.py` — CSV should now have 4 new columns
   (xo_state, xo_spread_pct, xo_ema_fast, xo_ema_slow) and day_chg.
2. Run `python generate_dashboard_v2.py` — `stock-scout-data.js` should appear,
   first 500 chars should look like the schema above.
3. Open `output/Stock Scout v2.html` — table should populate with your real scan,
   no console errors. Every row in PULLBACK/BREAKOUT groups should have an XO
   pill computed from your real weekly data.
