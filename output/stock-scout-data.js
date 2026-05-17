// =========================================================================
// STOCK SCOUT v2 — mock data (curated from output/scout_2026-05-16.csv)
// Real data points, picked to show all setup classifications.
// =========================================================================

const SCAN_DATE = "2026-05-16";
const UNIVERSE = "S&P 500";
const SPY = { close: 592.40, change_pct: 0.32 };

const SECTOR_OF = {
  // Tech
  SNDK:"Tech", LITE:"Tech", CIEN:"Tech", DELL:"Tech", VRT:"Tech", STX:"Tech",
  WDC:"Tech", INTC:"Tech", GLW:"Tech", COHR:"Tech", KEYS:"Tech", AMAT:"Tech",
  KLAC:"Tech", LRCX:"Tech", AVGO:"Tech", JBL:"Tech", MPWR:"Tech", MU:"Tech",
  AMD:"Tech", ANET:"Tech", NVDA:"Tech", AAPL:"Tech", MSFT:"Tech", ON:"Tech",
  MRVL:"Tech", ASML:"Tech", TSM:"Tech", ADI:"Tech", TXN:"Tech", TER:"Tech",
  CDNS:"Tech", CSCO:"Tech", FFIV:"Tech", CRWD:"Tech", PANW:"Tech",
  // Energy
  APA:"Energy", FANG:"Energy", OXY:"Energy", EOG:"Energy", HAL:"Energy",
  DVN:"Energy", COP:"Energy", PSX:"Energy", SLB:"Energy", MPC:"Energy",
  VLO:"Energy", TRGP:"Energy", KMI:"Energy", OKE:"Energy", WMB:"Energy",
  XOM:"Energy", CVX:"Energy",
  // Industrials
  GEV:"Industrials", PWR:"Industrials", EME:"Industrials", FIX:"Industrials",
  HWM:"Industrials", CAT:"Industrials", JBHT:"Industrials", ODFL:"Industrials",
  CSX:"Industrials", DOW:"Industrials", BA:"Industrials", NOC:"Industrials",
  TSLA:"Cons. Disc.",
  // Healthcare
  DVA:"Healthcare", IRM:"Real Estate", WST:"Healthcare", LLY:"Healthcare",
  UNH:"Healthcare", REGN:"Healthcare",
  // Materials
  LYB:"Materials", NUE:"Materials", CF:"Materials", STLD:"Materials",
  CTVA:"Materials", DD:"Materials",
  // Financials
  GS:"Financials", C:"Financials", MS:"Financials", JPM:"Financials",
  BK:"Financials", CBOE:"Financials", GL:"Financials",
  // Real Estate
  EQIX:"Real Estate", SPG:"Real Estate", PLD:"Real Estate",
  // Cons Disc
  GNRC:"Cons. Disc.", AMZN:"Cons. Disc.", GOOGL:"Comm. Svcs", META:"Comm. Svcs",
  TGT:"Cons. Disc.", SBUX:"Cons. Disc.",
  // Utilities
  ETR:"Utilities",
  // Watchlists - specific
  BE:"Tech", PL:"Tech", BKSY:"Tech", ABSI:"Healthcare", RKLB:"Industrials",
  LASR:"Tech", EWY:"Financials", IMNM:"Healthcare", ASTS:"Comm. Svcs",
  ROK:"Industrials", "000660.KS":"Tech", "8035.T":"Tech", "6861.T":"Industrials",
  "6954.T":"Industrials", "SU.PA":"Energy", ASX:"Tech", CCJ:"Energy",
  CEG:"Utilities", VST:"Utilities", LHX:"Industrials", PLTR:"Tech",
  ETN:"Industrials", BKR:"Energy", DLR:"Real Estate", MO:"Staples",
  DDOG:"Tech", FTNT:"Tech",
};

const SECTOR_COLORS = {
  "Tech":        "#4da6ff",
  "Healthcare":  "#3ee0a8",
  "Financials":  "#b18bff",
  "Cons. Disc.": "#ff9340",
  "Industrials": "#6680ff",
  "Comm. Svcs":  "#ff6b9c",
  "Energy":      "#f4c860",
  "Staples":     "#7dd6a0",
  "Utilities":   "#88c4ff",
  "Real Estate": "#ff8fbe",
  "Materials":   "#c9a96e",
};

