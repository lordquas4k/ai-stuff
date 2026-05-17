// =========================================================================
// STOCK SCOUT v2 — app logic
// =========================================================================

// ============== MACRO TREND MERGE ==============
function mergeMacroTrend(row) {
  const mt = MT_DATA[row.ticker];
  if (!mt) {
    row.mt_state = row.close > row.sma50 ? "BULL" : "BEAR";
    row.mt_spread_pct = ((row.close - row.sma50) / row.sma50 * 100) * 0.3;
  } else {
    row.mt_state = mt.state;
    row.mt_spread_pct = mt.spread;
  }
  row.mt_ema_slow = row.close / (1 + row.mt_spread_pct / 100 / 2);
  row.mt_ema_fast = row.mt_ema_slow * (1 + row.mt_spread_pct / 100);
  return row;
}

DATA.forEach(mergeMacroTrend);

// ============== CLASSIFIER ==============
function classify(d) {
  const distFromSMA50 = (d.close - d.sma50) / d.sma50 * 100;
  const inBuyZone = distFromSMA50 <= 15;
  const inCautionZone = distFromSMA50 > 15 && distFromSMA50 <= 25;
  const extended = distFromSMA50 > 25;
  const atBreakout = d.dist_10dh >= -1.0;

  let setup, action, thesis;

  if (d.all_pass && d.pullback && inBuyZone) {
    setup = "PULLBACK";
    action = "INVESTIGATE";
    thesis = "Pulling back inside an intact Stage-2 uptrend. Buy zone of the 50-day MA — Minervini's preferred R/R entry.";
  } else if (d.all_pass && atBreakout && inBuyZone) {
    setup = "BREAKOUT";
    action = "INVESTIGATE";
    thesis = "Clearing the 10-day high inside the buy zone. Fresh momentum entry — confirm with volume.";
  } else if (d.all_pass && inBuyZone) {
    setup = "TRENDING";
    action = "WATCH";
    thesis = "Healthy Stage-2 uptrend, still inside the 50-day buy zone. Primary entry missed — watch for next pullback.";
  } else if (d.all_pass && inCautionZone) {
    setup = "CAUTION";
    action = "WAIT";
    thesis = "All-pass but 15–25% above the 50-day MA. Stop placement is wider, R/R is compressing. Wait for pullback.";
  } else if (d.all_pass && extended) {
    setup = "EXTENDED";
    action = "AVOID";
    thesis = "More than 25% above the 50-day MA. Chase math is broken — wait for a meaningful pullback before considering.";
  } else if (!d.all_pass && d.m1 && d.m2) {
    setup = "BASING";
    action = "BUILD";
    thesis = "Partial pass — long-term trend holds but missing one or two confirmation filters. Worth tracking, not buying.";
  } else {
    setup = "WEAK";
    action = "AVOID";
    thesis = "Failed key trend filters. Not a long candidate in the Minervini framework.";
  }

  return { setup, action, thesis, distFromSMA50, inBuyZone, inCautionZone, extended };
}

// ============== TRADE PLAN ==============
function fmt(n) {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 100) return n.toFixed(0);
  return n.toFixed(2);
}

function tradePlan(d, cls) {
  const px = d.close;
  let entry, stop, target, invalidates, note;

  switch (cls.setup) {
    case "PULLBACK": {
      const entryLo = Math.max(d.sma50, px * 0.985);
      const entryHi = px * 1.01;
      entry = `$${fmt(entryLo)} – $${fmt(entryHi)}`;
      stop = Math.min(d.sma50 * 0.97, px * 0.92);
      target = px * 1.20;
      invalidates = `Close below SMA50 ($${fmt(d.sma50)}) on volume — abandons the buy-zone thesis.`;
      note = "Best R/R entry per Minervini framework.";
      break;
    }
    case "BREAKOUT": {
      entry = `$${fmt(px * 0.998)} – $${fmt(px * 1.012)}`;
      stop = px * 0.93;
      target = px * 1.20;
      invalidates = `Break back below the 10-day breakout line and close below SMA50 ($${fmt(d.sma50)}).`;
      note = "Confirm with above-average volume on the break.";
      break;
    }
    case "TRENDING": {
      entry = `Wait for pullback to $${fmt(d.sma50 * 1.02)}`;
      stop = d.sma50 * 0.95;
      target = px * 1.15;
      invalidates = `Close below SMA50 ($${fmt(d.sma50)}) on volume.`;
      note = "Primary entry missed. Patience — let it come to the 50-day.";
      break;
    }
    case "CAUTION": {
      entry = `Wait for pullback to $${fmt(d.sma50 * 1.05)}`;
      stop = d.sma50 * 0.95;
      target = px * 1.10;
      invalidates = `Stop is too wide here — entry math is unfavorable.`;
      note = "Sit on hands. Buy on the next contraction.";
      break;
    }
    case "EXTENDED": {
      entry = `Stand aside — chase math broken`;
      stop = px * 0.85;
      target = null;
      invalidates = `Stock is &gt;25% above its 50-day MA. The probability of a pullback is high; do not buy.`;
      note = "Add to watchlist. Re-evaluate after a 10–20% retracement.";
      break;
    }
    case "BASING": {
      entry = `Wait for all-pass + volume`;
      stop = d.sma50 * 0.95;
      target = null;
      invalidates = `Failure of M1/M2 (loss of long-term trend).`;
      note = "Not ready. Re-screen when full Trend Template passes.";
      break;
    }
    default: {
      entry = `Not a candidate`;
      stop = null;
      target = null;
      invalidates = `Failed core trend filters.`;
      note = "Skip.";
    }
  }

  const stopPct = stop ? ((stop - px) / px * 100) : null;
  const targetPct = target ? ((target - px) / px * 100) : null;
  const rr = (stop && target) ? Math.abs(targetPct / stopPct) : null;

  return { entry, stop, stopPct, target, targetPct, rr, invalidates, note };
}

