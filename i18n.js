// i18n.js —— 中英双语：界面文案、星期表头、月份标题、CSV 表头、导出文件名
export const LKEY = 'sm.lang';
export const LANGS = ['zh', 'en'];

const D = {
  zh: {
    'app.title': '省着点',
    'nav.cal': '日历', 'nav.entry': '记一笔', 'nav.cool': '冷静期', 'nav.set': '设置',

    'cal.due': '有 {n} 件东西到期了', 'cal.dueSub': '点这里决定：还买不买', 'cal.dueGo': '去决定',
    'cal.over': '比计划多花 {v}', 'cal.under': '比计划省下 {v}', 'cal.onTrack': '正好按计划走',
    'cal.available': '本月可用', 'cal.target': '目标存下', 'cal.left': '预计结余',
    'cal.today': '今日可用', 'cal.spent': '本月已花', 'cal.coolSaved': '冷静期省下（本月）',
    'cal.legendOnBase': '\u25aa 绿=没超当日基准', 'cal.legendOver': '\u25aa 红=超了',
    'cal.legendGrey': '\u25aa 灰字=照当前速度每天可花', 'cal.legendFixed': '\u25aa 固X自Y=固定/自由',
    'cal.base': '当日基准 {v}（本月可花 \u00f7 {n} 天）', 'cal.back': '回到本月',
    'cal.cellFixed': '固{f}自{r}',

    'entry.date': '日期', 'entry.amount': '金额', 'entry.place': '花在哪', 'entry.note': '备注',
    'entry.verdict': '值不值', 'entry.good': '\u{1F44D} 值', 'entry.bad': '\u{1F44E} 后悔',
    'entry.save': '存一笔', 'entry.empty': '这天还没有记账', 'entry.noPlace': '未填',
    'entry.total': '合计', 'entry.del': '删除', 'entry.confirmDel': '删除这一笔？',
    'entry.deleted': '已删除', 'entry.badAmount': '金额不对', 'entry.saved': '已记 \u00a5{v}',
    'entry.dayCard': '这一天的账', 'entry.phPlace': '便利店 / 外卖 / 打车', 'entry.phNote': '买了什么（选填）',

    'set.lang': '语言 / Language', 'set.title': '本月设置（{m}）',
    'set.avail': '本月可用（这个月能动用的钱）', 'set.target': '目标存下（这个月想剩下多少）',
    'set.save': '保存', 'set.targetTooBig': '目标存下不能大于本月可用', 'set.saved': '已保存',
    'set.carry': '新月份会自动沿用最近一次的设置，可随时改。',

    'fixed.title': '固定支出（每天自动预提）', 'fixed.empty': '还没有固定支出',
    'fixed.everyday': '每天', 'fixed.workday': '仅工作日', 'fixed.monthday': '每月某日',
    'fixed.monthdayN': '每月 {n} 号', 'fixed.name': '名称', 'fixed.amount': '金额', 'fixed.freq': '频率',
    'fixed.add': '+ 新增固定支出', 'fixed.skip': '跳过今天', 'fixed.unskip': '恢复今天',
    'fixed.del': '删除', 'fixed.confirmDel': '删除固定支出\u300c{n}\u300d？',
    'fixed.needBoth': '名称和金额都要填', 'fixed.added': '已添加',
    'fixed.phName': '通勤 / 早餐 / 房租', 'fixed.phAmount': '金额', 'fixed.phDay': '几号（如 5）',

    'data.title': '数据（两把锁）', 'data.exportJson': '导出完整备份 JSON（能还原）',
    'data.exportCsv': '导出明细 CSV（Excel 能开）', 'data.exportSum': '导出月度汇总 CSV',
    'data.import': '导入备份 JSON', 'data.exported': '已导出', 'data.notBackup': '不是有效的备份文件',
    'data.confirmImport': '导入会覆盖当前所有数据，确定？', 'data.restored': '已恢复',
    'data.importFail': '导入失败：{m}',
    'data.privacy': '数据只存在这台手机浏览器的本地，不上传任何服务器。',
    'data.weekly': '建议每周导出一次 JSON 备份。',

    'algo.title': '算法说明（给以后的你看）',
    'algo.c1': '本月可花 = 本月可用 \u2212 目标存下',
    'algo.c2': '到期应花 = 本月可花 \u00d7 已过天数 \u00f7 当月天数',
    'algo.c3': '进度偏差 = 已花 \u2212 到期应花',
    'algo.c4': '预计结余 = 目标存下 \u2212 进度偏差（可正可负）',
    'algo.c5': '今日可用 = (本月可花 \u2212 已花) \u00f7 剩余天数（含今天）',

    'cool.savedLabel': '本月省下（忍住没买）', 'cool.boughtLabel': '本月还是买了',
    'cool.pieces': '{n} 件', 'cool.newTitle': '我想买\u2026先放这儿',
    'cool.name': '想买什么', 'cool.amount': '多少钱', 'cool.daysLabel': '几天后再问我',
    'cool.dayN': '{n} 天', 'cool.add': '记下来，先别买',
    'cool.needName': '写一下想买什么', 'cool.badAmount': '金额不对',
    'cool.added': '记住了，{n} 天后再问你', 'cool.pending': '等着的（{n} 件）',
    'cool.empty': '空的。想买什么先丢进来，忍几天再说。',
    'cool.due': '到期了，该决定了', 'cool.left': '还有 {n} 天',
    'cool.notNow': '不要了', 'cool.buyAnyway': '还是要买', 'cool.savedToast': '省下 {v}',
    'cool.confirmBuy': '确认买了？会自动记一笔账，占本月额度。', 'cool.recorded': '已记账',
    'cool.done': '有结果的', 'cool.statusSaved': '忍住，省下', 'cool.statusBought': '买了',
    'cool.rule1': '规则：记下来 \u2192 到日子再问 \u2192 不要了就计入\u300c本月省下\u300d，买了就自动记一笔账。',
    'cool.rule2': '提前想通了点\u300c不要了\u300d也算，省钱不分早晚。',

    'err.title': '出错了'
  },

  en: {
    'app.title': 'Spare Money',
    'nav.cal': 'Calendar', 'nav.entry': 'Add', 'nav.cool': 'Cool-off', 'nav.set': 'Settings',

    'cal.due': '{n} item(s) ready to decide', 'cal.dueSub': 'Tap to decide: buy or not', 'cal.dueGo': 'Decide',
    'cal.over': '{v} over plan', 'cal.under': '{v} under plan', 'cal.onTrack': 'Right on plan',
    'cal.available': 'Available', 'cal.target': 'Save target', 'cal.left': 'Projected left',
    'cal.today': 'Today', 'cal.spent': 'Spent', 'cal.coolSaved': 'Saved by cool-off (this month)',
    'cal.legendOnBase': '\u25aa Green = under daily base', 'cal.legendOver': '\u25aa Red = over',
    'cal.legendGrey': '\u25aa Grey = daily budget at this pace', 'cal.legendFixed': '\u25aa Ffixed/Rfree = fixed/free',
    'cal.base': 'Daily base {v} (spendable \u00f7 {n} days)', 'cal.back': 'Back to this month',
    'cal.cellFixed': 'F{f}\u00b7{r}',

    'entry.date': 'Date', 'entry.amount': 'Amount', 'entry.place': 'Where', 'entry.note': 'Note',
    'entry.verdict': 'Worth it?', 'entry.good': '\u{1F44D} Worth it', 'entry.bad': '\u{1F44E} Regret',
    'entry.save': 'Save', 'entry.empty': 'No entries yet', 'entry.noPlace': '—',
    'entry.total': 'Total', 'entry.del': 'Delete', 'entry.confirmDel': 'Delete this entry?',
    'entry.deleted': 'Deleted', 'entry.badAmount': 'Invalid amount', 'entry.saved': 'Saved \u00a5{v}',
    'entry.dayCard': "This day's entries", 'entry.phPlace': 'Store / takeout / taxi', 'entry.phNote': 'What did you buy (optional)',

    'set.lang': '语言 / Language', 'set.title': 'This month ({m})',
    'set.avail': 'Available this month (money you can spend)', 'set.target': 'Save target (how much to keep)',
    'set.save': 'Save', 'set.targetTooBig': "Save target can't exceed available", 'set.saved': 'Saved',
    'set.carry': 'New months inherit the latest setting. You can change it anytime.',

    'fixed.title': 'Fixed costs (accrued daily)', 'fixed.empty': 'No fixed costs yet',
    'fixed.everyday': 'Daily', 'fixed.workday': 'Weekdays only', 'fixed.monthday': 'Day of month',
    'fixed.monthdayN': 'Day {n}', 'fixed.name': 'Name', 'fixed.amount': 'Amount', 'fixed.freq': 'Frequency',
    'fixed.add': '+ Add fixed cost', 'fixed.skip': 'Skip today', 'fixed.unskip': 'Undo skip',
    'fixed.del': 'Delete', 'fixed.confirmDel': 'Delete fixed cost "{n}"?',
    'fixed.needBoth': 'Name and amount are required', 'fixed.added': 'Added',
    'fixed.phName': 'Commute / Breakfast / Rent', 'fixed.phAmount': 'Amount', 'fixed.phDay': 'Day (e.g. 5)',

    'data.title': 'Data (two locks)', 'data.exportJson': 'Export full backup JSON (restorable)',
    'data.exportCsv': 'Export detail CSV (opens in Excel)', 'data.exportSum': 'Export monthly summary CSV',
    'data.import': 'Import backup JSON', 'data.exported': 'Exported', 'data.notBackup': 'Not a valid backup file',
    'data.confirmImport': 'Import will overwrite all current data. Continue?', 'data.restored': 'Restored',
    'data.importFail': 'Import failed: {m}',
    'data.privacy': 'Data lives only in this browser on this device. Nothing is uploaded.',
    'data.weekly': 'Export a JSON backup once a week.',

    'algo.title': 'How it is calculated',
    'algo.c1': 'Spendable = Available \u2212 Save target',
    'algo.c2': 'Expected so far = Spendable \u00d7 days passed \u00f7 days in month',
    'algo.c3': 'Drift = Spent \u2212 Expected so far',
    'algo.c4': 'Projected left = Save target \u2212 Drift (can be negative)',
    'algo.c5': 'Today = (Spendable \u2212 Spent) \u00f7 days left (incl. today)',

    'cool.savedLabel': 'Saved this month (resisted)', 'cool.boughtLabel': 'Bought anyway',
    'cool.pieces': '{n}', 'cool.newTitle': 'Want it? Park it here',
    'cool.name': 'What', 'cool.amount': 'How much', 'cool.daysLabel': 'Ask me again in',
    'cool.dayN': '{n}d', 'cool.add': 'Note it, do not buy yet',
    'cool.needName': 'Enter what you want', 'cool.badAmount': 'Invalid amount',
    'cool.added': 'Noted. I will ask in {n} days', 'cool.pending': 'Waiting ({n})',
    'cool.empty': 'Empty. Park impulse buys here and wait a few days.',
    'cool.due': 'Ready — time to decide', 'cool.left': '{n} days left',
    'cool.notNow': 'Do not want it', 'cool.buyAnyway': 'Buy anyway', 'cool.savedToast': 'Saved {v}',
    'cool.confirmBuy': 'Buy it? This records the expense against this month.', 'cool.recorded': 'Recorded',
    'cool.done': 'Decided', 'cool.statusSaved': 'Resisted — saved', 'cool.statusBought': 'Bought',
    'cool.rule1': 'Rule: park it \u2192 we ask later \u2192 "do not want it" adds to saved; buying records the expense.',
    'cool.rule2': 'Changing your mind early counts too. Saving early is still saving.',

    'err.title': 'Something broke'
  }
};