// Hand-picked curated rows from real scan_2026-05-16.csv.
// Each row keeps the exact same shape the Python pipeline produces.
const DATA = [
  // ====== PULLBACKS (all-pass, pullback=true, within 15% of SMA50) ======
  { ticker:"KEYS",  rank:12,  score:411.37, r_squared:0.9117, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:349.01, sma50:318.05, sma150:244.98, sma200:225.82, dist_52h:-4.8, ret_5d:-3.13, dist_10dh:-4.8, pullback:1, day_chg:-0.42 },
  { ticker:"JBL",   rank:22,  score:185.61, r_squared:0.8092, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:339.82, sma50:301.13, sma150:253.05, sma200:243.30, dist_52h:-8.7, ret_5d:-4.32, dist_10dh:-8.7, pullback:1, day_chg:-1.20 },
  { ticker:"IRM",   rank:35,  score:124.78, r_squared:0.7746, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:125.07, sma50:112.82, sma150:99.84,  sma200:98.42,  dist_52h:-5.3, ret_5d:-2.93, dist_10dh:-5.3, pullback:1, day_chg:-0.85 },
  { ticker:"EQIX",  rank:26,  score:169.79, r_squared:0.9054, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:1059.44,sma50:1030.71,sma150:883.26, sma200:855.43, dist_52h:-5.0, ret_5d:-1.18, dist_10dh:-2.6, pullback:1, day_chg:0.18 },
  { ticker:"CAT",   rank:37,  score:108.31, r_squared:0.7238, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:888.31, sma50:781.31, sma150:670.89, sma200:612.97, dist_52h:-4.2, ret_5d:-1.02, dist_10dh:-4.2, pullback:1, day_chg:-0.60 },
  { ticker:"WST",   rank:87,  score:29.78,  r_squared:0.3907, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:302.89, sma50:270.53, sma150:266.23, sma200:262.45, dist_52h:-7.1, ret_5d:-7.07, dist_10dh:-7.1, pullback:1, day_chg:-1.45 },
  { ticker:"SPG",   rank:126, score:12.81,  r_squared:0.42,   m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:200.02, sma50:195.46, sma150:187.31, sma200:183.53, dist_52h:-3.6, ret_5d:-1.04, dist_10dh:-2.7, pullback:1, day_chg:-0.10 },

  // ====== BREAKOUTS (at or near 10-day high, in buy zone) ======
  { ticker:"KMI",   rank:103, score:23.39,  r_squared:0.4420, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:33.63,  sma50:32.46,  sma150:29.39,  sma200:28.67,  dist_52h:-0.4, ret_5d:7.07,  dist_10dh:0.0,  pullback:0, day_chg:1.92 },
  { ticker:"OKE",   rank:60,  score:48.67,  r_squared:0.6512, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:92.32,  sma50:87.06,  sma150:77.54,  sma200:75.90,  dist_52h:-0.6, ret_5d:8.41,  dist_10dh:0.0,  pullback:0, day_chg:2.11 },
  { ticker:"TRGP",  rank:32,  score:133.43, r_squared:0.7948, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:271.99, sma50:244.44, sma150:203.77, sma200:193.45, dist_52h:0.0,  ret_5d:9.62,  dist_10dh:0.0,  pullback:0, day_chg:1.45 },
  { ticker:"ODFL",  rank:91,  score:28.00,  r_squared:0.4455, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:203.12, sma50:199.85, sma150:174.33, sma200:167.22, dist_52h:-9.5, ret_5d:2.42,  dist_10dh:0.0,  pullback:0, day_chg:0.88 },
  { ticker:"GL",    rank:119, score:14.67,  r_squared:0.4841, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:155.04, sma50:146.23, sma150:140.57, sma200:140.28, dist_52h:0.0,  ret_5d:2.62,  dist_10dh:0.0,  pullback:0, day_chg:0.55 },

  // ====== TRENDING (in buy zone, not pulled back, not at 10d high) ======
  { ticker:"VLO",   rank:29,  score:149.97, r_squared:0.8350, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:250.74, sma50:239.57, sma150:199.20, sma200:187.10, dist_52h:-1.4, ret_5d:4.02,  dist_10dh:-1.1, pullback:0, day_chg:0.45 },
  { ticker:"HAL",   rank:39,  score:97.76,  r_squared:0.8854, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:41.76,  sma50:38.48,  sma150:32.50,  sma200:29.92,  dist_52h:-1.3, ret_5d:4.85,  dist_10dh:-0.5, pullback:0, day_chg:0.22 },
  { ticker:"DOW",   rank:17,  score:223.68, r_squared:0.8158, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:38.75,  sma50:38.45,  sma150:29.70,  sma200:27.94,  dist_52h:-7.5, ret_5d:5.10,  dist_10dh:-5.0, pullback:0, day_chg:0.10 },

  // ====== CAUTION (15-25% above SMA50) ======
  { ticker:"VRT",   rank:5,   score:678.54, r_squared:0.9179, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:370.94, sma50:296.64, sma150:224.36, sma200:203.05, dist_52h:-1.4, ret_5d:9.11,  dist_10dh:-1.4, pullback:0, day_chg:2.05 },
  { ticker:"FIX",   rank:11,  score:420.74, r_squared:0.9050, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:1992.74,sma50:1619.02,sma150:1244.33,sma200:1119.11,dist_52h:-2.4, ret_5d:2.07,  dist_10dh:-2.4, pullback:0, day_chg:0.55 },
  { ticker:"PWR",   rank:16,  score:264.52, r_squared:0.8625, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:769.99, sma50:623.78, sma150:517.39, sma200:485.95, dist_52h:-1.9, ret_5d:3.35,  dist_10dh:-1.9, pullback:0, day_chg:0.78 },
  { ticker:"NVDA",  rank:122, score:13.36,  r_squared:0.3000, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:225.32, sma50:193.07, sma150:188.27, sma200:185.96, dist_52h:-4.4, ret_5d:4.70,  dist_10dh:-4.4, pullback:0, day_chg:1.88 },

  // ====== EXTENDED (>25% above SMA50 — wait for pullback) ======
  { ticker:"SNDK",  rank:1,   score:2124.18,r_squared:0.8612, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:1407.61,sma50:922.65, sma150:537.94, sma200:421.95, dist_52h:-9.9, ret_5d:-9.90, dist_10dh:-9.9, pullback:1, day_chg:-3.12 },
  { ticker:"DELL",  rank:4,   score:909.68, r_squared:0.9281, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:241.99, sma50:190.17, sma150:151.00, sma200:146.32, dist_52h:-7.1, ret_5d:-7.09, dist_10dh:-7.1, pullback:1, day_chg:-1.80 },
  { ticker:"STX",   rank:6,   score:627.69, r_squared:0.7420, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:795.47, sma50:539.44, sma150:386.72, sma200:337.14, dist_52h:-4.6, ret_5d:1.64,  dist_10dh:-4.6, pullback:0, day_chg:1.10 },
  { ticker:"INTC",  rank:8,   score:579.62, r_squared:0.5887, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:108.77, sma50:69.50,  sma150:50.81,  sma200:44.79,  dist_52h:-16.0,ret_5d:-12.93,dist_10dh:-16.0,pullback:1, day_chg:-4.20 },
  { ticker:"COHR",  rank:10,  score:469.97, r_squared:0.8655, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:382.45, sma50:298.06, sma150:220.85, sma200:191.47, dist_52h:-5.6, ret_5d:14.08, dist_10dh:-5.6, pullback:0, day_chg:3.85 },
  { ticker:"MU",    rank:24,  score:172.66, r_squared:0.5239, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:724.66, sma50:486.18, sma150:362.35, sma200:306.98, dist_52h:-9.8, ret_5d:-2.97, dist_10dh:-9.8, pullback:1, day_chg:-1.42 },

  // ====== BASING (partial pass) — these still appear in ALL tab ======
  { ticker:"DLR",   rank:41,  score:88.01,  r_squared:0.8706, m1:1,m2:1,m3:1,m4:1,m5:1,m6:0,m7:1,m8:0, all_pass:0, close:188.51, sma50:188.35, sma150:171.70, sma200:170.49, dist_52h:-7.6, ret_5d:-3.48, dist_10dh:-5.6, pullback:1, day_chg:-0.40 },
  { ticker:"FFIV",  rank:44,  score:80.71,  r_squared:0.7782, m1:1,m2:0,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:0, close:362.58, sma50:308.22, sma150:280.37, sma200:290.72, dist_52h:-0.6, ret_5d:2.42,  dist_10dh:-0.6, pullback:0, day_chg:0.65 },
  { ticker:"CRWD",  rank:185, score:1.69,   r_squared:0.0611, m1:1,m2:1,m3:1,m4:0,m5:1,m6:1,m7:1,m8:1, all_pass:0, close:594.08, sma50:442.54, sma150:464.05, sma200:460.47, dist_52h:0.0,  ret_5d:12.56, dist_10dh:0.0,  pullback:0, day_chg:3.15 },
];

