// tests.mjs —— 只测公式，不测界面。跑法：node tests.mjs
const store = {};
globalThis.localStorage = {
  getItem(k){ return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem(k, v){ store[k] = String(v); },
  removeItem(k){ delete store[k]; }
};
globalThis.alert = function(m){ console.log('[alert] ' + m); };

const C = await import('./core.js');
let pass = 0, fail = 0;
function ok(name, cond, extra){
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  ->  ' + extra : '')); }
}
function near(a, b){ return Math.abs(a - b) < 1e-6; }

const S = C.st();
const now = new Date();
const ym = now.getFullYear() + '-' + C.pad(now.getMonth() + 1);
const N = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
const d = now.getDate();

S.months[ym] = { available: 8000, target: 2000 };
S.fixed = [
  { id: 'f1', name: '通勤', amount: 8, freq: 'daily', active: true },
  { id: 'f2', name: '早餐', amount: 10, freq: 'daily', active: true }
];
S.entries = [];

console.log('--- 场景1：空账，只有固定支出 ---');
let c = C.calc(ym);
ok('当月天数 N=' + N, c.N === N, c.N);
ok('今天 d=' + d, c.d === d, c.d);
ok('可花 C = 8000-2000 = 6000', near(c.C, 6000), c.C);
ok('到期应花 EA = C*(d-1)/N', near(c.EA, 6000 * (d - 1) / N), c.EA + ' vs ' + (6000 * (d - 1) / N));
ok('固定预提 = 18*' + d + ' = ' + (18 * d), near(c.S, 18 * d), c.S);
ok('P = T - delta', near(c.P, 2000 - (c.S - c.EA)), c.P);
ok('今日可用 q = (C-S)/R', near(c.q, (6000 - 18 * d) / (N - d + 1)), c.q);

console.log('--- 场景2：记一笔 35 ---');
C.addEntry({ date: ym + '-' + C.pad(d), amount: 35, place: '便利店', note: '加班晚饭', verdict: 'good' });
c = C.calc(ym);
ok('已花 S = 18*d + 35', near(c.S, 18 * d + 35), c.S);
ok('偏差 delta = S - EA', near(c.delta, c.S - c.EA), c.delta);
ok('预计结余 P 变了', near(c.P, 2000 - c.delta), c.P);
ok('今日可用 q 变小了', c.q < (6000 - 18 * d) / (N - d + 1), c.q);
const dayCell = c.days[d - 1];
ok('当天格子：固定18 自由35 合计53', near(dayCell.fixed, 18) && near(dayCell.free, 35) && near(dayCell.total, 53),
   JSON.stringify({ f: dayCell.fixed, fr: dayCell.free, t: dayCell.total }));

console.log('--- 场景3：跳过今天通勤 ---');
const before = C.calc(ym).S;
C.toggleSkip(ym + '-' + C.pad(d), 'f1');
const after = C.calc(ym).S;
ok('跳过通勤后 S 少 8', near(before - after, 8), before + ' -> ' + after);
C.toggleSkip(ym + '-' + C.pad(d), 'f1');
ok('再点一次恢复', near(C.calc(ym).S, before), C.calc(ym).S);

console.log('--- 场景4：超支判定 ---');
const base = C.calc(ym).dailyBase;
C.addEntry({ date: ym + '-' + C.pad(d), amount: base * 2, place: '餐厅', note: '大餐', verdict: 'bad' });
c = C.calc(ym);
ok('当天 total > 基准 => over=true', c.days[d - 1].over === true, c.days[d - 1].total + ' vs ' + base);

console.log('--- 场景5：导出 ---');
const csv1 = C.entriesCSV(ym);
ok('明细 CSV 以 BOM 开头', csv1.charCodeAt(0) === 0xFEFF, csv1.charCodeAt(0));
ok('明细 CSV 有表头', csv1.indexOf('日期,金额,花在哪') > 0, csv1.slice(0, 40));
const csv2 = C.summaryCSV(ym);
ok('汇总 CSV 含预计结余', csv2.indexOf('预计结余') > 0);
ok('汇总 CSV 含后悔金额', csv2.indexOf('后悔金额') > 0);

console.log('--- 场景6：金额格式 ---');
ok('money(2000) = ¥2,000', C.money(2000) === '\u00a52,000', C.money(2000));
ok('money(-500) 带负号', C.money(-500).indexOf('\u2212') === 0, C.money(-500));

console.log('--- 场景7：月份边界 ---');
ok('2月天数=28/29', [28, 29].indexOf(C.daysInMonth('2026-02')) >= 0, C.daysInMonth('2026-02'));
ok('12月+1 => 次年1月', C.shiftMonth('2026-12', 1) === '2027-01', C.shiftMonth('2026-12', 1));
ok('1月-1 => 上年12月', C.shiftMonth('2026-01', -1) === '2025-12', C.shiftMonth('2026-01', -1));
const past = C.calc(C.shiftMonth(ym, -1));
ok('上月 R=1（已过完）', past.R === 1, past.R);

console.log('');
console.log(fail === 0 ? 'ALL PASS (' + pass + ')' : 'FAILED ' + fail + ' / ' + (pass + fail));
process.exit(fail === 0 ? 0 : 1);
