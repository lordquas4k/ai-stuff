#!/usr/bin/env python3
"""Generate a dark-themed HTML dashboard from the latest scout CSV."""

import csv, json, subprocess, sys
from pathlib import Path

OUTPUT_DIR = Path("output")
CACHE_DIR  = Path("cache")

SECTOR_ABBREV = {
    "Information Technology":  "Tech",
    "Health Care":             "Healthcare",
    "Financials":              "Financials",
    "Consumer Discretionary":  "Cons. Disc.",
    "Industrials":             "Industrials",
    "Communication Services":  "Comm. Svcs",
    "Energy":                  "Energy",
    "Consumer Staples":        "Staples",
    "Utilities":               "Utilities",
    "Real Estate":             "Real Estate",
    "Materials":               "Materials",
}

FILTER_LABELS = {
    "m1": "Price > SMA150 & SMA200",
    "m2": "SMA150 > SMA200",
    "m3": "SMA200 trending up (1m)",
    "m4": "SMA50 > SMA150 & SMA200",
    "m5": "Price > SMA50",
    "m6": "30% above 52-week low",
    "m7": "Within 25% of 52-week high",
    "m8": "RS vs SPY top-30%",
}


def load_sectors() -> dict:
    """Return {ticker: sector_abbrev}, cached in cache/sectors.json."""
    CACHE_DIR.mkdir(exist_ok=True)
    cache_file = CACHE_DIR / "sectors.json"
    if cache_file.exists():
        return json.loads(cache_file.read_text())
    print("Fetching sector data from Wikipedia...", end=" ", flush=True)
    try:
        import requests, io, pandas as pd
        url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        headers = {"User-Agent": "Mozilla/5.0 (compatible; stock-scout/1.0)"}
        html = requests.get(url, headers=headers, timeout=15).text
        df = pd.read_html(io.StringIO(html))[0]
        mapping = {}
        for _, row in df.iterrows():
            ticker = str(row["Symbol"]).replace(".", "-")
            sector = str(row.get("GICS Sector", ""))
            mapping[ticker] = SECTOR_ABBREV.get(sector, sector)
        cache_file.write_text(json.dumps(mapping))
        print(f"{len(mapping)} sectors cached.")
        return mapping
    except Exception as e:
        print(f"FAILED ({e}) — sectors will be blank.")
        return {}


def _load_watchlist_csv(glob_pattern: str) -> list:
    """Generic loader for signa / ai_sector CSV files."""
    paths = sorted(OUTPUT_DIR.glob(glob_pattern), reverse=True)
    if not paths:
        return []
    sectors = load_sectors()
    rows = []
    with open(paths[0], newline="") as f:
        for r in csv.DictReader(f):
            ticker = r["ticker"]
            rows.append({
                "ticker":    ticker,
                "sector":    sectors.get(ticker, ""),
                "rank":      int(r["rank"]),
                "score":     float(r["score"]),
                "r_squared": float(r["r_squared"]),
                "m1": r["m1"] == "True", "m2": r["m2"] == "True",
                "m3": r["m3"] == "True", "m4": r["m4"] == "True",
                "m5": r["m5"] == "True", "m6": r["m6"] == "True",
                "m7": r["m7"] == "True", "m8": r["m8"] == "True",
                "all_pass":  r["all_pass"] == "True",
                "close":     float(r["close"]),
                "sma50":     float(r["sma50"]),
                "sma150":    float(r["sma150"]),
                "sma200":    float(r["sma200"]),
                "dist_52h":  float(r["dist_from_52w_high_pct"]),
                "ret_5d":    float(r["ret_5d"]),
                "dist_10dh": float(r["dist_from_10d_high"]),
                "pullback":  r["pullback"] == "True",
            })
    return rows


def load_signa() -> list:
    """Return rows from latest signa_*.csv, or [] if none exists."""
    return _load_watchlist_csv("signa_*.csv")