const SIGNA = [
  { ticker:"SNDK",  rank:1, score:2124.18,r_squared:0.8612, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:1407.61,sma50:922.65, sma150:537.94, sma200:421.95, dist_52h:-9.9,ret_5d:-9.9, dist_10dh:-9.9,pullback:1, day_chg:-3.12 },
  { ticker:"BE",    rank:4, score:341.71, r_squared:0.5880, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:275.95, sma50:199.62, sma150:149.23, sma200:126.99, dist_52h:-9.1,ret_5d:5.72, dist_10dh:-9.1,pullback:0, day_chg:1.15 },
  { ticker:"PL",    rank:6, score:314.37, r_squared:0.7187, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:41.62,  sma50:33.94,  sma150:23.72,  sma200:20.10,  dist_52h:-3.3,ret_5d:6.61, dist_10dh:-3.3,pullback:0, day_chg:0.92 },
  { ticker:"BKSY",  rank:7, score:209.52, r_squared:0.5459, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:38.75,  sma50:31.91,  sma150:24.78,  sma200:23.46,  dist_52h:-9.2,ret_5d:-1.77,dist_10dh:-9.2,pullback:1, day_chg:-0.45 },
  { ticker:"MU",    rank:8, score:172.66, r_squared:0.5239, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:724.66, sma50:486.18, sma150:362.35, sma200:306.98, dist_52h:-9.8,ret_5d:-2.97,dist_10dh:-9.8,pullback:1, day_chg:-1.42 },
  { ticker:"ABSI",  rank:10,score:145.79, r_squared:0.3978, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:5.13,   sma50:3.72,   sma150:3.47,   sma200:3.31,   dist_52h:-13.8,ret_5d:-13.05,dist_10dh:-13.8,pullback:1, day_chg:-0.55 },
  { ticker:"RKLB",  rank:18,score:0.81,   r_squared:0.0278, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:124.77, sma50:79.25,  sma150:70.59,  sma200:64.94,  dist_52h:-5.9,ret_5d:18.30,dist_10dh:-5.9,pullback:0, day_chg:4.55 },
  { ticker:"GLW",   rank:2, score:531.37, r_squared:0.8280, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:0, all_pass:0, close:191.81, sma50:156.97, sma150:118.09, sma200:106.62, dist_52h:-7.9,ret_5d:2.61, dist_10dh:-7.9,pullback:0, day_chg:0.75 },
  { ticker:"AAPL",  rank:16,score:6.10,   r_squared:0.2432, m1:1,m2:1,m3:1,m4:0,m5:1,m6:1,m7:1,m8:0, all_pass:0, close:300.23, sma50:265.97, sma150:266.35, sma200:258.65, dist_52h:0.0, ret_5d:2.45, dist_10dh:0.0, pullback:0, day_chg:0.82 },
  { ticker:"AVGO",  rank:11,score:49.48,  r_squared:0.4609, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:0, all_pass:0, close:425.19, sma50:369.25, sma150:354.39, sma200:345.83, dist_52h:-3.3,ret_5d:-1.12,dist_10dh:-3.3,pullback:1, day_chg:-0.25 },
];