const FILTER_LABELS = {
  m1: "Price > SMA150 & SMA200",
  m2: "SMA150 > SMA200",
  m3: "SMA200 trending up (1mo)",
  m4: "SMA50 > SMA150 & SMA200",
  m5: "Price > SMA50",
  m6: "30% above 52-week low",
  m7: "Within 25% of 52-week high",
  m8: "RS vs SPY top-30%",
};

const SETUP_ORDER = ["PULLBACK","BREAKOUT","TRENDING","CAUTION","EXTENDED","BASING","WEAK"];
const SETUP_LABEL = {
  PULLBACK: "PULLBACK ENTRIES · BUY ZONE",
  BREAKOUT: "FRESH BREAKOUTS · CLEARING 10D HIGH",
  TRENDING: "TRENDING · WATCH FOR PULLBACK",
  CAUTION:  "CAUTION · APPROACHING EXTENDED",
  EXTENDED: "EXTENDED · DO NOT CHASE",
  BASING:   "BASING · PARTIAL PASS",
  WEAK:     "WEAK · FAILED TREND TEMPLATE",
};
const SETUP_SUB = {
  PULLBACK: "best risk/reward today",
  BREAKOUT: "fresh momentum",
  TRENDING: "trend intact, primary entry missed",
  CAUTION:  "15–25% above 50MA",
  EXTENDED: "wait for pullback",
  BASING:   "partial trend template",
  WEAK:     "not a long candidate",
};

let activeTab = "setups";
let activeFilter = "all";
let activeTicker = null;
let watchlist = new Set(JSON.parse(localStorage.getItem("scout-watchlist") || "[]"));

function persistWatchlist() {
  localStorage.setItem("scout-watchlist", JSON.stringify([...watchlist]));
  if ($("c-watch")) $("c-watch").textContent = "·" + watchlist.size;
}

// ============== utils ==============
function $(id) { return document.getElementById(id); }
function clsRet(v) { return v > 0 ? "tx-g" : v < 0 ? "tx-r" : "tx-d"; }
function pct(v, signed = true) {
  if (v === null || v === undefined) return "—";
  const s = (signed && v > 0 ? "+" : "") + v.toFixed(1) + "%";
  return s;
}
function dol(v) {
  if (v === null || v === undefined) return "—";
  if (v >= 1000) return "$" + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return "$" + v.toFixed(2);
}
function secColor(s) { return SECTOR_COLORS[s] || "#5b6b7d"; }
function secOf(t) { return SECTOR_OF[t] || ""; }
function stars(r2) {
  const n = Math.max(0, Math.min(5, Math.round(r2 * 5)));
  return `<span class="star-on">${"★".repeat(n)}</span><span class="star-off">${"★".repeat(5 - n)}</span>`;
}

function activeDataset() {
  if (activeTab === "watch") return DATA.filter(d => watchlist.has(d.ticker));
  return DATA;
}

