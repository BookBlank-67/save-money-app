// app.js —— 界面（日历 / 记一笔 / 设置）
import * as C from './core.js';

const WEEK = C.WEEK;
let tab = 'cal';
let viewYM = C.ymOf(new Date());
let draft = { date: todayStr(), place: '', note: '', verdict: null };

function todayStr(){ const n = new Date(); return C.ymOf(n) + '-' + C.pad(n.getDate()); }

function h(tag, props){
  const el = document.createElement(tag);
  const kids = Array.prototype.slice.call(arguments, 2);
  if (props) {
    Object.keys(props).forEach(function(k){
      const v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
  }
  kids.forEach(function(k){ addKid(el, k); });
  return el;
}
function addKid(el, k){
  if (k === null || k === undefined || k === false) return;
  if (Array.isArray(k)) { k.forEach(function(x){ addKid(el, x); }); return; }
  el.appendChild(typeof k === 'object' ? k : document.createTextNode(String(k)));
}

let toastTimer = null;
function toast(msg){
  let t = document.querySelector('.toast');
  if (!t) { t = h('div', { class: 'toast' }); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 1400);
}

function download(name, text, mime){
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 4000);
}

// ---------- 通用块 ----------
function navBar(){
  const cs = C.coolingStats(viewYM);
  const items = [['cal', '\u{1F4C5}', '日历'], ['entry', '\u270F\uFE0F', '记一笔'], ['cool', '\u{1F9CA}', '冷静期'], ['set', '\u2699\uFE0F', '设置']];
  return h('div', { class: 'nav' }, items.map(function(it){
    const kids = [h('span', { class: 'ic', text: it[1] }), h('span', { text: it[2] })];
    if (it[0] === 'cool' && cs.due > 0) kids.push(h('span', { class: 'badge', text: String(cs.due) }));
    return h('button', {
      class: tab === it[0] ? 'on' : '',
      onclick: function(){ tab = it[0]; render(); }
    }, kids);
  }));
}

function monthTitle(ymStr){
  const p = ymStr.split('-');
  return Number(p[0]) + ' 年 ' + Number(p[1]) + ' 月';
}

// ---------- 日历 ----------
function viewCal(){
  const c = C.calc(viewYM);
  const cs = C.coolingStats(viewYM);
  const frag = document.createDocumentFragment();

  if (cs.due > 0) {
    frag.appendChild(h('div', {
      class: 'card', style: 'border-color:#fbbf24',
      onclick: function(){ tab = 'cool'; render(); }
    }, h('div', { class: 'row' },
      h('div', {},
        h('div', { class: 'mid amber', text: '有 ' + cs.due + ' 件东西到期了' }),
        h('div', { class: 'muted', text: '点这里决定：还买不买' })),
      h('div', { class: 'pill', text: '去决定' })
    )));
  }

  const hint = c.delta > 0.005 ? '比计划多花 ' + C.money(c.delta)
             : (c.delta < -0.005 ? '比计划省下 ' + C.money(-c.delta) : '正好按计划走');
  const hintClass = c.delta > 0.005 ? 'red' : (c.delta < -0.005 ? 'green' : 'dim');
  const pClass = c.P < 0 ? 'red' : (c.P < c.T ? 'amber' : 'green');

  frag.appendChild(h('div', { class: 'card' },
    h('div', { class: 'mnav' },
      h('button', { text: '\u2039', onclick: function(){ viewYM = C.shiftMonth(viewYM, -1); render(); } }),
      h('h1', { text: monthTitle(viewYM) }),
      h('button', { text: '\u203A', onclick: function(){ viewYM = C.shiftMonth(viewYM, 1); render(); } })
    ),
    h('div', { class: 'row small' },
      h('div', {}, h('div', { class: 'muted', text: '本月可用' }), h('div', { class: 'mid mono', text: C.money(c.M) })),
      h('div', { style: 'text-align:right' }, h('div', { class: 'muted', text: '目标存下' }), h('div', { class: 'mid mono', text: C.money(c.T) }))
    ),
    h('hr', { class: 'sep' }),
    h('div', { class: 'muted', text: '预计结余' }),
    h('div', { class: 'big mono ' + pClass, text: C.money(c.P) }),
    h('div', { class: 'small ' + hintClass, text: hint }),
    h('hr', { class: 'sep' }),
    h('div', { class: 'row' },
      h('div', {}, h('div', { class: 'muted', text: '今日可用' }),
        h('div', { class: 'mid mono green', text: c.q === null ? '\u2014' : C.money(c.q) })),
      h('div', { style: 'text-align:right' }, h('div', { class: 'muted', text: '本月已花' }),
        h('div', { class: 'mid mono', text: C.money(c.S) }))
    )
  ));

  frag.appendChild(h('div', { class: 'card small' },
    h('div', { class: 'row' },
      h('span', { class: 'muted', text: '冷静期省下（本月）' }),
      h('span', { class: 'mono green', text: C.money(cs.saved) }))));

  // 日历网格
  const grid = h('div', { class: 'cal' });
  const head = h('div', { class: 'calhead' }, WEEK.map(function(w){ return h('span', { text: w }); }));
  const p = viewYM.split('-');
  const first = new Date(Number(p[0]), Number(p[1]) - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  for (let i = 0; i < lead; i++) grid.appendChild(h('div', { class: 'cell blank' }));

  const qShow = c.q === null ? null : Math.round(c.q);
  c.days.forEach(function(day){
    const isToday = c.isCur && day.day === c.d;
    let amtEl;
    if (day.accrued) {
      if (day.total > 0) {
        const txt = day.fixed > 0
          ? '固' + Math.round(day.fixed) + '自' + Math.round(day.free)
          : String(Math.round(day.free));
        amtEl = h('span', { class: 'amt ' + (day.over ? 'red' : 'green'), text: txt });
      }
    } else if (qShow !== null) {
      amtEl = h('span', { class: 'amt fut', text: String(qShow) });
    }
    const cls = 'cell' + (isToday ? ' today' : '') + (day.accrued && day.total > 0 ? (day.over ? ' over' : ' good') : '');
    grid.appendChild(h('div', {
      class: cls,
      onclick: function(){
        draft.date = day.ds;
        tab = 'entry';
        render();
      }
    }, h('span', { class: 'dnum', text: String(day.day) }), amtEl));
  });

  frag.appendChild(h('div', { class: 'card' }, head, grid,
    h('div', { class: 'legend' },
      h('span', { text: '\u25AA 绿=没超当日基准' }),
      h('span', { text: '\u25AA 红=超了' }),
      h('span', { text: '\u25AA 灰字=照当前速度每天可花' }),
      h('span', { text: '\u25AA 固X自Y=固定/自由' })
    ),
    h('div', { class: 'legend' },
      h('span', { text: '当日基准 ' + C.money(c.dailyBase) + '（本月可花 \u00f7 ' + c.N + ' 天）' })
    )
  ));

  if (viewYM !== C.ymOf(new Date())) {
    frag.appendChild(h('button', {
      class: 'btn ghost', text: '回到本月',
      onclick: function(){ viewYM = C.ymOf(new Date()); render(); }
    }));
  }
  return frag;
}

// ---------- 记一笔 ----------
function viewEntry(){
  const frag = document.createDocumentFragment();
  const s = C.st();
  const places = [];
  s.entries.forEach(function(e){ if (e.place && places.indexOf(e.place) < 0) places.push(e.place); });
  const dl = h('datalist', { id: 'places' }, places.slice(0, 40).map(function(p){ return h('option', { value: p }); }));

  const amountInput = h('input', { type: 'text', inputmode: 'decimal', placeholder: '0.00', value: draft.amount || '' });
  const placeInput = h('input', { type: 'text', placeholder: '便利店 / 外卖 / 打车', value: draft.place, list: 'places' });
  const noteInput = h('input', { type: 'text', placeholder: '买了什么（选填）', value: draft.note });
  const dateInput = h('input', { type: 'date', value: draft.date });

  const vWrap = h('div', { class: 'verdict' });
  function paintVerdict(){
    vWrap.textContent = '';
    [['good', '\u{1F44D} 值'], ['bad', '\u{1F44E} 后悔']].forEach(function(v){
      const on = draft.verdict === v[0];
      vWrap.appendChild(h('button', {
        class: (on ? 'on ' : '') + v[0],
        onclick: function(){
          draft.verdict = (draft.verdict === v[0]) ? null : v[0];
          paintVerdict();
        }
      }, v[1]));
    });
  }
  paintVerdict();

  const listBox = h('div', {});
  function paintList(){
    listBox.textContent = '';
    const list = C.entriesOn(draft.date);
    if (list.length === 0) {
      listBox.appendChild(h('div', { class: 'muted', text: '这天还没有记账' }));
      return;
    }
    let sum = 0;
    list.forEach(function(x){
      sum += x.amount;
      listBox.appendChild(h('div', { class: 'item' },
        h('div', {},
          h('div', { class: 'nm', text: (x.place || '未填') + '  ' + C.money(x.amount) }),
          h('div', { class: 'tag', text: [x.note, x.verdict === 'good' ? '值' : (x.verdict === 'bad' ? '后悔' : '')].filter(Boolean).join(' \u00b7 ') || '\u2014' })
        ),
        h('button', {
          class: 'x', text: '删除',
          onclick: function(){
            if (!confirm('删除这一笔？')) return;
            C.delEntry(x.id);
            paintList();
            toast('已删除');
          }
        })
      ));
    });
    listBox.appendChild(h('div', { class: 'row', style: 'margin-top:8px' },
      h('span', { class: 'muted', text: '合计' }),
      h('span', { class: 'mono', text: C.money(sum) })));
  }
  paintList();

  const saveBtn = h('button', {
    class: 'btn', text: '存一笔',
    onclick: function(){
      const raw = String(amountInput.value || '').replace(/[^0-9.\-]/g, '');
      const amount = Number(raw);
      if (!raw || !isFinite(amount) || amount <= 0) { toast('金额不对'); amountInput.focus(); return; }
      C.addEntry({ date: dateInput.value || todayStr(), amount: amount,
                   place: placeInput.value, note: noteInput.value, verdict: draft.verdict });
      draft.place = placeInput.value;
      draft.note = '';
      draft.verdict = null;
      amountInput.value = '';
      noteInput.value = '';
      paintVerdict();
      paintList();
      toast('已记 \u00a5' + amount);
    }
  });

  frag.appendChild(h('div', { class: 'card' },
    h('div', { class: 'field' }, h('label', { text: '日期' }), dateInput),
    h('div', { class: 'field' }, h('label', { text: '金额' }), amountInput),
    h('div', { class: 'field' }, h('label', { text: '花在哪' }), placeInput, dl),
    h('div', { class: 'field' }, h('label', { text: '备注' }), noteInput),
    h('div', { class: 'field' }, h('label', { text: '值不值' }), vWrap),
    saveBtn
  ));

  frag.appendChild(h('div', { class: 'card' },
    h('h2', { text: '这一天的账' }), listBox));
  return frag;
}

// ---------- 设置 ----------
function viewSet(){
  const frag = document.createDocumentFragment();
  const s = C.st();
  const cfg = C.monthCfg(viewYM);

  const availInput = h('input', { type: 'text', inputmode: 'decimal', value: cfg.available || '' });
  const targetInput = h('input', { type: 'text', inputmode: 'decimal', value: cfg.target || '' });

  frag.appendChild(h('div', { class: 'card' },
    h('h2', { text: '本月设置（' + monthTitle(viewYM) + '）' }),
    h('div', { class: 'field' }, h('label', { text: '本月可用（这个月能动用的钱）' }), availInput),
    h('div', { class: 'field' }, h('label', { text: '目标存下（这个月想剩下多少）' }), targetInput),
    h('button', {
      class: 'btn', text: '保存',
      onclick: function(){
        const a = Number(String(availInput.value).replace(/[^0-9.]/g, '')) || 0;
        const t = Number(String(targetInput.value).replace(/[^0-9.]/g, '')) || 0;
        if (t > a) { toast('目标存下不能大于本月可用'); return; }
        const c = C.monthCfg(viewYM);
        c.available = a; c.target = t;
        C.save();
        toast('已保存');
        render();
      }
    }),
    h('div', { class: 'legend' }, h('span', { text: '新月份会自动沿用最近一次的设置，可随时改。' }))
  ));

  // 固定支出
  const fName = h('input', { type: 'text', placeholder: '通勤 / 早餐 / 房租' });
  const fAmt = h('input', { type: 'text', inputmode: 'decimal', placeholder: '金额' });
  const fFreq = h('select', {},
    h('option', { value: 'daily', text: '每天' }),
    h('option', { value: 'workday', text: '仅工作日' }),
    h('option', { value: 'monthday', text: '每月某日' })
  );
  const fDay = h('input', { type: 'text', inputmode: 'numeric', placeholder: '几号（如 5）', style: 'display:none' });
  fFreq.addEventListener('change', function(){ fDay.style.display = fFreq.value === 'monthday' ? '' : 'none'; });

  const listBox = h('div', {});
  const todayDs = todayStr();
  function paintFixed(){
    listBox.textContent = '';
    if (s.fixed.length === 0) {
      listBox.appendChild(h('div', { class: 'muted', text: '还没有固定支出' }));
      return;
    }
    s.fixed.forEach(function(f){
      const freqTxt = f.freq === 'daily' ? '每天' : (f.freq === 'workday' ? '仅工作日' : '每月 ' + f.day + ' 号');
      const skipped = C.isSkipped(todayDs, f.id);
      listBox.appendChild(h('div', { class: 'item' },
        h('div', {},
          h('div', { class: 'nm', text: f.name + '  ' + C.money(f.amount) }),
          h('div', { class: 'tag', text: freqTxt })
        ),
        h('div', { class: 'row' },
          h('button', {
            class: 'x', text: skipped ? '恢复今天' : '跳过今天',
            onclick: function(){ C.toggleSkip(todayDs, f.id); paintFixed(); render(); }
          }),
          h('button', {
            class: 'x', text: '删除',
            onclick: function(){
              if (!confirm('删除固定支出「' + f.name + '」？')) return;
              s.fixed = s.fixed.filter(function(x){ return x.id !== f.id; });
              C.save(); paintFixed(); render();
            }
          })
        )
      ));
    });
  }
  paintFixed();

  frag.appendChild(h('div', { class: 'card' },
    h('h2', { text: '固定支出（每天自动预提）' }),
    listBox,
    h('hr', { class: 'sep' }),
    h('div', { class: 'field' }, h('label', { text: '名称' }), fName),
    h('div', { class: 'row2 field' }, h('div', {}, h('label', { text: '金额' }), fAmt), h('div', {}, h('label', { text: '频率' }), fFreq)),
    h('div', { class: 'field' }, fDay),
    h('button', {
      class: 'btn ghost', text: '+ 新增固定支出',
      onclick: function(){
        const name = (fName.value || '').trim();
        const amt = Number(String(fAmt.value).replace(/[^0-9.]/g, ''));
        if (!name || !isFinite(amt) || amt <= 0) { toast('名称和金额都要填'); return; }
        const f = { id: C.uid(), name: name, amount: amt, freq: fFreq.value, day: Number(fDay.value) || 1, active: true };
        s.fixed.push(f);
        C.save();
        fName.value = ''; fAmt.value = ''; fDay.value = '';
        paintFixed(); render();
        toast('已添加');
      }
    })
  ));

  // 数据
  const importInput = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
  importInput.addEventListener('change', function(){
    const file = importInput.files && importInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(){
      try {
        const next = JSON.parse(String(reader.result));
        if (!next || next.version !== 1) throw new Error('不是有效的备份文件');
        if (!confirm('导入会覆盖当前所有数据，确定？')) return;
        C.replaceState(next);
        viewYM = C.ymOf(new Date());
        render();
        toast('已恢复');
      } catch (e) { alert('导入失败：' + e.message); }
    };
    reader.readAsText(file);
  });

  frag.appendChild(h('div', { class: 'card' },
    h('h2', { text: '数据（两把锁）' }),
    h('button', {
      class: 'btn ghost', text: '导出完整备份 JSON（能还原）',
      onclick: function(){
        download('省着点-备份-' + C.ymOf(new Date()) + '.json', JSON.stringify(C.st(), null, 2), 'application/json');
        toast('已导出');
      }
    }),
    h('div', { style: 'height:8px' }),
    h('button', {
      class: 'btn ghost', text: '导出明细 CSV（Excel 能开）',
      onclick: function(){ download('省着点-明细-' + viewYM + '.csv', C.entriesCSV(viewYM), 'text/csv;charset=utf-8'); toast('已导出'); }
    }),
    h('div', { style: 'height:8px' }),
    h('button', {
      class: 'btn ghost', text: '导出月度汇总 CSV',
      onclick: function(){ download('省着点-汇总-' + viewYM + '.csv', C.summaryCSV(viewYM), 'text/csv;charset=utf-8'); toast('已导出'); }
    }),
    h('div', { style: 'height:8px' }),
    h('button', { class: 'btn ghost', text: '导入备份 JSON', onclick: function(){ importInput.click(); } }),
    importInput,
    h('div', { class: 'legend' },
      h('span', { text: '数据只存在这台手机浏览器的本地，不上传任何服务器。' }),
      h('span', { text: '建议每周导出一次 JSON 备份。' }))
  ));

  frag.appendChild(h('div', { class: 'card' },
    h('h2', { text: '算法说明（给以后的你看）' }),
    h('div', { class: 'small muted', style: 'line-height:1.7' },
      h('div', { text: '本月可花 = 本月可用 − 目标存下' }),
      h('div', { text: '到期应花 = 本月可花 × 已过天数 ÷ 当月天数' }),
      h('div', { text: '进度偏差 = 已花 − 到期应花' }),
      h('div', { text: '预计结余 = 目标存下 − 进度偏差（可正可负）' }),
      h('div', { text: '今日可用 = (本月可花 − 已花) ÷ 剩余天数（含今天）' })
    )
  ));
  return frag;
}

// ---------- 启动 ----------
function render(){
  const root = document.getElementById('app');
  root.textContent = '';
  if (tab === 'cal') root.appendChild(viewCal());
  else if (tab === 'entry') root.appendChild(viewEntry());
  else if (tab === 'cool') root.appendChild(viewCooling());
  else root.appendChild(viewSet());
  root.appendChild(navBar());
}

window.addEventListener('error', function(ev){
  const root = document.getElementById('app');
  root.textContent = '';
  root.appendChild(h('div', { class: 'card' },
    h('h1', { text: '出错了' }),
    h('div', { class: 'small red', style: 'white-space:pre-wrap;margin-top:8px', text: String(ev.message || ev.reason) })
  ));
});

render();

// ---------- 冷静期 ----------
function viewCooling(){
  const frag = document.createDocumentFragment();
  const cs = C.coolingStats(viewYM);
  const pend = C.pendingCooling();

  frag.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' },
    h('div', {},
      h('div', { class: 'muted', text: '本月省下（忍住没买）' }),
      h('div', { class: 'mid mono green', text: C.money(cs.saved) }),
      h('div', { class: 'muted small', text: cs.savedCount + ' 件' })),
    h('div', { style: 'text-align:right' },
      h('div', { class: 'muted', text: '本月还是买了' }),
      h('div', { class: 'mid mono amber', text: C.money(cs.bought) }),
      h('div', { class: 'muted small', text: cs.boughtCount + ' 件' })))
  ));

  const nameIn = h('input', { type: 'text', placeholder: '想买什么' });
  const amtIn = h('input', { type: 'text', inputmode: 'decimal', placeholder: '多少钱' });
  let days = 3;
  const pills = h('div', { class: 'verdict' });
  function paintPills(){
    pills.textContent = '';
    [1, 3, 7].forEach(function(n){
      pills.appendChild(h('button', {
        class: days === n ? 'on good' : '',
        text: n + ' 天',
        onclick: function(){ days = n; paintPills(); }
      }));
    });
  }
  paintPills();

  frag.appendChild(h('div', { class: 'card' },
    h('h2', { text: '我想买…先放这儿' }),
    h('div', { class: 'field' }, h('label', { text: '想买什么' }), nameIn),
    h('div', { class: 'field' }, h('label', { text: '多少钱' }), amtIn),
    h('div', { class: 'field' }, h('label', { text: '几天后再问我' }), pills),
    h('button', {
      class: 'btn', text: '记下来，先别买',
      onclick: function(){
        const name = (nameIn.value || '').trim();
        const amt = Number(String(amtIn.value).replace(/[^0-9.]/g, ''));
        if (!name) { toast('写一下想买什么'); return; }
        if (!isFinite(amt) || amt <= 0) { toast('金额不对'); return; }
        C.addCooling({ name: name, amount: amt, days: days });
        toast('记住了，' + days + ' 天后再问你');
        render();
      }
    })
  ));

  const pendCard = h('div', { class: 'card' }, h('h2', { text: '等着的（' + pend.length + ' 件）' }));
  if (pend.length === 0) {
    pendCard.appendChild(h('div', { class: 'muted', text: '空的。想买什么先丢进来，忍几天再说。' }));
  }
  pend.forEach(function(it){
    const due = C.isDue(it);
    const left = C.daysLeft(it);
    pendCard.appendChild(h('div', { class: 'item' },
      h('div', {},
        h('div', { class: 'nm', text: it.name + '  ' + C.money(it.amount) }),
        h('div', { class: 'tag' + (due ? ' amber' : ''), text: due ? '到期了，该决定了' : '还有 ' + left + ' 天' })),
      h('div', { class: 'row' },
        h('button', {
          class: 'x green', text: '不要了',
          onclick: function(){
            C.decideCooling(it.id, 'saved');
            toast('省下 ' + C.money(it.amount));
            render();
          }
        }),
        due ? h('button', {
          class: 'x amber', text: '还是要买',
          onclick: function(){
            if (!confirm('确认买了？会自动记一笔账，占本月额度。')) return;
            C.decideCooling(it.id, 'bought');
            toast('已记账');
            render();
          }
        }) : null
      )
    ));
  });
  frag.appendChild(pendCard);

  const done = C.coolList().filter(function(x){ return x.status !== 'pending'; })
    .sort(function(a, b){ return a.decidedAt < b.decidedAt ? 1 : -1; }).slice(0, 20);
  if (done.length) {
    const dc = h('div', { class: 'card' }, h('h2', { text: '有结果的' }));
    done.forEach(function(it){
      dc.appendChild(h('div', { class: 'item' },
        h('div', {},
          h('div', { class: 'nm', text: it.name + '  ' + C.money(it.amount) }),
          h('div', { class: 'tag', text: it.decidedAt ? it.decidedAt.slice(0, 10) : '' })),
        h('span', {
          class: (it.status === 'saved' ? 'green' : 'amber') + ' small',
          text: it.status === 'saved' ? '忍住，省下' : '买了'
        })
      ));
    });
    frag.appendChild(dc);
  }

  frag.appendChild(h('div', { class: 'card small muted', style: 'line-height:1.8' },
    h('div', { text: '规则：记下来 → 到日子再问 → 不要了就计入「本月省下」，买了就自动记一笔账。' }),
    h('div', { text: '提前想通了点「不要了」也算，省钱不分早晚。' })));

  return frag;
}
