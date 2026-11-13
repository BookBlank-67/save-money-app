// app.js —— 界面（日历 / 记一笔 / 冷静期 / 设置）。文案在 i18n.js
import * as C from './core.js';
import { T, getLang, setLang, weekLabels, monthTitle, csvLabels, fname } from './i18n.js';

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
  const items = [['cal', '\u{1F4C5}', T('nav.cal')], ['entry', '\u270F\uFE0F', T('nav.entry')],
                 ['cool', '\u{1F9CA}', T('nav.cool')], ['set', '\u2699\uFE0F', T('nav.set')]];
  return h('div', { class: 'nav' }, items.map(function(it){
    const kids = [h('span', { class: 'ic', text: it[1] }), h('span', { text: it[2] })];
    if (it[0] === 'cool' && cs.due > 0) kids.push(h('span', { class: 'badge', text: String(cs.due) }));
    return h('button', {
      class: tab === it[0] ? 'on' : '',
      onclick: function(){ tab = it[0]; render(); }
    }, kids);
  }));
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
        h('div', { class: 'mid amber', text: T('cal.due', { n: cs.due }) }),
        h('div', { class: 'muted', text: T('cal.dueSub') })),
      h('div', { class: 'pill', text: T('cal.dueGo') })
    )));
  }

  const hint = c.delta > 0.005 ? T('cal.over', { v: C.money(c.delta) })
             : (c.delta < -0.005 ? T('cal.under', { v: C.money(-c.delta) }) : T('cal.onTrack'));
  const hintClass = c.delta > 0.005 ? 'red' : (c.delta < -0.005 ? 'green' : 'dim');
  const pClass = c.P < 0 ? 'red' : (c.P < c.T ? 'amber' : 'green');

  frag.appendChild(h('div', { class: 'card' },
    h('div', { class: 'mnav' },
      h('button', { text: '\u2039', onclick: function(){ viewYM = C.shiftMonth(viewYM, -1); render(); } }),
      h('h1', { text: monthTitle(viewYM) }),
      h('button', { text: '\u203A', onclick: function(){ viewYM = C.shiftMonth(viewYM, 1); render(); } })
    ),
    h('div', { class: 'row small' },
      h('div', {}, h('div', { class: 'muted', text: T('cal.available') }), h('div', { class: 'mid mono', text: C.money(c.M) })),
      h('div', { style: 'text-align:right' }, h('div', { class: 'muted', text: T('cal.target') }), h('div', { class: 'mid mono', text: C.money(c.T) }))
    ),
    h('hr', { class: 'sep' }),
    h('div', { class: 'muted', text: T('cal.left') }),
    h('div', { class: 'big mono ' + pClass, text: C.money(c.P) }),
    h('div', { class: 'small ' + hintClass, text: hint }),
    h('hr', { class: 'sep' }),
    h('div', { class: 'row' },
      h('div', {}, h('div', { class: 'muted', text: T('cal.today') }),
        h('div', { class: 'mid mono green', text: c.q === null ? '\u2014' : C.money(c.q) })),
      h('div', { style: 'text-align:right' }, h('div', { class: 'muted', text: T('cal.spent') }),
        h('div', { class: 'mid mono', text: C.money(c.S) }))
    )
  ));

  frag.appendChild(h('div', { class: 'card small' },
    h('div', { class: 'row' },
      h('span', { class: 'muted', text: T('cal.coolSaved') }),
      h('span', { class: 'mono green', text: C.money(cs.saved) }))));

  // 日历网格
  const grid = h('div', { class: 'cal' });
  const head = h('div', { class: 'calhead' }, weekLabels().map(function(w){ return h('span', { text: w }); }));
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
          ? T('cal.cellFixed', { f: Math.round(day.fixed), r: Math.round(day.free) })
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
      h('span', { text: T('cal.legendOnBase') }),
      h('span', { text: T('cal.legendOver') }),
      h('span', { text: T('cal.legendGrey') }),
      h('span', { text: T('cal.legendFixed') })
    ),
    h('div', { class: 'legend' },
      h('span', { text: T('cal.base', { v: C.money(c.dailyBase), n: c.N }) })
    )
  ));

  if (viewYM !== C.ymOf(new Date())) {
    frag.appendChild(h('button', {
      class: 'btn ghost', text: T('cal.back'),
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
  const placeInput = h('input', { type: 'text', placeholder: T('entry.phPlace'), value: draft.place, list: 'places' });
  const noteInput = h('input', { type: 'text', placeholder: T('entry.phNote'), value: draft.note });
  const dateInput = h('input', { type: 'date', value: draft.date });

  const vWrap = h('div', { class: 'verdict' });
  function paintVerdict(){
    vWrap.textContent = '';
    [['good', T('entry.good')], ['bad', T('entry.bad')]].forEach(function(v){
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
      listBox.appendChild(h('div', { class: 'muted', text: T('entry.empty') }));
      return;
    }
    let sum = 0;
    list.forEach(function(x){
      sum += x.amount;
      const tags = [];
      if (x.note) tags.push(x.note);
      if (x.verdict === 'good') tags.push(T('entry.good').replace('\u{1F44D} ', ''));
      else if (x.verdict === 'bad') tags.push(T('entry.bad').replace('\u{1F44E} ', ''));
      listBox.appendChild(h('div', { class: 'item' },
        h('div', {},
          h('div', { class: 'nm', text: (x.place || T('entry.noPlace')) + '  ' + C.money(x.amount) }),
          h('div', { class: 'tag', text: tags.join(' \u00b7 ') || '\u2014' })
        ),
        h('button', {
          class: 'x', text: T('entry.del'),
          onclick: function(){
            if (!confirm(T('entry.confirmDel'))) return;
            C.delEntry(x.id);
            paintList();
            toast(T('entry.deleted'));
          }
        })
      ));
    });
    listBox.appendChild(h('div', { class: 'row', style: 'margin-top:8px' },
      h('span', { class: 'muted', text: T('entry.total') }),
      h('span', { class: 'mono', text: C.money(sum) })));
  }
  paintList();

  const saveBtn = h('button', {
    class: 'btn', text: T('entry.save'),
    onclick: function(){
      const raw = String(amountInput.value || '').replace(/[^0-9.\-]/g, '');
      const amount = Number(raw);
      if (!raw || !isFinite(amount) || amount <= 0) { toast(T('entry.badAmount')); amountInput.focus(); return; }
      C.addEntry({ date: dateInput.value || todayStr(), amount: amount,
                   place: placeInput.value, note: noteInput.value, verdict: draft.verdict });
      draft.place = placeInput.value;
      draft.note = '';
      draft.verdict = null;
      amountInput.value = '';
      noteInput.value = '';
      paintVerdict();
      paintList();
      toast(T('entry.saved', { v: amount }));
    }
  });

  frag.appendChild(h('div', { class: 'card' },
    h('div', { class: 'field' }, h('label', { text: T('entry.date') }), dateInput),
    h('div', { class: 'field' }, h('label', { text: T('entry.amount') }), amountInput),
    h('div', { class: 'field' }, h('label', { text: T('entry.place') }), placeInput, dl),
    h('div', { class: 'field' }, h('label', { text: T('entry.note') }), noteInput),
    h('div', { class: 'field' }, h('label', { text: T('entry.verdict') }), vWrap),
    saveBtn
  ));

  frag.appendChild(h('div', { class: 'card' },
    h('h2', { text: T('entry.dayCard') }), listBox));
  return frag;
}

// ---------- 设置 ----------
function viewSet(){
  const frag = document.createDocumentFragment();
  const s = C.st();
  const cfg = C.monthCfg(viewYM);

  // 语言
  const langPills = h('div', { class: 'verdict' }, ['zh', 'en'].map(function(l){
    const on = getLang() === l;
    return h('button', {
      class: on ? 'on good' : '',
      text: l === 'zh' ? '\u4e2d\u6587' : 'English',
      onclick: function(){ setLang(l); render(); }
    });
  }));
  frag.appendChild(h('div', { class: 'card' },
    h('div', { class: 'field' }, h('label', { text: T('set.lang') }), langPills)));

  const availInput = h('input', { type: 'text', inputmode: 'decimal', value: cfg.available || '' });
  const targetInput = h('input', { type: 'text', inputmode: 'decimal', value: cfg.target || '' });

  frag.appendChild(h('div', { class: 'card' },
    h('h2', { text: T('set.title', { m: monthTitle(viewYM) }) }),
    h('div', { class: 'field' }, h('label', { text: T('set.avail') }), availInput),
    h('div', { class: 'field' }, h('label', { text: T('set.target') }), targetInput),
    h('button', {
      class: 'btn', text: T('set.save'),
      onclick: function(){
        const a = Number(String(availInput.value).replace(/[^0-9.]/g, '')) || 0;
        const t = Number(String(targetInput.value).replace(/[^0-9.]/g, '')) || 0;
        if (t > a) { toast(T('set.targetTooBig')); return; }
        const c = C.monthCfg(viewYM);
        c.available = a; c.target = t;
        C.save();
        toast(T('set.saved'));
        render();
      }
    }),
    h('div', { class: 'legend' }, h('span', { text: T('set.carry') }))
  ));

  // 固定支出
  const fName = h('input', { type: 'text', placeholder: T('fixed.phName') });
  const fAmt = h('input', { type: 'text', inputmode: 'decimal', placeholder: T('fixed.phAmount') });
  const fFreq = h('select', {},
    h('option', { value: 'daily', text: T('fixed.everyday') }),
    h('option', { value: 'workday', text: T('fixed.workday') }),
    h('option', { value: 'monthday', text: T('fixed.monthday') })
  );
  const fDay = h('input', { type: 'text', inputmode: 'numeric', placeholder: T('fixed.phDay'), style: 'display:none' });
  fFreq.addEventListener('change', function(){ fDay.style.display = fFreq.value === 'monthday' ? '' : 'none'; });

  const listBox = h('div', {});
  const todayDs = todayStr();
  function paintFixed(){
    listBox.textContent = '';
    if (s.fixed.length === 0) {
      listBox.appendChild(h('div', { class: 'muted', text: T('fixed.empty') }));
      return;
    }
    s.fixed.forEach(function(f){
      const freqTxt = f.freq === 'daily' ? T('fixed.everyday')
                    : (f.freq === 'workday' ? T('fixed.workday') : T('fixed.monthdayN', { n: f.day }));
      const skipped = C.isSkipped(todayDs, f.id);
      listBox.appendChild(h('div', { class: 'item' },
        h('div', {},
          h('div', { class: 'nm', text: f.name + '  ' + C.money(f.amount) }),
          h('div', { class: 'tag', text: freqTxt })
        ),
        h('div', { class: 'row' },
          h('button', {
            class: 'x', text: skipped ? T('fixed.unskip') : T('fixed.skip'),
            onclick: function(){ C.toggleSkip(todayDs, f.id); paintFixed(); render(); }
          }),
          h('button', {
            class: 'x', text: T('fixed.del'),
            onclick: function(){
              if (!confirm(T('fixed.confirmDel', { n: f.name }))) return;
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
    h('h2', { text: T('fixed.title') }),
    listBox,
    h('hr', { class: 'sep' }),
    h('div', { class: 'field' }, h('label', { text: T('fixed.name') }), fName),
    h('div', { class: 'row2 field' }, h('div', {}, h('label', { text: T('fixed.amount') }), fAmt), h('div', {}, h('label', { text: T('fixed.freq') }), fFreq)),
    h('div', { class: 'field' }, fDay),
    h('button', {
      class: 'btn ghost', text: T('fixed.add'),
      onclick: function(){
        const name = (fName.value || '').trim();
        const amt = Number(String(fAmt.value).replace(/[^0-9.]/g, ''));
        if (!name || !isFinite(amt) || amt <= 0) { toast(T('fixed.needBoth')); return; }
        const f = { id: C.uid(), name: name, amount: amt, freq: fFreq.value, day: Number(fDay.value) || 1, active: true };
        s.fixed.push(f);
        C.save();
        fName.value = ''; fAmt.value = ''; fDay.value = '';
        paintFixed(); render();
        toast(T('fixed.added'));
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
        if (!next || next.version !== 1) throw new Error(T('data.notBackup'));
        if (!confirm(T('data.confirmImport'))) return;
        C.replaceState(next);
        viewYM = C.ymOf(new Date());
        render();
        toast(T('data.restored'));
      } catch (e) { alert(T('data.importFail', { m: e.message })); }
    };
    reader.readAsText(file);
  });

  frag.appendChild(h('div', { class: 'card' },
    h('h2', { text: T('data.title') }),
    h('button', {
      class: 'btn ghost', text: T('data.exportJson'),
      onclick: function(){
        download(fname('backup', C.ymOf(new Date())), JSON.stringify(C.st(), null, 2), 'application/json');
        toast(T('data.exported'));
      }
    }),
    h('div', { style: 'height:8px' }),
    h('button', {
      class: 'btn ghost', text: T('data.exportCsv'),
      onclick: function(){ download(fname('detail', viewYM), C.entriesCSV(viewYM, csvLabels()), 'text/csv;charset=utf-8'); toast(T('data.exported')); }
    }),
    h('div', { style: 'height:8px' }),
    h('button', {
      class: 'btn ghost', text: T('data.exportSum'),
      onclick: function(){ download(fname('summary', viewYM), C.summaryCSV(viewYM, csvLabels()), 'text/csv;charset=utf-8'); toast(T('data.exported')); }
    }),
    h('div', { style: 'height:8px' }),
    h('button', { class: 'btn ghost', text: T('data.import'), onclick: function(){ importInput.click(); } }),
    importInput,
    h('div', { class: 'legend' },
      h('span', { text: T('data.privacy') }),
      h('span', { text: T('data.weekly') }))
  ));

  frag.appendChild(h('div', { class: 'card' },
    h('h2', { text: T('algo.title') }),
    h('div', { class: 'small muted', style: 'line-height:1.7' },
      h('div', { text: T('algo.c1') }),
      h('div', { text: T('algo.c2') }),
      h('div', { text: T('algo.c3') }),
      h('div', { text: T('algo.c4') }),
      h('div', { text: T('algo.c5') })
    )
  ));
  return frag;
}

// ---------- 启动 ----------
function render(){
  const root = document.getElementById('app');
  root.textContent = '';
  document.title = T('app.title');
  document.documentElement.lang = getLang() === 'zh' ? 'zh-CN' : 'en';
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
    h('h1', { text: T('err.title') }),
    h('div', { class: 'small red', style: 'white-space:pre-wrap;margin-top:8px', text: String(ev.message || ev.reason) })
  ));
});

// ---------- 离线支持 ----------
// 局域网 http 下浏览器不允许注册 Service Worker；托管到 https 后自动生效，
// 装到主屏幕就能断网打开。
if ('serviceWorker' in navigator) {
  const sec = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (sec) {
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').catch(function(){});
    });
  }
}
render();

// ---------- 冷静期 ----------
function viewCooling(){
  const frag = document.createDocumentFragment();
  const cs = C.coolingStats(viewYM);
  const pend = C.pendingCooling();

  frag.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' },
    h('div', {},
      h('div', { class: 'muted', text: T('cool.savedLabel') }),
      h('div', { class: 'mid mono green', text: C.money(cs.saved) }),
      h('div', { class: 'muted small', text: T('cool.pieces', { n: cs.savedCount }) })),
    h('div', { style: 'text-align:right' },
      h('div', { class: 'muted', text: T('cool.boughtLabel') }),
      h('div', { class: 'mid mono amber', text: C.money(cs.bought) }),
      h('div', { class: 'muted small', text: T('cool.pieces', { n: cs.boughtCount }) })))
  ));

  const nameIn = h('input', { type: 'text', placeholder: T('cool.name') });
  const amtIn = h('input', { type: 'text', inputmode: 'decimal', placeholder: T('cool.amount') });
  let days = 3;
  const pills = h('div', { class: 'verdict' });
  function paintPills(){
    pills.textContent = '';
    [1, 3, 7].forEach(function(n){
      pills.appendChild(h('button', {
        class: days === n ? 'on good' : '',
        text: T('cool.dayN', { n: n }),
        onclick: function(){ days = n; paintPills(); }
      }));
    });
  }
  paintPills();

  frag.appendChild(h('div', { class: 'card' },
    h('h2', { text: T('cool.newTitle') }),
    h('div', { class: 'field' }, h('label', { text: T('cool.name') }), nameIn),
    h('div', { class: 'field' }, h('label', { text: T('cool.amount') }), amtIn),
    h('div', { class: 'field' }, h('label', { text: T('cool.daysLabel') }), pills),
    h('button', {
      class: 'btn', text: T('cool.add'),
      onclick: function(){
        const name = (nameIn.value || '').trim();
        const amt = Number(String(amtIn.value).replace(/[^0-9.]/g, ''));
        if (!name) { toast(T('cool.needName')); return; }
        if (!isFinite(amt) || amt <= 0) { toast(T('cool.badAmount')); return; }
        C.addCooling({ name: name, amount: amt, days: days });
        toast(T('cool.added', { n: days }));
        render();
      }
    })
  ));

  const pendCard = h('div', { class: 'card' }, h('h2', { text: T('cool.pending', { n: pend.length }) }));
  if (pend.length === 0) {
    pendCard.appendChild(h('div', { class: 'muted', text: T('cool.empty') }));
  }
  pend.forEach(function(it){
    const due = C.isDue(it);
    const left = C.daysLeft(it);
    pendCard.appendChild(h('div', { class: 'item' },
      h('div', {},
        h('div', { class: 'nm', text: it.name + '  ' + C.money(it.amount) }),
        h('div', { class: 'tag' + (due ? ' amber' : ''), text: due ? T('cool.due') : T('cool.left', { n: left }) })),
      h('div', { class: 'row' },
        h('button', {
          class: 'x green', text: T('cool.notNow'),
          onclick: function(){
            C.decideCooling(it.id, 'saved');
            toast(T('cool.savedToast', { v: C.money(it.amount) }));
            render();
          }
        }),
        due ? h('button', {
          class: 'x amber', text: T('cool.buyAnyway'),
          onclick: function(){
            if (!confirm(T('cool.confirmBuy'))) return;
            C.decideCooling(it.id, 'bought');
            toast(T('cool.recorded'));
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
    const dc = h('div', { class: 'card' }, h('h2', { text: T('cool.done') }));
    done.forEach(function(it){
      dc.appendChild(h('div', { class: 'item' },
        h('div', {},
          h('div', { class: 'nm', text: it.name + '  ' + C.money(it.amount) }),
          h('div', { class: 'tag', text: it.decidedAt ? it.decidedAt.slice(0, 10) : '' })),
        h('span', {
          class: (it.status === 'saved' ? 'green' : 'amber') + ' small',
          text: it.status === 'saved' ? T('cool.statusSaved') : T('cool.statusBought')
        })
      ));
    });
    frag.appendChild(dc);
  }

  frag.appendChild(h('div', { class: 'card small muted', style: 'line-height:1.8' },
    h('div', { text: T('cool.rule1') }),
    h('div', { text: T('cool.rule2') })));

  return frag;
}