def load_ai_sector() -> list:
    """Return rows from latest ai_sector_*.csv, or [] if none exists."""
    return _load_watchlist_csv("ai_sector_*.csv")


def load_latest():
    paths = sorted(OUTPUT_DIR.glob("scout_*.csv"), reverse=True)
    if not paths:
        raise FileNotFoundError("No scout CSV found in output/")
    sectors = load_sectors()
    rows = []
    with open(paths[0], newline="") as f:
        for r in csv.DictReader(f):
            ticker = r["ticker"]
            rows.append({
                "ticker":    ticker,
                "sector":    sectors.get(ticker, ""),
                "rank":      int(r["rank"]),
                "score":     float(r["score"]),
                "r_squared": float(r["r_squared"]),
                "m1": r["m1"] == "True", "m2": r["m2"] == "True",
                "m3": r["m3"] == "True", "m4": r["m4"] == "True",
                "m5": r["m5"] == "True", "m6": r["m6"] == "True",
                "m7": r["m7"] == "True", "m8": r["m8"] == "True",
                "all_pass":  r["all_pass"] == "True",
                "close":     float(r["close"]),
                "sma50":     float(r["sma50"]),
                "sma150":    float(r["sma150"]),
                "sma200":    float(r["sma200"]),
                "dist_52h":  float(r["dist_from_52w_high_pct"]),
                "ret_5d":    float(r["ret_5d"]),
                "dist_10dh": float(r["dist_from_10d_high"]),
                "pullback":  r["pullback"] == "True",
            })
    return paths[0].stem.replace("scout_", ""), rows