const AI_SECTOR = [
  { ticker:"MRVL",      rank:1, score:928.03, r_squared:0.7969, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:176.89, sma50:128.17, sma150:99.07, sma200:93.15, dist_52h:-3.1,ret_5d:3.97, dist_10dh:-3.1,pullback:0, day_chg:1.42 },
  { ticker:"VRT",       rank:2, score:678.54, r_squared:0.9179, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:370.94, sma50:296.64, sma150:224.36,sma200:203.05,dist_52h:-1.4,ret_5d:9.11, dist_10dh:-1.4,pullback:0, day_chg:2.05 },
  { ticker:"COHR",      rank:4, score:469.97, r_squared:0.8655, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:382.45, sma50:298.06, sma150:220.85,sma200:191.47,dist_52h:-5.6,ret_5d:14.08,dist_10dh:-5.6,pullback:0, day_chg:3.85 },
  { ticker:"ASX",       rank:5, score:332.08, r_squared:0.7820, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:33.81,  sma50:26.70,  sma150:20.39, sma200:17.95, dist_52h:-4.7,ret_5d:-1.23,dist_10dh:-4.7,pullback:1, day_chg:-0.18 },
  { ticker:"PWR",       rank:6, score:264.52, r_squared:0.8625, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:769.99, sma50:623.78, sma150:517.39,sma200:485.95,dist_52h:-1.9,ret_5d:3.35, dist_10dh:-1.9,pullback:0, day_chg:0.78 },
  { ticker:"AMD",       rank:8, score:172.10, r_squared:0.4407, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:1, all_pass:1, close:424.10, sma50:279.21, sma150:242.34,sma200:224.19,dist_52h:-7.6,ret_5d:-6.83,dist_10dh:-7.6,pullback:1, day_chg:-2.45 },
  { ticker:"NVDA",      rank:19,score:13.36,  r_squared:0.3000, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:0, all_pass:0, close:225.32, sma50:193.07, sma150:188.27,sma200:185.96,dist_52h:-4.4,ret_5d:4.70, dist_10dh:-4.4,pullback:0, day_chg:1.88 },
  { ticker:"AMAT",      rank:9, score:109.04, r_squared:0.7555, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:0, all_pass:0, close:436.62, sma50:380.81, sma150:313.87,sma200:280.81,dist_52h:-1.6,ret_5d:0.27, dist_10dh:-1.6,pullback:0, day_chg:0.32 },
  { ticker:"AVGO",      rank:13,score:49.48,  r_squared:0.4609, m1:1,m2:1,m3:1,m4:1,m5:1,m6:1,m7:1,m8:0, all_pass:0, close:425.19, sma50:369.25, sma150:354.39,sma200:345.83,dist_52h:-3.3,ret_5d:-1.12,dist_10dh:-3.3,pullback:1, day_chg:-0.25 },
  { ticker:"TSLA",      rank:32,score:-8.42, r_squared:0.2820, m1:1,m2:1,m3:1,m4:0,m5:1,m6:1,m7:1,m8:0, all_pass:0, close:422.24, sma50:386.78, sma150:418.78,sma200:407.40,dist_52h:-13.8,ret_5d:-1.43,dist_10dh:-5.2,pullback:1, day_chg:-2.10 },
];