// ============== TABLE RENDER ==============
function rowHTML(d) {
  const cls = classify(d);
  const sect = secOf(d.ticker);
  const sCol = secColor(sect);
  const isStar = watchlist.has(d.ticker);

  // Macro Trend pill (weekly 12/25 EMA)
  const mtState = d.mt_state || "BULL";
  const mtCls = mtState.toLowerCase();
  const mtIcon = mtState === "FRESH_BULL" ? "⚡" : mtState === "FRESH_BEAR" ? "⚡" : "●";
  const mtLabel = mtState.replace("FRESH_", "");
  const mtHTML = `<span class="mt-pill mt-${mtCls}"><span class="mt-icon">${mtIcon}</span>${mtLabel}</span>`;

  // key level — context-aware
  let kl, klC = "tx-w";
  if (cls.setup === "PULLBACK")        { kl = `<span class="kl-lbl">10D HI</span>${pct(d.dist_10dh)}`; klC = "tx-y"; }
  else if (cls.setup === "BREAKOUT")   { kl = `<span class="kl-lbl">10D HI</span>${pct(d.dist_10dh)}`; klC = "tx-g"; }
  else if (cls.setup === "TRENDING")   { kl = `<span class="kl-lbl">FROM 50</span>+${cls.distFromSMA50.toFixed(1)}%`; klC = "tx-w"; }
  else if (cls.setup === "CAUTION")    { kl = `<span class="kl-lbl">FROM 50</span>+${cls.distFromSMA50.toFixed(1)}%`; klC = "tx-y"; }
  else if (cls.setup === "EXTENDED")   { kl = `<span class="kl-lbl">FROM 50</span>+${cls.distFromSMA50.toFixed(1)}%`; klC = "tx-r"; }
  else                                  { kl = `<span class="kl-lbl">52W HI</span>${pct(d.dist_52h)}`; klC = "tx-d"; }

  // score bar — log-scaled vs SNDK max to keep it readable
  const MAX = 2200;
  const barW = Math.max(2, Math.min(100, Math.round((Math.log(Math.max(1, Math.abs(d.score))) / Math.log(MAX)) * 100)));
  const barC = cls.action === "INVESTIGATE" ? "var(--c-mint)"
             : cls.action === "WATCH"       ? "var(--c-blue)"
             : cls.action === "WAIT"        ? "var(--c-amber)"
             : cls.action === "AVOID"       ? "var(--c-red)"
             :                                "var(--c-slate)";

  return `<tr data-t="${d.ticker}" data-setup="${cls.setup}">
    <td class="l rank-cell">${d.rank}</td>
    <td class="c"><button class="star-btn ${isStar ? "on" : ""}" data-star="${d.ticker}">${isStar ? "★" : "☆"}</button></td>
    <td class="l"><span class="sec-dot" style="background:${sCol}"></span><span class="tk">${d.ticker}</span></td>
    <td class="l"><span class="setup-pill s-${cls.setup.toLowerCase()}">${cls.setup}</span></td>
    <td class="l"><span class="score-cell"><span class="score-num" style="color:${barC}">${Math.round(d.score).toLocaleString()}</span><span class="bar-w"><span class="bar-f" style="width:${barW}%;background:${barC}"></span></span></span></td>
    <td class="c">${mtHTML}</td>
    <td class="l"><span class="key-level ${klC}">${kl}</span></td>
    <td class="l"><span style="color:${sCol}; font-size:10px; letter-spacing:0.5px">${sect || "—"}</span></td>
    <td class="l"><span class="action-pill a-${cls.action.toLowerCase()}">${cls.action}</span></td>
  </tr>`;
}

const SETUPS_TAB_SETUPS = new Set(["PULLBACK", "BREAKOUT"]);

function renderTable() {
  const data = activeDataset().slice();
  const grouped = {};
  for (const d of data) {
    const cls = classify(d);
    if (activeTab === "setups" && activeFilter === "all" && !SETUPS_TAB_SETUPS.has(cls.setup)) continue;
    if (activeFilter === "MT_BULL") {
      const isBull = (d.mt_state || "BULL").endsWith("BULL");
      if (!isBull) continue;
    } else if (activeFilter !== "all" && cls.setup !== activeFilter) continue;
    if (!grouped[cls.setup]) grouped[cls.setup] = [];
    grouped[cls.setup].push(d);
  }

  let h = "";
  let totalRows = 0;

  const showAll = activeTab === "main";
  for (const setup of SETUP_ORDER) {
    const rows = grouped[setup] || [];
    if (!rows.length) continue;
    if (!showAll && (setup === "BASING" || setup === "WEAK") && activeFilter === "all") continue;

    h += `<tr class="sec-row"><td colspan="9">${SETUP_LABEL[setup]} · ${rows.length}<span class="sec-r">${SETUP_SUB[setup]}</span></td></tr>`;
    rows.sort((a,b) => b.score - a.score);
    for (const d of rows) {
      h += rowHTML(d);
      totalRows++;
    }
  }

  if (!totalRows) {
    h = `<tr><td colspan="9" style="padding:40px;text-align:center;color:var(--tx-4);font-size:11px;letter-spacing:1.5px">NO STOCKS MATCH THIS FILTER</td></tr>`;
  }

  $("tbody").innerHTML = h;
  $("tbl-count").textContent = `${totalRows} ${totalRows === 1 ? "stock" : "stocks"} · grouped by setup`;

  // re-bind row click + star click
  $("tbody").querySelectorAll("tr[data-t]").forEach(tr => {
    tr.addEventListener("click", e => {
      if (e.target.closest("[data-star]")) return;
      showDetail(tr.dataset.t);
    });
  });
  $("tbody").querySelectorAll("[data-star]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const tk = btn.dataset.star;
      if (watchlist.has(tk)) watchlist.delete(tk);
      else watchlist.add(tk);
      persistWatchlist();
      renderTable();
      if (activeTicker === tk) showDetail(tk);
    });
  });

  // restore selection highlight
  if (activeTicker) {
    const tr = $("tbody").querySelector(`tr[data-t="${activeTicker}"]`);
    if (tr) tr.classList.add("sel");
  }
}

// ============== TRADINGVIEW CHART ==============
let tvWidget = null;
let tvTimeframe = "W";    // default weekly (Macro Trend style)
let tvSymbol = null;