_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>STOCK SCOUT — __SCAN_DATE__</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
body{background:#07090e;color:#b0bcc8;font-family:'Courier New',Courier,monospace;font-size:13px}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:#0b0e14}
::-webkit-scrollbar-thumb{background:#1e3044;border-radius:3px}

/* ── HEADER ── */
.hdr{
  display:flex;align-items:center;gap:20px;
  padding:0 18px;background:#0b0e14;
  border-bottom:1px solid #131c27;height:42px;flex-shrink:0
}
.hdr-logo{font-size:14px;font-weight:700;color:#1e9fff;letter-spacing:3px}
.hdr-date{color:#2e4a5e;font-size:11px;letter-spacing:1px}
.hdr-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.badge{padding:2px 10px;border-radius:2px;font-size:11px;font-weight:700;letter-spacing:.5px}
.b-pass{background:#0a2218;color:#15d98a;border:1px solid #0d3020}
.b-pb  {background:#221800;color:#f0a020;border:1px solid #332200}

/* ── TABS ── */
.tab-bar{
  display:flex;align-items:center;gap:4px;
  padding:8px 14px;background:#07090e;
  border-bottom:1px solid #131c27;flex-shrink:0
}
.tab-btn{
  padding:4px 16px;border-radius:3px;font-size:11px;font-weight:700;
  letter-spacing:1px;cursor:pointer;border:1px solid #131c27;
  background:transparent;color:#2e4a5e;
  font-family:'Courier New',Courier,monospace;
  transition:all 120ms
}
.tab-btn:hover:not(.active){color:#5080a0;border-color:#1a2a3a}
.tab-btn.active{background:#0c1e32;color:#4da6ff;border-color:#1e4a80}
.tab-count{
  margin-left:auto;font-size:10px;color:#1e3044;letter-spacing:1px
}

/* ── LAYOUT ── */
.layout{display:flex;flex:1;overflow:hidden}
.wrap{display:flex;flex-direction:column;height:100vh}
.col-table{flex:1;overflow-y:auto;padding:0 0 40px}
.col-detail{
  width:390px;overflow-y:auto;background:#090c12;
  border-left:1px solid #131c27;flex-shrink:0
}

/* ── TOP-15 SUMMARY BAR ── */
.summary-bar{
  display:flex;gap:0;border-bottom:1px solid #131c27;
  background:#07090e;flex-shrink:0
}
.summary-stat{
  flex:1;padding:10px 16px;border-right:1px solid #131c27;
  text-align:center
}
.summary-stat:last-child{border-right:none}
.ss-val{font-size:18px;font-weight:700;color:#dce8f0;line-height:1}
.ss-lbl{font-size:9px;color:#2e4a5e;text-transform:uppercase;letter-spacing:1.5px;margin-top:3px}

/* ── SECTOR LEGEND ── */
.sec-legend{
  display:flex;flex-wrap:wrap;gap:6px 12px;
  padding:8px 14px;border-bottom:1px solid #131c27;
  background:#07090e;flex-shrink:0
}
.sec-legend-item{
  display:flex;align-items:center;gap:4px;
  font-size:10px;color:#3a5060;letter-spacing:.5px
}
.sec-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}

/* ── TABLE ── */
table{width:100%;border-collapse:collapse}
thead th{
  padding:7px 10px;font-size:10px;color:#2e4a5e;
  text-transform:uppercase;letter-spacing:1px;
  text-align:right;border-bottom:1px solid #131c27;
  position:sticky;top:0;background:#07090e;z-index:5;
  white-space:nowrap
}
thead th:nth-child(1),thead th:nth-child(2),
thead th:nth-child(8){text-align:left}

tbody tr{
  border-bottom:1px solid #0c1018;cursor:pointer;
  transition:background 80ms;border-left:2px solid transparent
}
tbody tr:hover{background:#0d1520}
tbody tr.sel{background:#0c1e32}

td{padding:6px 10px;text-align:right;white-space:nowrap}
td:nth-child(1),td:nth-child(2),td:nth-child(8){text-align:left}

/* top-15 spacious rows */
.spacious td{padding:10px 10px}

/* colors */
.g{color:#15d98a} .r{color:#f04455} .y{color:#f0a020}
.w{color:#dce8f0} .d{color:#2e4a5e}

/* score bar */
.bar-w{
  display:inline-block;width:50px;height:5px;
  background:#0d1420;border-radius:3px;
  vertical-align:middle;margin-left:6px;overflow:hidden
}
.bar-f{height:100%;border-radius:3px}

/* pullback tag */
.pb-tag{
  display:inline-block;padding:1px 5px;border-radius:2px;
  font-size:9px;font-weight:700;letter-spacing:.5px;
  background:#1a1000;color:#f0a020;border:1px solid #2a1800;
  margin-left:5px;vertical-align:middle
}

/* section headers (all-stocks tab) */
.sec-hdr td{
  padding:5px 10px;font-size:9px;color:#1e3a50;
  text-transform:uppercase;letter-spacing:2px;
  background:#07090e;text-align:left!important;
  border-bottom:1px solid #101820;border-top:10px solid #07090e
}

/* rank medal colors */
.rank-1{color:#ffd700;font-weight:700}
.rank-2{color:#c0c0c0;font-weight:700}
.rank-3{color:#cd7f32;font-weight:700}

/* sector pill */
.sec-pill{
  display:inline-block;padding:1px 7px;border-radius:10px;
  font-size:10px;letter-spacing:.3px
}

/* stars */
.star-on{color:#f0a020}
.star-off{color:#151e28}

/* ── DETAIL PANEL ── */
.empty-state{
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;height:100%;gap:10px;color:#141e2a
}
.empty-state p{font-size:10px;letter-spacing:2px;text-align:center;text-transform:uppercase}

.det{padding:22px 18px}
.det-sector-tag{
  display:inline-block;padding:2px 8px;border-radius:2px;
  font-size:10px;letter-spacing:1px;margin-bottom:10px
}
.det-ticker{font-size:30px;font-weight:700;color:#fff;letter-spacing:3px;line-height:1}
.det-price{font-size:20px;margin-top:4px}
.det-ret{font-size:12px;margin-top:3px;letter-spacing:.5px}
.divider{height:1px;background:#131c27;margin:14px 0}

.score-row{display:flex;align-items:flex-end;justify-content:space-between}
.score-num{font-size:34px;font-weight:700;line-height:1}
.score-sub{font-size:10px;color:#2e4a5e;margin-top:4px;letter-spacing:1px}
.r2-block{text-align:right}
.r2-val{font-size:10px;color:#2e4a5e;margin-top:4px;letter-spacing:.5px}

.sma-wrap{margin:2px 0 6px}
.sma-title{font-size:10px;color:#2e4a5e;text-transform:uppercase;
  letter-spacing:1.5px;margin-bottom:10px}
.sma-row{display:flex;align-items:center;gap:8px;margin-bottom:7px}
.sma-lbl{width:68px;font-size:10px;color:#2e4a5e;letter-spacing:.5px}
.sma-bg{flex:1;height:5px;background:#0d1420;border-radius:3px;overflow:hidden}
.sma-fg{height:100%;border-radius:3px}
.sma-num{width:90px;text-align:right;font-size:11px}

.stat-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}
.stat-lbl{font-size:10px;color:#2e4a5e;text-transform:uppercase;letter-spacing:1px}
.stat-val{font-size:13px;font-weight:700}

.pb-box{
  background:#130e00;border:1px solid #2a1e00;border-radius:3px;
  padding:10px 12px;margin-top:10px
}
.pb-box-title{font-size:9px;color:#f0a020;text-transform:uppercase;letter-spacing:2px}
.pb-box-val{font-size:22px;color:#f0a020;font-weight:700;margin-top:3px}
.pb-box-note{font-size:11px;color:#705018;margin-top:4px}

.flt-title{font-size:10px;color:#2e4a5e;text-transform:uppercase;
  letter-spacing:1.5px;margin-bottom:10px}
.flt-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.flt-pill{
  display:flex;align-items:flex-start;gap:6px;
  padding:6px 8px;border-radius:3px;font-size:10px
}
.flt-pill.ok {background:#081a10;border:1px solid #0d2818}
.flt-pill.nok{background:#1a0808;border:1px solid #280d0d}
.flt-icon.ok {color:#15d98a;font-size:13px;flex-shrink:0;margin-top:-1px}
.flt-icon.nok{color:#f04455;font-size:13px;flex-shrink:0;margin-top:-1px}
.flt-key.ok {color:#15d98a;font-size:10px;font-weight:700}
.flt-key.nok{color:#f04455;font-size:10px;font-weight:700}
.flt-desc{font-size:9px;color:#2e4a5e;margin-top:1px;line-height:1.3}
</style>
</head>
<body>
<div class="wrap">

<!-- HEADER -->
<div class="hdr">
  <span class="hdr-logo">STOCK SCOUT</span>
  <span class="hdr-date">__SCAN_DATE__</span>
  <div class="hdr-right">
    <span class="badge b-pass">__ALL_PASS_COUNT__ ALL-PASS</span>
    <span class="badge b-pb">__PULLBACK_COUNT__ PULLBACK</span>
  </div>
</div>

<div class="layout">
  <!-- LEFT: table + tabs -->
  <div class="col-table" id="left-col">

    <!-- TAB BAR -->
    <div class="tab-bar" style="position:sticky;top:0;z-index:10">
      <button class="tab-btn active" data-tab="top15">TOP 15</button>
      <button class="tab-btn" data-tab="all">ALL STOCKS</button>
      <button class="tab-btn" data-tab="signa">SIGNA</button>
      <button class="tab-btn" data-tab="ai">AI SECTOR</button>
      <span class="tab-count" id="tab-count"></span>
    </div>

    <!-- TOP-15 SUMMARY (hidden in all-stocks tab) -->
    <div class="summary-bar" id="summary-bar">
      <div class="summary-stat">
        <div class="ss-val" id="sum-avg-score">—</div>
        <div class="ss-lbl">Avg Score</div>
      </div>
      <div class="summary-stat">
        <div class="ss-val" id="sum-sectors">—</div>
        <div class="ss-lbl">Sectors</div>
      </div>
      <div class="summary-stat">
        <div class="ss-val" id="sum-pullbacks">—</div>
        <div class="ss-lbl">Pullbacks</div>
      </div>
      <div class="summary-stat">
        <div class="ss-val" id="sum-avg-ret">—</div>
        <div class="ss-lbl">Avg 5D Return</div>
      </div>
    </div>

    <!-- SECTOR LEGEND (hidden in all-stocks tab) -->
    <div class="sec-legend" id="sec-legend"></div>

    <!-- TABLE -->
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>TICKER</th>
          <th style="text-align:left">SCORE</th>
          <th>PRICE</th>
          <th>5D %</th>
          <th>52W HIGH</th>
          <th>R²</th>
          <th>SECTOR</th>
        </tr>
      </thead>
      <tbody id="tbody"></tbody>
    </table>
  </div>

  <!-- RIGHT: detail panel -->
  <div class="col-detail" id="detail">
    <div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
           stroke="#1e3a50" stroke-width="1.5" stroke-linecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="9" y1="8" x2="15" y2="8"/>
        <line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="12" y2="16"/>
      </svg>
      <p>Select a stock<br>to view details</p>
    </div>
  </div>
</div>

</div><!-- .wrap -->

<script>
const DATA      = __DATA_JSON__;
const SIGNA     = __SIGNA_JSON__;
const AI_SECTOR = __AI_SECTOR_JSON__;
const FL        = __FILTER_LABELS_JSON__;
const MAX_SCORE = Math.max(...DATA.map(d => d.score), ...SIGNA.map(d => d.score), ...(AI_SECTOR.length ? AI_SECTOR.map(d => d.score) : [0]));

const SECTOR_COLORS = {
  'Tech':        '#4da6ff',
  'Healthcare':  '#2ed8a0',
  'Financials':  '#b87aff',
  'Cons. Disc.': '#ff9340',
  'Industrials': '#6680ff',
  'Comm. Svcs':  '#ff6b6b',
  'Energy':      '#ffd055',
  'Staples':     '#7dd67d',
  'Utilities':   '#88c4ff',
  'Real Estate': '#ff8fbe',
  'Materials':   '#c9a96e',
};

function secClr(s)  { return SECTOR_COLORS[s] || '#3a5060'; }
function $(id)      { return document.getElementById(id); }
function dolFmt(n)  { return '$' + n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}); }
function pct(n)     { return (n > 0 ? '+' : '') + n.toFixed(1) + '%'; }
function clsRet(v)  { return v > 0 ? 'g' : v < 0 ? 'r' : 'd'; }
function cls52(v)   { return v >= -3 ? 'g' : v >= -10 ? 'y' : 'r'; }
function stars(r2) {
  const n = Math.round(r2 * 5);
  return '<span class="star-on">' + '★'.repeat(n) + '</span>'
       + '<span class="star-off">' + '★'.repeat(5 - n) + '</span>';
}
function rankCls(r) { return r === 1 ? 'rank-1' : r === 2 ? 'rank-2' : r === 3 ? 'rank-3' : 'd'; }

/* ── TABS ── */
let activeTab = 'top15';

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const showExtras = activeTab === 'top15';
    $('summary-bar').style.display = showExtras ? '' : 'none';
    $('sec-legend').style.display  = showExtras ? '' : 'none';
    $('detail').innerHTML = '<div class="empty-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1e3a50" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg><p>Select a stock<br>to view details</p></div>';
    renderTable();
  });
});

/* ── SECTOR LEGEND ── */
function buildLegend(rows) {
  const seen = [...new Set(rows.map(d => d.sector).filter(Boolean))];
  $('sec-legend').innerHTML = seen.map(s =>
    `<div class="sec-legend-item">
      <div class="sec-dot" style="background:${secClr(s)}"></div>
      <span>${s}</span>
    </div>`
  ).join('');
}

/* ── TOP-15 SUMMARY ── */
function buildSummary(rows) {
  const avg = v => rows.reduce((a,d) => a + d[v], 0) / rows.length;
  const sectors = new Set(rows.map(d => d.sector).filter(Boolean)).size;
  const pbs = rows.filter(d => d.pullback).length;
  $('sum-avg-score').textContent = Math.round(avg('score')).toLocaleString();
  $('sum-sectors').textContent   = sectors;
  $('sum-pullbacks').textContent = pbs;
  const ret = avg('ret_5d');
  const el = $('sum-avg-ret');
  el.textContent = (ret > 0 ? '+' : '') + ret.toFixed(1) + '%';
  el.className = 'ss-val ' + clsRet(ret);
}

/* ── TABLE ── */
function renderTable() {
  const allPass = DATA.filter(d => d.all_pass);
  const top15   = allPass.slice(0, 15);
  const rows    = activeTab === 'top15' ? top15 : DATA;
  const notPass = DATA.filter(d => !d.all_pass);

  if (activeTab === 'top15') {
    buildSummary(top15);
    buildLegend(top15);
    $('tab-count').textContent = '15 of ' + allPass.length + ' all-pass';
  } else if (activeTab === 'signa') {
    const sp = SIGNA.filter(d => d.all_pass).length;
    $('tab-count').textContent = SIGNA.length + ' stocks · ' + sp + ' all-pass';
  } else if (activeTab === 'ai') {
    const ap = AI_SECTOR.filter(d => d.all_pass).length;
    $('tab-count').textContent = AI_SECTOR.length + ' stocks · ' + ap + ' all-pass';
  } else {
    $('tab-count').textContent = DATA.length + ' total stocks';
  }

  let h = '';
  if (activeTab === 'top15') {
    top15.forEach(d => { h += rowHTML(d, true); });
  } else if (activeTab === 'signa') {
    if (SIGNA.length === 0) {
      h = `<tr><td colspan="8" style="padding:30px;text-align:center;color:#2e4a5e">
        No Signa data — run scout.py to generate it.
      </td></tr>`;
    } else {
      const signaPass = SIGNA.filter(d => d.all_pass);
      const signaFail = SIGNA.filter(d => !d.all_pass);
      if (signaPass.length) {
        h += `<tr class="sec-hdr"><td colspan="8">PASSING ALL FILTERS (${signaPass.length})</td></tr>`;
        signaPass.forEach(d => { h += rowHTML(d, false); });
      }
      if (signaFail.length) {
        h += `<tr class="sec-hdr"><td colspan="8">PARTIAL MATCH (${signaFail.length})</td></tr>`;
        signaFail.forEach(d => { h += rowHTML(d, false); });
      }
    }
  } else if (activeTab === 'ai') {
    if (AI_SECTOR.length === 0) {
      h = `<tr><td colspan="8" style="padding:30px;text-align:center;color:#2e4a5e">
        No AI Sector data — run scout.py to generate it.
      </td></tr>`;
    } else {
      const aiPass = AI_SECTOR.filter(d => d.all_pass);
      const aiFail = AI_SECTOR.filter(d => !d.all_pass);
      if (aiPass.length) {
        h += `<tr class="sec-hdr"><td colspan="8">PASSING ALL FILTERS (${aiPass.length})</td></tr>`;
        aiPass.forEach(d => { h += rowHTML(d, false); });
      }
      if (aiFail.length) {
        h += `<tr class="sec-hdr"><td colspan="8">PARTIAL MATCH (${aiFail.length})</td></tr>`;
        aiFail.forEach(d => { h += rowHTML(d, false); });
      }
    }
  } else {
    if (allPass.length) {
      h += `<tr class="sec-hdr"><td colspan="8">PASSING ALL FILTERS (${allPass.length})</td></tr>`;
      allPass.forEach(d => { h += rowHTML(d, false); });
    }
    if (notPass.length) {
      h += `<tr class="sec-hdr"><td colspan="8">PARTIAL MATCH (${notPass.length})</td></tr>`;
      notPass.forEach(d => { h += rowHTML(d, false); });
    }
  }

  $('tbody').innerHTML = h;
  $('tbody').querySelectorAll('tr[data-t]').forEach(tr =>
    tr.addEventListener('click', () => showDetail(tr.dataset.t))
  );
}

function rowHTML(d, spacious) {
  const sc   = secClr(d.sector);
  const barW = Math.round((d.score / MAX_SCORE) * 100);
  const pb   = d.pullback ? '<span class="pb-tag">PB</span>' : '';
  const pbBg = d.pullback ? `background:rgba(240,160,32,0.05);` : '';
  const cls  = spacious ? 'spacious' : '';

  const secPill = d.sector
    ? `<span class="sec-pill" style="color:${sc};background:${sc}18">${d.sector}</span>`
    : '<span class="d">—</span>';

  return `<tr data-t="${d.ticker}" class="${cls}" style="${pbBg}border-left-color:${sc}30">
    <td class="${rankCls(d.rank)}">${d.rank}</td>
    <td class="w">${d.ticker}${pb}</td>
    <td style="text-align:left">
      <span class="d">${Math.round(d.score)}</span>
      <span class="bar-w"><span class="bar-f" style="width:${barW}%;background:${sc}"></span></span>
    </td>
    <td class="w">${dolFmt(d.close)}</td>
    <td class="${clsRet(d.ret_5d)}">${pct(d.ret_5d)}</td>
    <td class="${cls52(d.dist_52h)}">${pct(d.dist_52h)}</td>
    <td>${stars(d.r_squared)}</td>
    <td>${secPill}</td>
  </tr>`;
}

/* ── DETAIL PANEL ── */
function activeDataset() {
  if (activeTab === 'signa') return SIGNA;
  if (activeTab === 'ai')    return AI_SECTOR;
  return DATA;
}

function showDetail(ticker) {
  $('tbody').querySelectorAll('tr[data-t]').forEach(tr =>
    tr.classList.toggle('sel', tr.dataset.t === ticker));

  const d  = activeDataset().find(x => x.ticker === ticker);
  if (!d) return;
  const sc = secClr(d.sector);

  /* SMA ladder */
  const pts   = [d.sma200, d.sma150, d.sma50, d.close];
  const lo    = Math.min(...pts) * 0.96;
  const hi    = Math.max(...pts) * 1.04;
  const span  = hi - lo;
  const bw    = v => Math.round(((v - lo) / span) * 100);

  const smaRows = [
    ['SMA 200', d.sma200, '#4060b0', 'd'],
    ['SMA 150', d.sma150, '#5080c8', 'd'],
    ['SMA 50',  d.sma50,  '#60a8e0', 'd'],
    ['PRICE',   d.close,  '#15d98a', 'g'],
  ].map(([lbl, val, col, tc]) =>
    `<div class="sma-row">
      <span class="sma-lbl">${lbl}</span>
      <div class="sma-bg"><div class="sma-fg" style="width:${bw(val)}%;background:${col}"></div></div>
      <span class="sma-num ${tc}">${dolFmt(val)}</span>
    </div>`
  ).join('');

  /* filters */
  const pills = ['m1','m2','m3','m4','m5','m6','m7','m8'].map(k => {
    const ok = d[k];
    return `<div class="flt-pill ${ok ? 'ok' : 'nok'}">
      <span class="flt-icon ${ok ? 'ok' : 'nok'}">${ok ? '✓' : '✗'}</span>
      <div>
        <div class="flt-key ${ok ? 'ok' : 'nok'}">${k.toUpperCase()}</div>
        <div class="flt-desc">${FL[k]}</div>
      </div>
    </div>`;
  }).join('');

  /* pullback box */
  let pbHTML = '';
  if (d.pullback) {
    const dep  = d.dist_10dh;
    const note = dep > -3 ? 'Shallow — tight stop'
               : dep > -6 ? 'Moderate — good risk/reward'
               :             'Deep — confirm trend intact';
    pbHTML = `<div class="pb-box">
      <div class="pb-box-title">Pullback Entry Signal</div>
      <div class="pb-box-val">${pct(dep)} from 10-day high</div>
      <div class="pb-box-note">${note}</div>
    </div>`;
  }

  $('detail').innerHTML = `<div class="det">
    ${d.sector ? `<div class="det-sector-tag" style="color:${sc};background:${sc}18;border:1px solid ${sc}30">${d.sector}</div>` : ''}
    <div class="det-ticker">${d.ticker}</div>
    <div class="det-price ${clsRet(d.ret_5d)}">${dolFmt(d.close)}</div>
    <div class="det-ret ${clsRet(d.ret_5d)}">${pct(d.ret_5d)} &nbsp;(5-day return)</div>
    <div class="divider"></div>
    <div class="score-row">
      <div>
        <div class="score-num" style="color:${sc}">${Math.round(d.score)}</div>
        <div class="score-sub">SCORE &nbsp;·&nbsp; RANK #${d.rank}</div>
      </div>
      <div class="r2-block">
        ${stars(d.r_squared)}
        <div class="r2-val">R² ${d.r_squared.toFixed(3)}</div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="sma-wrap">
      <div class="sma-title">Price vs Moving Averages</div>
      ${smaRows}
    </div>
    <div class="divider"></div>
    <div class="stat-row">
      <span class="stat-lbl">52-Week High</span>
      <span class="stat-val ${cls52(d.dist_52h)}">${pct(d.dist_52h)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-lbl">10-Day High</span>
      <span class="stat-val ${clsRet(d.dist_10dh)}">${pct(d.dist_10dh)}</span>
    </div>
    ${pbHTML}
    <div class="divider"></div>
    <div class="flt-title">Minervini Filters</div>
    <div class="flt-grid">${pills}</div>
  </div>`;
}

renderTable();
</script>
</body>
</html>"""


def build_html(scan_date: str, rows: list, signa_rows: list, ai_sector_rows: list) -> str:
    all_pass_count = sum(1 for r in rows if r["all_pass"])
    pullback_count = sum(1 for r in rows if r["all_pass"] and r["pullback"])
    html = _TEMPLATE
    html = html.replace("__SCAN_DATE__", scan_date)
    html = html.replace("__ALL_PASS_COUNT__", str(all_pass_count))
    html = html.replace("__PULLBACK_COUNT__", str(pullback_count))
    html = html.replace("__DATA_JSON__", json.dumps(rows, separators=(",", ":")))
    html = html.replace("__SIGNA_JSON__", json.dumps(signa_rows, separators=(",", ":")))
    html = html.replace("__AI_SECTOR_JSON__", json.dumps(ai_sector_rows, separators=(",", ":")))
    html = html.replace("__FILTER_LABELS_JSON__", json.dumps(FILTER_LABELS))
    return html


if __name__ == "__main__":
    scan_date, rows = load_latest()
    signa_rows = load_signa()
    ai_sector_rows = load_ai_sector()
    html = build_html(scan_date, rows, signa_rows, ai_sector_rows)
    out = OUTPUT_DIR / "dashboard.html"
    out.write_text(html, encoding="utf-8")
    print(f"Dashboard written: {out}  ({len(rows)} stocks, {len(ai_sector_rows)} AI sector)")
    if sys.platform == "win32":
        subprocess.Popen(["start", "", str(out.resolve())], shell=True)
    elif sys.platform == "darwin":
        subprocess.Popen(["open", str(out.resolve())])
    elif sys.platform.startswith("linux"):
        subprocess.Popen(["xdg-open", str(out.resolve())])
