// core.js —— 数据、公式、导出。界面在 app.js
export const KEY = 'sm.v1';
export const WEEK = ['一','二','三','四','五','六','日'];

export function pad(n){ return (n < 10 ? '0' : '') + n; }
export function ymOf(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
export function daysInMonth(ymStr){
  const p = ymStr.split('-');
  return new Date(Number(p[0]), Number(p[1]), 0).getDate();
}
export function shiftMonth(ymStr, delta){
  const p = ymStr.split('-');
  const d = new Date(Number(p[0]), Number(p[1]) - 1 + delta, 1);
  return ymOf(d);
}
export function money(n){
  const v = Math.round(n * 100) / 100;
  const neg = v < 0;
  const a = Math.abs(v);
  const s = Number.isInteger(a) ? a.toLocaleString('zh-CN') : a.toFixed(2);
  return (neg ? '\u2212\u00a5' : '\u00a5') + s;
}

let state = null;
export function blank(){ return { version: 1, months: {}, entries: [], fixed: [], skip: {} }; }
export function load(){
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.version === 1) return s; }
  } catch (e) { console.error('load failed', e); }
  return blank();
}
export function st(){
  if (!state) state = load();
  if (!state.months) state.months = {};
  if (!state.entries) state.entries = [];
  if (!state.fixed) state.fixed = [];
  if (!state.skip) state.skip = {};
  return state;
}
export function save(){
  try { localStorage.setItem(KEY, JSON.stringify(st())); }
  catch (e) { console.error(e); alert('保存失败：' + e.message); }
}
export function replaceState(next){ state = next; save(); }
export function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ---------- 月份配置 ----------
export function monthCfg(ymStr){
  const s = st();
  let cfg = s.months[ymStr];
  if (!cfg) {
    const keys = Object.keys(s.months).sort();
    const src = keys.length ? s.months[keys[keys.length - 1]] : { available: 0, target: 0 };
    cfg = { available: src.available, target: src.target };
    s.months[ymStr] = cfg;
    save();
  }
  return cfg;
}

// ---------- 固定支出 ----------
export function fixedAmountOn(f, ds){
  if (!f.active) return 0;
  const dt = new Date(ds + 'T00:00:00');
  if (f.freq === 'daily') return f.amount;
  if (f.freq === 'workday') { const w = dt.getDay(); return (w >= 1 && w <= 5) ? f.amount : 0; }
  if (f.freq === 'monthday') return dt.getDate() === Number(f.day) ? f.amount : 0;
  return 0;
}
export function fixedTotal(ds){
  const skipped = st().skip[ds] || [];
  return st().fixed.reduce(function(sum, f){
    if (skipped.indexOf(f.id) >= 0) return sum;
    return sum + fixedAmountOn(f, ds);
  }, 0);
}
export function isSkipped(ds, id){
  const skipped = st().skip[ds] || [];
  return skipped.indexOf(id) >= 0;
}
export function toggleSkip(ds, id){
  const s = st();
  const list = s.skip[ds] || (s.skip[ds] = []);
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1); else list.push(id);
  if (list.length === 0) delete s.skip[ds];
  save();
}

// ---------- 记账 ----------
export function addEntry(e){
  const s = st();
  const rec = {
    id: uid(),
    date: e.date,
    amount: Number(e.amount),
    place: (e.place || '').trim(),
    note: (e.note || '').trim(),
    verdict: e.verdict || null,
    created: new Date().toISOString()
  };
  s.entries.push(rec);
  save();
  return rec;
}
export function delEntry(id){
  const s = st();
  s.entries = s.entries.filter(function(x){ return x.id !== id; });
  save();
}
export function entriesOn(ds){
  return st().entries.filter(function(x){ return x.date === ds; });
}
export function sumOn(ds){
  return entriesOn(ds).reduce(function(a, x){ return a + x.amount; }, 0);
}

// ---------- 核心计算 ----------
// C=本月可花  EA=到期应花  S=已花累计(含固定预提)  delta=进度偏差  P=预计结余  q=今日可用
export function calc(ymStr){
  const cfg = monthCfg(ymStr);
  const s = st();
  const N = daysInMonth(ymStr);
  const now = new Date();
  const curYM = ymOf(now);

  let d;
  if (ymStr === curYM) d = now.getDate();
  else if (ymStr < curYM) d = N;
  else d = 0;

  const e = Math.max(0, d - 1);
  const R = N - e;
  const M = Number(cfg.available) || 0;
  const T = Number(cfg.target) || 0;
  const C = M - T;
  const EA = C * e / N;
  const dailyBase = C / N;

  let S = 0;
  const days = [];
  for (let day = 1; day <= N; day++) {
    const ds = ymStr + '-' + pad(day);
    const free = sumOn(ds);
    const accrued = day <= d;
    const fixed = accrued ? fixedTotal(ds) : 0;
    const total = free + fixed;
    if (accrued) S += total;
    days.push({ day: day, ds: ds, free: free, fixed: fixed, total: total, accrued: accrued,
                over: accrued && total > dailyBase });
  }

  const delta = S - EA;
  const P = T - delta;
  const q = (R > 0) ? (C - S) / R : null;

  return { ymStr: ymStr, N: N, d: d, e: e, R: R, M: M, T: T, C: C, EA: EA,
           S: S, delta: delta, P: P, q: q, dailyBase: dailyBase, days: days, isCur: ymStr === curYM };
}