const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const ZH_WEEK = ['\u4e00','\u4e8c','\u4e09','\u56db','\u4e94','\u516d','\u65e5'];
const EN_WEEK = ['M','T','W','T','F','S','S'];

function readLang(){
  try {
    const v = localStorage.getItem(LKEY);
    if (v === 'zh' || v === 'en') return v;
  } catch (e) {}
  try {
    const n = String(navigator.language || 'zh').toLowerCase();
    return n.indexOf('zh') === 0 ? 'zh' : 'en';
  } catch (e) { return 'zh'; }
}

let lang = readLang();

export function getLang(){ return lang; }
export function setLang(l){
  if (l !== 'zh' && l !== 'en') return;
  lang = l;
  try { localStorage.setItem(LKEY, l); } catch (e) {}
  try { document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'; } catch (e) {}
  try { document.title = T('app.title'); } catch (e) {}
}

export function T(key, vars){
  const pack = D[lang] || D.zh;
  let s = pack[key];
  if (s === undefined) s = D.zh[key];
  if (s === undefined) return key;
  if (vars) {
    Object.keys(vars).forEach(function(k){ s = s.split('{' + k + '}').join(String(vars[k])); });
  }
  return s;
}

export function weekLabels(){
  return (lang === 'zh' ? ZH_WEEK : EN_WEEK).slice();
}

export function monthTitle(ymStr){
  const p = ymStr.split('-');
  const y = Number(p[0]);
  const m = Number(p[1]);
  if (lang === 'zh') return y + ' \u5e74 ' + m + ' \u6708';
  return EN_MONTHS[m - 1] + ' ' + y;
}

export function csvLabels(){
  const zh = {
    date: '\u65e5\u671f', amount: '\u91d1\u989d', place: '\u82b1\u5728\u54ea', note: '\u5907\u6ce8',
    verdict: '\u503c\u4e0d\u503c', over: '\u662f\u5426\u8d85\u652f', kind: '\u7c7b\u578b',
    good: '\u503c', bad: '\u540e\u6094', overWord: '\u8d85\u652f', entry: '\u8bb0\u8d26', fixed: '\u56fa\u5b9a',
    fixedPlace: '\u56fa\u5b9a\u652f\u51fa', fixedNote: '\u81ea\u52a8\u9884\u63d0', noPlace: '\u672a\u586b',
    item: '\u9879\u76ee', value: '\u6570\u503c', month: '\u6708\u4efd', available: '\u672c\u6708\u53ef\u7528',
    target: '\u76ee\u6807\u5b58\u4e0b', spendable: '\u672c\u6708\u53ef\u82b1', expected: '\u5230\u671f\u5e94\u82b1',
    spent: '\u5df2\u82b1\u5408\u8ba1', fixedOf: '\u5176\u4e2d\u56fa\u5b9a\u652f\u51fa', freeOf: '\u5176\u4e2d\u81ea\u7531\u652f\u51fa',
    drift: '\u8fdb\u5ea6\u504f\u5dee', projected: '\u9884\u8ba1\u7ed3\u4f59', dailyBase: '\u65e5\u5747\u57fa\u51c6',
    entryCount: '\u8bb0\u8d26\u7b14\u6570', regret: '\u540e\u6094\u91d1\u989d', regretPct: '\u540e\u6094\u5360\u6bd4',
    goodSum: '\u89c9\u5f97\u503c\u91d1\u989d', byPlace: '\u82b1\u5728\u54ea', total: '\u5408\u8ba1'
  };
  const en = {
    date: 'Date', amount: 'Amount', place: 'Where', note: 'Note', verdict: 'Worth it', over: 'Over budget',
    kind: 'Type', good: 'Worth it', bad: 'Regret', overWord: 'Over', entry: 'Entry', fixed: 'Fixed',
    fixedPlace: 'Fixed cost', fixedNote: 'Auto-accrued', noPlace: '(none)',
    item: 'Item', value: 'Value', month: 'Month', available: 'Available', target: 'Save target',
    spendable: 'Spendable', expected: 'Expected so far', spent: 'Total spent', fixedOf: 'of which fixed',
    freeOf: 'of which free', drift: 'Drift', projected: 'Projected left', dailyBase: 'Daily base',
    entryCount: 'Entries', regret: 'Regret amount', regretPct: 'Regret share', goodSum: 'Worth-it amount',
    byPlace: 'Where', total: 'Total'
  };
  return lang === 'zh' ? zh : en;
}

export function fname(kind, value){
  const v = String(value);
  if (lang === 'zh') {
    if (kind === 'backup') return '\u7701\u7740\u70b9-\u5907\u4efd-' + v + '.json';
    if (kind === 'detail') return '\u7701\u7740\u70b9-\u660e\u7ec6-' + v + '.csv';
    return '\u7701\u7740\u70b9-\u6c47\u603b-' + v + '.csv';
  }
  if (kind === 'backup') return 'spare-money-backup-' + v + '.json';
  if (kind === 'detail') return 'spare-money-detail-' + v + '.csv';
  return 'spare-money-summary-' + v + '.csv';
}
