// tests-cooling.mjs —— 冷静期
const store = {};
globalThis.localStorage = {
  getItem(k){ return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem(k, v){ store[k] = String(v); },
  removeItem(k){ delete store[k]; }
};
globalThis.alert = function(m){ console.log('[alert] ' + m); };
const C = await import('./core.js');
let pass = 0, fail = 0;
function ok(n, c, x){ if (c) { pass++; console.log('  PASS  ' + n); } else { fail++; console.log('  FAIL  ' + n + (x !== undefined ? '  ->  ' + x : '')); } }

const now = new Date();
const ym = C.ymOf(now);
const S = C.st();
S.months[ym] = { available: 8000, target: 2000 };

console.log('--- 1. 记下想买的东西 ---');
const item = C.addCooling({ name: '机械键盘', amount: 399, days: 3 });
ok('状态 pending', item.status === 'pending', item.status);
ok('默认 3 天', item.days === 3, item.days);
ok('三天后到期', Math.round((new Date(item.remindAt) - now) / 86400000) === 3);
ok('未到期 isDue=false', C.isDue(item) === false);
ok('daysLeft=3', C.daysLeft(item) === 3, C.daysLeft(item));
ok('pendingCooling 有 1 件', C.pendingCooling().length === 1);
ok('dueCooling 有 0 件', C.dueCooling().length === 0);

console.log('--- 2. 到期判定 ---');
C.coolList()[0].remindAt = new Date(Date.now() - 1000).toISOString();
C.save();
ok('过了 remindAt => isDue', C.isDue(C.coolList()[0]) === true);
ok('dueCooling 1 件', C.dueCooling().length === 1);

console.log('--- 3. 选择"不要了" ---');
const entriesBefore = C.st().entries.length;
C.decideCooling(item.id, 'saved');
ok('状态变 saved', C.coolList()[0].status === 'saved');
ok('不再 pending', C.pendingCooling().length === 0);
ok('不自动记账', C.st().entries.length === entriesBefore);
let cs = C.coolingStats(ym);
ok('本月省下 = 399', cs.saved === 399, cs.saved);
ok('件数 = 1', cs.savedCount === 1);

console.log('--- 4. 选择"还是买了" ---');
const item2 = C.addCooling({ name: '球鞋', amount: 620, days: 1 });
C.decideCooling(item2.id, 'bought');
cs = C.coolingStats(ym);
ok('本月买回 = 620', cs.bought === 620, cs.bought);
ok('省下仍是 399', cs.saved === 399, cs.saved);
const auto = C.st().entries[C.st().entries.length - 1];
ok('自动生成一笔记账', !!auto && auto.amount === 620, auto && auto.amount);
ok('记账备注标记来源', auto && auto.note === '冷静期后还是买了', auto && auto.note);
ok('记账地点=商品名', auto && auto.place === '球鞋', auto && auto.place);
ok('这笔钱计入本月已花', C.calc(ym).S >= 620, C.calc(ym).S);

console.log('--- 5. 不能重复决定 ---');
const again = C.decideCooling(item2.id, 'saved');
ok('已决定的不再响应', again === null);

console.log('--- 6. 删除 ---');
C.dropCooling(item.id);
ok('删掉一件剩 1 件', C.coolList().length === 1, C.coolList().length);

console.log('');
console.log(fail === 0 ? 'ALL PASS (' + pass + ')' : 'FAILED ' + fail + ' / ' + (pass + fail));
process.exit(fail === 0 ? 0 : 1);