// ---------- 导出 ----------
function csvCell(v){
  const s = (v === null || v === undefined) ? '' : String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function csvRows(rows){
  return '\ufeff' + rows.map(function(r){ return r.map(csvCell).join(','); }).join('\r\n');
}
export function entriesCSV(ymStr){
  const s = st();
  const rows = [['日期','金额','花在哪','备注','值不值','是否超支','类型']];
  s.entries.filter(function(x){ return x.date.indexOf(ymStr + '-') === 0; })
    .sort(function(a, b){ return a.date < b.date ? -1 : 1; })
    .forEach(function(x){
      const c = calc(ymStr);
      const day = c.days[Number(x.date.slice(8, 10)) - 1];
      rows.push([x.date, x.amount.toFixed(2), x.place, x.note,
                 x.verdict === 'good' ? '值' : (x.verdict === 'bad' ? '后悔' : ''),
                 day && day.over ? '超支' : '', '记账']);
    });
  const c2 = calc(ymStr);
  c2.days.forEach(function(day){
    const fixed = day.fixed;
    if (fixed > 0) rows.push([day.ds, fixed.toFixed(2), '固定支出', '自动预提', '', day.over ? '超支' : '', '固定']);
  });
  return csvRows(rows);
}
export function summaryCSV(ymStr){
  const c = calc(ymStr);
  const s = st();
  const monthEntries = s.entries.filter(function(x){ return x.date.indexOf(ymStr + '-') === 0; });
  const regret = monthEntries.filter(function(x){ return x.verdict === 'bad'; })
                             .reduce(function(a, x){ return a + x.amount; }, 0);
  const good = monthEntries.filter(function(x){ return x.verdict === 'good'; })
                           .reduce(function(a, x){ return a + x.amount; }, 0);
  const fixedSum = c.days.reduce(function(a, d){ return a + d.fixed; }, 0);

  const byPlace = {};
  monthEntries.forEach(function(x){
    const k = x.place || '未填';
    byPlace[k] = (byPlace[k] || 0) + x.amount;
  });
  const places = Object.keys(byPlace).sort(function(a, b){ return byPlace[b] - byPlace[a]; });

  const rows = [
    ['项目','数值'],
    ['月份', ymStr],
    ['本月可用', c.M.toFixed(2)],
    ['目标存下', c.T.toFixed(2)],
    ['本月可花', c.C.toFixed(2)],
    ['到期应花', c.EA.toFixed(2)],
    ['已花合计', c.S.toFixed(2)],
    ['其中固定支出', fixedSum.toFixed(2)],
    ['其中自由支出', (c.S - fixedSum).toFixed(2)],
    ['进度偏差', c.delta.toFixed(2)],
    ['预计结余', c.P.toFixed(2)],
    ['日均基准', c.dailyBase.toFixed(2)],
    ['记账笔数', monthEntries.length],
    ['后悔金额', regret.toFixed(2)],
    ['后悔占比', monthEntries.length ? (regret / Math.max(1, monthEntries.reduce(function(a,x){return a+x.amount;},0)) * 100).toFixed(1) + '%' : '0%'],
    ['觉得值金额', good.toFixed(2)],
    [],
    ['花在哪','合计']
  ];
  places.forEach(function(p){ rows.push([p, byPlace[p].toFixed(2)]); });
  return csvRows(rows);
}

// ---------- 冷静期 ----------
export function coolList(){
  const s = st();
  if (!s.cooling) s.cooling = [];
  return s.cooling;
}
export function addCooling(d){
  const days = Number(d.days) || 3;
  const now = new Date();
  const rec = {
    id: uid(),
    name: (d.name || '').trim(),
    amount: Number(d.amount) || 0,
    note: (d.note || '').trim(),
    days: days,
    createdAt: now.toISOString(),
    remindAt: new Date(now.getTime() + days * 86400000).toISOString(),
    status: 'pending',
    decidedAt: null
  };
  coolList().push(rec);
  save();
  return rec;
}
export function daysLeft(item){
  return Math.ceil((new Date(item.remindAt).getTime() - Date.now()) / 86400000);
}
export function isDue(item){
  return item.status === 'pending' && new Date(item.remindAt).getTime() <= Date.now();
}
export function pendingCooling(){
  return coolList().filter(function(x){ return x.status === 'pending'; });
}
export function dueCooling(){
  return coolList().filter(isDue);
}
export function decideCooling(id, decision){
  const item = coolList().filter(function(x){ return x.id === id; })[0];
  if (!item || item.status !== 'pending') return null;
  item.status = decision === 'bought' ? 'bought' : 'saved';
  item.decidedAt = new Date().toISOString();
  if (item.status === 'bought') {
    const n = new Date();
    addEntry({ date: ymOf(n) + '-' + pad(n.getDate()), amount: item.amount,
               place: item.name, note: '冷静期后还是买了', verdict: null });
    item.recorded = true;
  }
  save();
  return item;
}
export function dropCooling(id){
  const s = st();
  s.cooling = coolList().filter(function(x){ return x.id !== id; });
  save();
}
export function coolingStats(ymStr){
  let saved = 0, bought = 0, savedCount = 0, boughtCount = 0;
  coolList().forEach(function(x){
    if (!x.decidedAt || x.decidedAt.slice(0, 7) !== ymStr) return;
    if (x.status === 'saved') { saved += x.amount; savedCount++; }
    if (x.status === 'bought') { bought += x.amount; boughtCount++; }
  });
  return { saved: saved, bought: bought, savedCount: savedCount, boughtCount: boughtCount,
           pending: pendingCooling().length, due: dueCooling().length };
}