function renderChart(ticker) {
  tvSymbol = ticker;
  const container = $("tv-chart");
  if (!container) return;
  container.innerHTML = "";    // tear down previous

  // Avoid known foreign-ticker prefix issues — TV resolves bare US tickers fine
  const sym = ticker.includes(".") || ticker.includes("-") ? ticker : ticker;

  // eslint-disable-next-line no-undef
  tvWidget = new TradingView.widget({
    autosize: true,
    symbol: sym,
    interval: tvTimeframe,
    timezone: "Etc/UTC",
    theme: "dark",
    style: "1",
    locale: "en",
    toolbar_bg: "#07090e",
    enable_publishing: false,
    hide_side_toolbar: true,
    hide_top_toolbar: false,
    hide_legend: false,
    allow_symbol_change: false,
    save_image: false,
    container_id: "tv-chart",
    studies: [
      { id: "MAExp@tv-basicstudies", inputs: { length: 12 } },
      { id: "MAExp@tv-basicstudies", inputs: { length: 25 } }
    ],
    overrides: {
      "paneProperties.background": "#07090e",
      "paneProperties.backgroundType": "solid",
      "paneProperties.vertGridProperties.color": "#131a26",
      "paneProperties.horzGridProperties.color": "#131a26",
      "scalesProperties.textColor": "#6a7a8c",
      "scalesProperties.lineColor": "#1c2535",
      "mainSeriesProperties.candleStyle.upColor": "#3ee0a8",
      "mainSeriesProperties.candleStyle.downColor": "#ff5c7c",
      "mainSeriesProperties.candleStyle.borderUpColor": "#3ee0a8",
      "mainSeriesProperties.candleStyle.borderDownColor": "#ff5c7c",
      "mainSeriesProperties.candleStyle.wickUpColor": "#3ee0a8",
      "mainSeriesProperties.candleStyle.wickDownColor": "#ff5c7c",
    },
    studies_overrides: {
      // first MA (21) — fast, mint
      "moving average exponential.plot.color":  "#f4c860",
      "moving average exponential.plot.linewidth": 2,
    }
  });

  // Wire timeframe buttons
  document.querySelectorAll(".tv-tf-btn").forEach(btn => {
    btn.classList.toggle("on", btn.dataset.tf === tvTimeframe);
    btn.onclick = () => {
      tvTimeframe = btn.dataset.tf;
      renderChart(tvSymbol);
    };
  });
}
function showDetail(ticker) {
  activeTicker = ticker;
  $("tbody").querySelectorAll("tr[data-t]").forEach(tr =>
    tr.classList.toggle("sel", tr.dataset.t === ticker));

  // search in whatever dataset contains it
  const d = DATA.find(x => x.ticker === ticker);
  if (!d) return;
  const cls = classify(d);
  const plan = tradePlan(d, cls);
  const sect = secOf(ticker);
  const sCol = secColor(sect);
  const isStar = watchlist.has(ticker);

  // SMA ladder
  const pts = [d.sma200, d.sma150, d.sma50, d.close];
  const lo = Math.min(...pts) * 0.96;
  const hi = Math.max(...pts) * 1.04;
  const bw = v => Math.round(((v - lo) / (hi - lo)) * 100);
  const smaRows = [
    { lbl: "SMA 200", val: d.sma200, c: "#3a5a8e" },
    { lbl: "SMA 150", val: d.sma150, c: "#5080c8" },
    { lbl: "SMA 50",  val: d.sma50,  c: "#60a8e0" },
    { lbl: "PRICE",   val: d.close,  c: "#3ee0a8", high: true },
  ].map(r => `<div class="sma-row">
    <span class="sma-lbl">${r.lbl}</span>
    <span class="sma-bar"><span class="sma-fill" style="width:${bw(r.val)}%;background:${r.c}"></span></span>
    <span class="sma-val ${r.high ? "tx-w" : ""}">${dol(r.val)}</span>
  </div>`).join("");

  // Filters
  const pills = ["m1","m2","m3","m4","m5","m6","m7","m8"].map(k => {
    const ok = d[k] ? "ok" : "no";
    const mark = d[k] ? "✓" : "✗";
    return `<div class="flt ${ok}">
      <span class="flt-mark ${ok}">${mark}</span>
      <div class="flt-body">
        <div class="flt-k ${ok}">${k.toUpperCase()}</div>
        <div class="flt-d">${FILTER_LABELS[k]}</div>
      </div>
    </div>`;
  }).join("");

  // Peers in sector
  const peers = DATA
    .filter(x => x.ticker !== ticker && secOf(x.ticker) === sect)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const peersHTML = peers.length ? peers.map(p => {
    const pc = classify(p);
    return `<div class="peer" data-peer="${p.ticker}">
      <span class="peer-rank">#${p.rank}</span>
      <div><span class="peer-tk">${p.ticker}</span> <span class="setup-pill s-${pc.setup.toLowerCase()}" style="font-size:9px;padding:1px 6px;margin-left:6px">${pc.setup}</span></div>
      <span class="peer-px">${dol(p.close)}</span>
      <span class="${clsRet(p.day_chg || 0)}" style="font-size:10px">${pct(p.day_chg || 0)}</span>
    </div>`;
  }).join("") : `<div style="font-size:11px;color:var(--tx-4)">No other names from this sector in scan.</div>`;

  // R/R bar widths
  let rrBarHTML = "";
  if (plan.stopPct !== null && plan.targetPct !== null) {
    const tot = Math.abs(plan.stopPct) + Math.abs(plan.targetPct);
    const wRisk = Math.round(Math.abs(plan.stopPct) / tot * 100);
    rrBarHTML = `<div class="det-rr-bar"><div class="rr-risk" style="width:${wRisk}%"></div><div class="rr-reward" style="width:${100 - wRisk}%"></div></div>`;
  }

  const actionColor = {
    INVESTIGATE: "var(--c-mint)",
    WATCH:       "var(--c-blue)",
    WAIT:        "var(--c-amber)",
    BUILD:       "var(--c-slate)",
    AVOID:       "var(--c-red)",
  }[cls.action];

  $("aside").innerHTML = `<div class="det">
    <div class="det-badge-row">
      <span class="setup-pill s-${cls.setup.toLowerCase()}">${cls.setup}</span>
      <span class="action-pill a-${cls.action.toLowerCase()}">${cls.action}</span>
      <button class="star-btn ${isStar ? "on" : ""}" data-star-det="${ticker}" style="margin-left:auto; font-size:16px">${isStar ? "★" : "☆"}</button>
    </div>

    <div class="det-tk-row">
      <span class="det-tk">${ticker}</span>
      <span class="det-rank">RANK <span class="det-rank-num">#${d.rank}</span></span>
    </div>
    <div class="det-px-row">
      <span class="det-px">${dol(d.close)}</span>
      <span class="det-px-chg ${clsRet(d.day_chg || 0)}">${pct(d.day_chg || 0)} TODAY</span>
    </div>
    <div class="det-sector-line"><span style="color:${sCol}">●</span> ${sect || "—"}</div>

    <div class="tv-wrap">
      <div class="tv-hd">
        <span>Chart · ${ticker} · 12/25 EMA</span>
        <div class="tv-tf">
          <button class="tv-tf-btn" data-tf="240">4H</button>
          <button class="tv-tf-btn" data-tf="D">D</button>
          <button class="tv-tf-btn" data-tf="W">W</button>
          <button class="tv-tf-btn" data-tf="M">M</button>
        </div>
      </div>
      <div id="tv-chart"></div>
    </div>

    <div class="det-section-lbl">The Setup</div>
    <div class="det-thesis">${cls.thesis}</div>

    <div class="det-divider"></div>

    <div class="det-section-lbl">Trade Plan</div>
    <div class="det-plan">
      <span class="det-plan-k">Entry</span>
      <span class="det-plan-v ${plan.entry.includes('Wait') || plan.entry.includes('Stand') || plan.entry.includes('Not') ? 'muted' : ''}">${plan.entry}</span>
      ${plan.stop !== null ? `<span class="det-plan-k">Stop</span><span class="det-plan-v">${dol(plan.stop)} <span class="v-sub">${pct(plan.stopPct)}</span></span>` : ""}
      ${plan.target !== null ? `<span class="det-plan-k">Target</span><span class="det-plan-v">${dol(plan.target)} <span class="v-sub">${pct(plan.targetPct)}</span></span>` : ""}
      ${plan.rr !== null ? `<span class="det-plan-k">R / R</span><span class="det-plan-v" style="color:${actionColor}">${plan.rr.toFixed(1)}<span class="v-sub">${rrBarHTML}</span></span>` : ""}
    </div>
    ${plan.note ? `<div style="margin-top:12px; font-size:10px; color:var(--tx-4); font-style:normal; line-height:1.5; letter-spacing:0.2px">${plan.note}</div>` : ""}

    <div class="invalidates">
      <span class="invalidates-lbl">⚑ Invalidates Thesis</span>
      ${plan.invalidates}
    </div>

    <div class="det-divider"></div>

    <div class="det-score-row">
      <div class="det-score-tile">
        <div class="det-score-num" style="color:${actionColor}">${Math.round(d.score).toLocaleString()}</div>
        <div class="det-score-lbl">Momentum Score</div>
      </div>
      <div class="det-score-tile">
        <div class="stars-row">${stars(d.r_squared)}</div>
        <div class="det-score-lbl">Trend Quality · R² ${d.r_squared.toFixed(3)}</div>
      </div>
    </div>

    <div class="det-divider"></div>

    <div class="det-section-lbl">Weekly Macro Trend · 12 / 25 EMA</div>
    ${(() => {
      const xs = d.mt_state || "BULL";
      const xc = xs.toLowerCase();
      const ic = xs.startsWith("FRESH") ? "⚡" : "●";
      const lb = xs.replace("FRESH_", "");
      const sp = d.mt_spread_pct || 0;
      const isBull = xs.endsWith("BULL");
      const aligns = (isBull && (cls.action === "INVESTIGATE" || cls.action === "WATCH")) ||
                     (!isBull && cls.action === "AVOID");
      const conflict = (isBull && cls.action === "AVOID") ||
                       (!isBull && (cls.action === "INVESTIGATE" || cls.action === "WATCH"));
      const readNote = xs === "FRESH_BULL" ? "Just crossed up — early in a fresh weekly uptrend."
                     : xs === "FRESH_BEAR" ? "Just crossed down — weekly momentum is rolling. Daily setup at risk."
                     : xs === "BULL" ? "Weekly trend confirms higher highs. Macro tailwind."
                     : "Weekly trend pointing lower. Macro headwind.";
      const verdict = aligns
        ? `<span class="tx-g">✓ Weekly confirms daily ${cls.setup.toLowerCase()} setup.</span>`
        : conflict
          ? `<span class="tx-r">⚠ Weekly conflicts with daily setup — be skeptical.</span>`
          : `<span class="dim">Information only — not actionable here.</span>`;
      return `
        <div class="row" style="gap:10px; margin-bottom:10px">
          <span class="mt-pill mt-${xc}" style="font-size:11px; padding:4px 10px"><span class="mt-icon">${ic}</span>${lb}</span>
          <span class="${sp > 0 ? "tx-g" : "tx-r"}" style="font-size:12px; font-weight:600">${sp > 0 ? "+" : ""}${sp.toFixed(1)}%</span>
          <span class="dim" style="font-size:10px; letter-spacing:1px">SPREAD</span>
        </div>
        <div class="det-plan" style="grid-template-columns: auto 1fr; margin-bottom:10px">
          <span class="det-plan-k">EMA 12W</span><span class="det-plan-v">${dol(d.mt_ema_fast || d.close)}</span>
          <span class="det-plan-k">EMA 25W</span><span class="det-plan-v">${dol(d.mt_ema_slow || d.close)}</span>
        </div>
        <div style="font-size:11px; color:var(--tx-2); line-height:1.45; margin-bottom:8px">${readNote}</div>
        <div style="font-size:10px; letter-spacing:0.3px">${verdict}</div>
      `;
    })()}

    <div class="det-divider"></div>

    <div class="det-section-lbl">Price vs Moving Averages</div>
    ${smaRows}
    <div class="row spread" style="margin-top:6px; font-size:10px; color:var(--tx-4); letter-spacing:1px">
      <span>52W LO &nbsp; <span class="tx-w">${dol(d.sma200 * 0.7)}</span></span>
      <span>52W HI &nbsp; <span class="tx-w">${dol(d.close / (1 + d.dist_52h / 100))}</span> <span class="${clsRet(d.dist_52h)}" style="margin-left:6px">${pct(d.dist_52h)}</span></span>
    </div>

    <div class="det-divider"></div>

    <div class="det-section-lbl">Minervini Trend Template · ${[d.m1,d.m2,d.m3,d.m4,d.m5,d.m6,d.m7,d.m8].filter(Boolean).length}/8 ${d.all_pass ? "<span class='tx-g' style='font-size:9px; letter-spacing:1px; margin-left:6px'>ALL PASS</span>" : ""}</div>
    <div class="flt-grid">${pills}</div>

    <div class="det-divider"></div>

    <div class="det-section-lbl">Peers In Sector · ${sect || "—"}</div>
    <div>${peersHTML}</div>
  </div>`;

  // star toggle in detail panel
  const starBtn = $("aside").querySelector("[data-star-det]");
  if (starBtn) {
    starBtn.addEventListener("click", () => {
      if (watchlist.has(ticker)) watchlist.delete(ticker);
      else watchlist.add(ticker);
      persistWatchlist();
      renderTable();
      showDetail(ticker);
    });
  }

  // peer click navigation
  $("aside").querySelectorAll("[data-peer]").forEach(p => {
    p.addEventListener("click", () => showDetail(p.dataset.peer));
  });

  // mount TradingView chart
  renderChart(ticker);
}