// =========================================================================
// WEEKLY XO MACRO TREND — 12 EMA vs 25 EMA on weekly bars
// state: BULL | FRESH_BULL | BEAR | FRESH_BEAR
// spread = (ema_fast - ema_slow) / ema_slow * 100
// Values curated to match each ticker's apparent weekly trend.
// In Python: compute via closes.resample("W").last().ewm(span=N).mean()
// =========================================================================
const XO_DATA = {
  // Strong long-term trends — BULL
  SNDK:  { state:"BULL",       spread: 24.5 },
  LITE:  { state:"BULL",       spread: 18.2 },
  CIEN:  { state:"BULL",       spread: 14.0 },
  DELL:  { state:"BULL",       spread: 15.8 },
  VRT:   { state:"BULL",       spread: 12.4 },
  STX:   { state:"BULL",       spread: 20.6 },
  WDC:   { state:"BULL",       spread: 16.5 },
  INTC:  { state:"BULL",       spread: 28.1 },
  GLW:   { state:"BULL",       spread: 11.8 },
  COHR:  { state:"BULL",       spread: 14.2 },
  FIX:   { state:"BULL",       spread: 11.5 },
  KEYS:  { state:"BULL",       spread: 5.4  },
  GEV:   { state:"BULL",       spread: 7.8  },
  APA:   { state:"BULL",       spread: 6.1  },
  LYB:   { state:"BULL",       spread: 4.2  },
  PWR:   { state:"BULL",       spread: 10.3 },
  DOW:   { state:"BULL",       spread: 3.4  },
  CF:    { state:"BULL",       spread: 6.8  },
  ON:    { state:"BULL",       spread: 11.0 },
  DVA:   { state:"BULL",       spread: 4.5  },
  JBL:   { state:"BULL",       spread: 6.2  },
  MPWR:  { state:"BULL",       spread: 9.7  },
  MU:    { state:"BULL",       spread: 18.4 },
  AMD:   { state:"BULL",       spread: 17.6 },
  EQIX:  { state:"BULL",       spread: 3.1  },
  MPC:   { state:"BULL",       spread: 5.5  },
  CASY:  { state:"BULL",       spread: 4.8  },
  VLO:   { state:"BULL",       spread: 4.1  },
  HPE:   { state:"BULL",       spread: 8.6  },
  TRGP:  { state:"BULL",       spread: 7.3  },
  FANG:  { state:"BULL",       spread: 5.0  },
  OXY:   { state:"BULL",       spread: 3.9  },
  IRM:   { state:"BULL",       spread: 5.2  },
  AMAT:  { state:"BULL",       spread: 10.4 },
  CAT:   { state:"BULL",       spread: 7.1  },
  EOG:   { state:"BULL",       spread: 4.4  },
  HAL:   { state:"BULL",       spread: 5.7  },
  DVN:   { state:"BULL",       spread: 5.8  },
  KMI:   { state:"FRESH_BULL", spread: 1.8  },   // just crossed
  OKE:   { state:"FRESH_BULL", spread: 2.0  },
  ODFL:  { state:"FRESH_BULL", spread: 1.2  },
  GL:    { state:"FRESH_BULL", spread: 1.5  },
  CSCO:  { state:"BULL",       spread: 13.5 },
  CBOE:  { state:"BULL",       spread: 4.0  },
  KLAC:  { state:"BULL",       spread: 8.2  },
  CSX:   { state:"FRESH_BULL", spread: 1.0  },
  TGT:   { state:"BEAR",       spread: -2.4 },   // weekly rolled — caution despite daily pullback
  PSX:   { state:"BULL",       spread: 6.0  },
  CTVA:  { state:"BULL",       spread: 3.5  },
  LRCX:  { state:"BULL",       spread: 8.5  },
  AVGO:  { state:"BULL",       spread: 5.4  },
  STLD:  { state:"BULL",       spread: 7.0  },
  ADM:   { state:"BULL",       spread: 4.0  },
  AKAM:  { state:"BULL",       spread: 12.5 },
  NUE:   { state:"BULL",       spread: 7.4  },
  WMB:   { state:"BULL",       spread: 4.3  },
  HST:   { state:"BULL",       spread: 3.8  },
  SLB:   { state:"BULL",       spread: 4.6  },
  WST:   { state:"FRESH_BEAR", spread: -0.8 },   // daily pullback but weekly turning bearish
  JBHT:  { state:"BULL",       spread: 6.2  },
  ODFL:  { state:"FRESH_BULL", spread: 1.2  },
  HWM:   { state:"BULL",       spread: 4.4  },
  CMI:   { state:"BULL",       spread: 8.7  },
  BK:    { state:"BULL",       spread: 5.0  },
  SBUX:  { state:"FRESH_BULL", spread: 2.6  },
  GWW:   { state:"BULL",       spread: 5.6  },
  NVDA:  { state:"BULL",       spread: 8.1  },
  SPG:   { state:"BULL",       spread: 2.1  },
  NTRS:  { state:"BULL",       spread: 4.4  },
  MCHP:  { state:"BULL",       spread: 12.0 },
  C:     { state:"BULL",       spread: 3.2  },
  UNH:   { state:"BULL",       spread: 9.3  },
  AMZN:  { state:"FRESH_BULL", spread: 3.5  },
  GOOGL: { state:"BULL",       spread: 10.7 },
  AAPL:  { state:"FRESH_BEAR", spread: -1.2 },   // weekly rolling; daily setup but watch
  // Partial-pass / basing
  DLR:   { state:"FRESH_BEAR", spread: -1.8 },
  FFIV:  { state:"BULL",       spread: 6.5  },
  CRWD:  { state:"FRESH_BULL", spread: 3.4  },
  // Signa specific
  BE:    { state:"BULL",       spread: 19.2 },
  PL:    { state:"BULL",       spread: 16.5 },
  BKSY:  { state:"BULL",       spread: 14.8 },
  ABSI:  { state:"BULL",       spread: 22.0 },
  RKLB:  { state:"BULL",       spread: 26.8 },
  // AI sector specific
  MRVL:  { state:"BULL",       spread: 18.0 },
  ASX:   { state:"BULL",       spread: 15.2 },
  ASML:  { state:"BULL",       spread: 6.4  },
  TSM:   { state:"BULL",       spread: 7.2  },
  PLTR:  { state:"BEAR",       spread: -8.2 },
  META:  { state:"BEAR",       spread: -5.4 },
  MSFT:  { state:"BEAR",       spread: -3.1 },
  TSLA:  { state:"BEAR",       spread: -2.8 },
  NOC:   { state:"BEAR",       spread: -6.5 },
  BA:    { state:"BEAR",       spread: -2.4 },
};