function resetDetail() {
  activeTicker = null;
  $("aside").innerHTML = `<div class="det-empty">
    <div class="det-empty-icon">⌖</div>
    <div class="det-empty-txt">SELECT A STOCK<br>TO INSPECT SETUP</div>
  </div>`;
}

// ============== TAPE READ — short, sentiment + sector focus ==============
function buildNarrative() {
  const ds = activeDataset();
  const groups = { PULLBACK:[], BREAKOUT:[], TRENDING:[], CAUTION:[], EXTENDED:[], BASING:[], WEAK:[] };
  for (const d of ds) groups[classify(d).setup].push(d);

  const allPass = ds.filter(d => d.all_pass).length;
  const total = ds.length || 1;
  const breadth = Math.round((allPass / total) * 100);

  // Sector strength — weight by score for all-pass stocks
  const sectorStat = {};
  for (const d of ds) {
    const s = secOf(d.ticker);
    if (!s) continue;
    if (!sectorStat[s]) sectorStat[s] = { count: 0, pass: 0, fresh: 0, score: 0 };
    sectorStat[s].count++;
    if (d.all_pass) {
      sectorStat[s].pass++;
      sectorStat[s].score += Math.max(0, d.score);
    }
    if ((d.mt_state || "").startsWith("FRESH_BULL")) sectorStat[s].fresh++;
  }
  const sectorRank = Object.entries(sectorStat)
    .filter(([_, v]) => v.pass > 0)
    .sort((a,b) => b[1].score - a[1].score);
  const leading = sectorRank.slice(0, 2).map(s => s[0]);

  // Regime
  const regime =
    breadth >= 15 ? { tag: "RISK-ON",  cls: "r-on",  word: "broad",  vibe: "trending tape" } :
    breadth >= 5  ? { tag: "NEUTRAL",  cls: "r-mid", word: "narrow", vibe: "mixed tape" } :
                    { tag: "RISK-OFF", cls: "r-off", word: "thin",   vibe: "defensive tape" };

  // Fresh Macro Trend counts
  const freshBull = ds.filter(d => (d.mt_state || "") === "FRESH_BULL");
  const freshBear = ds.filter(d => (d.mt_state || "") === "FRESH_BEAR");

  // Update regime pill
  const pill = $("regime-pill");
  pill.className = `read-regime-pill ${regime.cls}`;
  pill.textContent = `● ${regime.tag}`;

  // Compose short prose — sentiment + sectors + signal balance
  let prose = `Breadth ${regime.word} at <span class="tx-w bold">${breadth}%</span> — <span class="tx-w bold">${allPass}</span> name${allPass === 1 ? "" : "s"} clearing the full Trend Template. `;

  if (leading.length === 2) {
    prose += `<span class="tx-w bold">${leading[0]}</span> and <span class="tx-w bold">${leading[1]}</span> leading the move`;
  } else if (leading.length === 1) {
    prose += `<span class="tx-w bold">${leading[0]}</span> doing the heavy lifting`;
  } else {
    prose += `No standout sector leadership`;
  }

  // Add fresh momentum color
  if (freshBull.length > 0 && freshBear.length === 0) {
    prose += `, <span class="tx-g bold">${freshBull.length} fresh weekly cross${freshBull.length === 1 ? "" : "es"} up</span> confirming the bid.`;
  } else if (freshBear.length > 0 && freshBull.length === 0) {
    prose += `, but <span class="tx-r bold">${freshBear.length} fresh weekly cross${freshBear.length === 1 ? "" : "es"} down</span> — watch for rotation.`;
  } else if (freshBull.length > 0 && freshBear.length > 0) {
    prose += `, mixed weekly signal (<span class="tx-g">${freshBull.length}↑</span> / <span class="tx-r">${freshBear.length}↓</span>).`;
  } else {
    prose += `, no fresh weekly crosses today.`;
  }

  // Closing: best action of the day
  if (groups.PULLBACK.length >= 3) {
    prose += ` Best R/R sits in <span class="tx-p bold">pullback entries</span>.`;
  } else if (groups.BREAKOUT.length >= 3) {
    prose += ` <span class="tx-g bold">Breakouts</span> are the cleanest entries today.`;
  } else if (groups.EXTENDED.length > groups.PULLBACK.length + groups.BREAKOUT.length) {
    prose += ` Most leaders are <span class="tx-r bold">extended</span> — patience over chase.`;
  }

  $("read-prose").innerHTML = prose;

  // Compact metrics row
  $("read-metrics").innerHTML = `
    <div class="read-metric"><span class="read-metric-lbl">All-Pass</span><span class="read-metric-val">${allPass}</span></div>
    <div class="read-metric"><span class="read-metric-lbl">Pullbacks</span><span class="read-metric-val tx-p">${groups.PULLBACK.length}</span></div>
    <div class="read-metric"><span class="read-metric-lbl">Breakouts</span><span class="read-metric-val tx-g">${groups.BREAKOUT.length}</span></div>
    <div class="read-metric"><span class="read-metric-lbl">Extended</span><span class="read-metric-val tx-r">${groups.EXTENDED.length}</span></div>
    <div class="read-metric"><span class="read-metric-lbl">Sectors Active</span><span class="read-metric-val">${sectorRank.length}</span></div>
  `;

  // Fresh strip
  $("fresh-bull-cnt").textContent = freshBull.length;
  $("fresh-bear-cnt").textContent = freshBear.length;
  $("fresh-bull-list").innerHTML = freshBull.length
    ? freshBull.slice(0, 6).map(d => d.ticker).join(" · ") + (freshBull.length > 6 ? ` <span class="dim">+${freshBull.length - 6}</span>` : "")
    : `<span class="fresh-empty">no fresh up-crosses</span>`;
  $("fresh-bear-list").innerHTML = freshBear.length
    ? freshBear.slice(0, 6).map(d => d.ticker).join(" · ") + (freshBear.length > 6 ? ` <span class="dim">+${freshBear.length - 6}</span>` : "")
    : `<span class="fresh-empty">no fresh down-crosses</span>`;

  // Compact signal cards
  $("sig-prime-num").textContent = groups.PULLBACK.length;
  $("sig-prime-tk").textContent = groups.PULLBACK.length ? groups.PULLBACK.slice(0, 5).map(d => d.ticker).join(" · ") + (groups.PULLBACK.length > 5 ? ` +${groups.PULLBACK.length - 5}` : "") : "—";
  $("sig-entry-num").textContent = groups.BREAKOUT.length;
  $("sig-entry-tk").textContent = groups.BREAKOUT.length ? groups.BREAKOUT.slice(0, 5).map(d => d.ticker).join(" · ") + (groups.BREAKOUT.length > 5 ? ` +${groups.BREAKOUT.length - 5}` : "") : "—";
  $("sig-wait-num").textContent = groups.EXTENDED.length;
  $("sig-wait-tk").textContent = groups.EXTENDED.length ? groups.EXTENDED.slice(0, 5).map(d => d.ticker).join(" · ") + (groups.EXTENDED.length > 5 ? ` +${groups.EXTENDED.length - 5}` : "") : "—";

  // KPI strip
  $("kpi-breadth").textContent = breadth + "%";
  $("kpi-allpass").textContent = allPass;
  $("kpi-leaders").textContent = leading.length ? leading.join(" · ") : "—";
  $("kpi-pullbacks").textContent = groups.PULLBACK.length;
  $("kpi-breakouts").textContent = groups.BREAKOUT.length;
  $("kpi-extended").textContent = groups.EXTENDED.length;

  // Macro Trend KPI
  const mtBullCount = ds.filter(d => (d.mt_state || "BULL").endsWith("BULL")).length;
  const mtBearCount = ds.filter(d => (d.mt_state || "BULL").endsWith("BEAR")).length;
  $("kpi-mt-bull").textContent = mtBullCount;
  $("kpi-mt-conflict").textContent = mtBearCount;

  // Header counts
  const setupsCount = DATA.filter(d => SETUPS_TAB_SETUPS.has(classify(d).setup)).length;
  $("c-setups").textContent = "·" + setupsCount;
  $("c-main").textContent   = "·" + DATA.length;
  $("c-watch").textContent  = "·" + watchlist.size;
}

// ============== TABS + FILTERS ==============
document.querySelectorAll(".hdr-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    activeTab = btn.dataset.tab;
    activeFilter = "all";
    document.querySelectorAll(".hdr-tab").forEach(b => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.filter === "all"));
    $("read-card").style.display = (activeTab === "watch" || activeTab === "main") ? "none" : "";
    document.getElementById("fresh-strip").style.display = (activeTab === "watch" || activeTab === "main") ? "none" : "grid";
    document.querySelector(".signals").style.display = (activeTab === "watch") ? "none" : "grid";
    resetDetail();
    buildNarrative();
    renderTable();
  });
});

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    activeFilter = chip.dataset.filter;
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === chip));
    renderTable();
  });
});

document.querySelectorAll(".signal").forEach(s => {
  s.addEventListener("click", () => {
    const setup = s.dataset.jump;
    activeFilter = setup;
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.filter === setup));
    renderTable();
    // smooth scroll to table
    document.querySelector(".table-card").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// ============== LCD TICKER TAPE ==============
const TAPE_SYMBOLS = [
  { sym: "ES",     base: 0.32  },   // S&P futures
  { sym: "NQ",     base: 0.48  },   // Nasdaq futures
  { sym: "SPY",    base: 0.35  },
  { sym: "AAPL",   base: 0.82  },
  { sym: "MSFT",   base: -0.15 },
  { sym: "GOOGL",  base: 1.04  },
  { sym: "AMZN",   base: -0.34 },
  { sym: "NVDA",   base: 1.88  },
  { sym: "META",   base: 0.32  },
  { sym: "TSLA",   base: -2.10 },
  { sym: "GOLD",   base: 0.45  },
  { sym: "OIL",    base: -1.20 },
  { sym: "DXY",    base: 0.12  },
  { sym: "BTC",    base: -0.78 },
];

function tapeItemHTML(t) {
  const cls = t.base > 0.05 ? "up" : t.base < -0.05 ? "down" : "flat";
  const arr = t.base > 0.05 ? "▲" : t.base < -0.05 ? "▼" : "▬";
  const pct = (t.base > 0 ? "+" : "") + t.base.toFixed(2) + "%";
  return `<span class="tape-item"><span class="tape-sym">${t.sym}</span><span class="tape-pct ${cls}"><span class="tape-arrow">${arr}</span> ${pct}</span></span>`;
}

function renderTape() {
  const html = TAPE_SYMBOLS.map(tapeItemHTML).join("");
  // duplicate so the loop is seamless
  $("tape-track").innerHTML = html + html;
}

function tickTape() {
  // Wiggle each percentage by a small random amount to feel alive
  TAPE_SYMBOLS.forEach(t => {
    const wiggle = (Math.random() - 0.5) * 0.08;
    t.base = Math.max(-9.99, Math.min(9.99, t.base + wiggle));
  });
  renderTape();
}

renderTape();
setInterval(tickTape, 3500);

// ============== INIT ==============
persistWatchlist();
buildNarrative();
renderTable();