// Merge XO into each data row + compute EMA fast/slow from close as approx
function mergeXO(row) {
  const xo = XO_DATA[row.ticker];
  if (!xo) {
    // sensible default: in-trend BULL if pricing above SMA50
    row.xo_state = row.close > row.sma50 ? "BULL" : "BEAR";
    row.xo_spread_pct = ((row.close - row.sma50) / row.sma50 * 100) * 0.3;
  } else {
    row.xo_state = xo.state;
    row.xo_spread_pct = xo.spread;
  }
  // approximate ema values for display (real impl: weekly resample + .ewm)
  row.xo_ema_slow = row.close / (1 + row.xo_spread_pct / 100 / 2);
  row.xo_ema_fast = row.xo_ema_slow * (1 + row.xo_spread_pct / 100);
  return row;
}

DATA.forEach(mergeXO);
SIGNA.forEach(mergeXO);
AI_SECTOR.forEach(mergeXO);

// =========================================================================
// CLASSIFIER — derived setup + action from raw fields
// Thresholds:
//   BUY ZONE   :  0–15% above SMA50 (Minervini's "ideal")
//   CAUTION    : 15–25% above SMA50
//   EXTENDED   :  >25% above SMA50
// =========================================================================
function classify(d) {
  const distFromSMA50 = (d.close - d.sma50) / d.sma50 * 100;
  const inBuyZone = distFromSMA50 <= 15;
  const inCautionZone = distFromSMA50 > 15 && distFromSMA50 <= 25;
  const extended = distFromSMA50 > 25;
  const atBreakout = d.dist_10dh >= -1.0;  // within 1% of 10d high

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

// =========================================================================
// TRADE PLAN — entry / stop / target / R-R suggestions
// =========================================================================
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

function fmt(n) {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(2);
  return n.toFixed(2);
}
