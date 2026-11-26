'use strict';
(() => {
  const KEY = 'budgetwise.v1'; // budgets saved before accounts (device only)
  const userKey = () => 'budgetwise.u.' + Cloud.user.id;
  const RATE_API = 'https://open.er-api.com/v6/latest/';
  const RATE_MAX_AGE = 6 * 3600e3;

  // [code, country, symbol, decimals shown]
  const CURRENCIES = [
    ['AUD', 'Australia', 'A$', 2], ['PHP', 'Philippines', '₱', 0], ['NZD', 'New Zealand', 'NZ$', 2],
    ['CAD', 'Canada', 'C$', 2], ['GBP', 'United Kingdom', '£', 2], ['USD', 'United States', 'US$', 2],
    ['AED', 'UAE', 'AED ', 2], ['SAR', 'Saudi Arabia', 'SAR ', 2], ['QAR', 'Qatar', 'QAR ', 2],
    ['SGD', 'Singapore', 'S$', 2], ['HKD', 'Hong Kong', 'HK$', 2], ['JPY', 'Japan', '¥', 0],
    ['KRW', 'South Korea', '₩', 0], ['TWD', 'Taiwan', 'NT$', 0], ['EUR', 'Europe (Euro)', '€', 2],
    ['INR', 'India', '₹', 0], ['NPR', 'Nepal', 'Rs ', 0], ['LKR', 'Sri Lanka', 'Rs ', 0],
    ['PKR', 'Pakistan', 'Rs ', 0], ['BDT', 'Bangladesh', '৳', 0], ['VND', 'Vietnam', '₫', 0],
    ['IDR', 'Indonesia', 'Rp ', 0], ['THB', 'Thailand', '฿', 0], ['MYR', 'Malaysia', 'RM ', 2],
    ['CNY', 'China', 'CN¥', 2], ['FJD', 'Fiji', 'FJ$', 2], ['WST', 'Samoa', 'WS$', 2],
    ['TOP', 'Tonga', 'T$', 2], ['PGK', 'Papua New Guinea', 'K ', 2], ['ZAR', 'South Africa', 'R ', 2],
    ['NGN', 'Nigeria', '₦', 0], ['KES', 'Kenya', 'KSh ', 0], ['BRL', 'Brazil', 'R$', 2], ['MXN', 'Mexico', 'MX$', 2]
  ];
  const CUR = Object.fromEntries(CURRENCIES.map(([code, country, sym, dec]) => [code, { code, country, sym, dec }]));
  const REPEATS = [['once', 'Once'], ['week', 'Weekly'], ['fortnight', 'Fortnightly'], ['month', 'Monthly'], ['quarter', 'Every 3 months'], ['year', 'Yearly'], ['every', 'Every … months']];
  const REP = Object.fromEntries(REPEATS);
  const FREQS = [['week', 'Weekly', 'Every 7 days'], ['fortnight', 'Fortnightly', 'Every 14 days'], ['month', 'Monthly', 'Same date'], ['custom', 'Custom', 'e.g. 3rd Friday']];
  const FREQ_LABEL = { week: 'week', fortnight: 'fortnight', month: 'month', custom: 'payday' };
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const NTH = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: 'Last' };
  const UNIT = { week: 7, fortnight: 14, month: 30.44, quarter: 91.31, year: 365.25 };

  const ICON = {
    pen: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chevL: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    chevR: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    logo: '<svg width="26" height="26" viewBox="22 16 148 148" aria-hidden="true"><g fill="#fff"><circle cx="93" cy="38" r="13"/><path d="M66 76 L80 50 L96 72 Z"/><ellipse cx="92" cy="110" rx="56" ry="44"/><rect x="138" y="98" width="22" height="26" rx="8"/><circle cx="36" cy="104" r="7"/><rect x="58" y="138" width="16" height="24" rx="5"/><rect x="106" y="138" width="16" height="24" rx="5"/></g><g fill="#1747B5"><rect x="91" y="30" width="4" height="16" rx="2"/><rect x="76" y="74" width="34" height="8" rx="4"/><circle cx="124" cy="98" r="7"/></g></svg>',
    refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    budget: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/></svg>',
    history: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    setup: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>'
  };

  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal-root');
  const $toast = document.getElementById('toast');

  let S = blank();
  let meta = { rev: 0, dirty: false, editedAt: 0 }; // rev = cloud time we last matched; dirty = changes not in the cloud yet
  let view = 'auth';
  let authMode = 'in', authMsg = null, authBusy = false;
  let sync = { state: 'idle', at: 0 };
  let pushTimer = 0, pushing = false, editSeq = 0;
  let confirmOut = false;
  let tab = 'other';
  let openMonth = null;
  let draft = null;
  let payDraft = null;
  let dlg = null;
  let saveDraft = null; // amount typed in Overview › To savings, not saved yet
  let openSubs = new Set(); // costs whose breakdown is open in the list
  let viewMonth = null;  // month shown on the Budget screen ('YYYY-MM'); null = this month
  let confirmReset = false;
  let confirmRp = null; // restore point waiting for a second tap
  let rateBusy = false;
  let undo = null;
  let toastTimer = 0;

  // ---------- storage ----------
  function blank() { return { v: 1, profile: null, items: [], rate: null, history: {}, pay: {}, sent: {}, savings: {}, seen: null, nextId: 1, points: [], bnpl: [] }; }
  const tidy = s => s && s.v === 1 ? Object.assign(blank(), s) : null;
  // This device keeps a copy of the account's budget so it opens fast and works offline.
  function loadLocal() {
    try {
      const c = JSON.parse(localStorage.getItem(userKey()));
      if (c && tidy(c.S)) { meta = Object.assign({ rev: 0, dirty: false, editedAt: 0 }, c.meta); return tidy(c.S); }
    } catch (e) { /* storage blocked or corrupt */ }
    meta = { rev: 0, dirty: false, editedAt: 0 };
    return blank();
  }
  function saveLocal() {
    if (!Cloud.user) return;
    try { localStorage.setItem(userKey(), JSON.stringify({ S, meta })); } catch (e) { /* storage blocked: the cloud still has it */ }
  }
  function readLegacy() {
    try { return tidy(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return null; }
  }
  // A change the person made: keep it here and send it to the account.
  function save() {
    meta.dirty = true; meta.editedAt = Date.now(); editSeq++;
    saveLocal();
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 700);
  }
  async function push() {
    if (!Cloud.user || !meta.dirty) return;
    if (pushing) { clearTimeout(pushTimer); pushTimer = setTimeout(push, 700); return; }
    pushing = true;
    const seq = editSeq;
    setSync('saving');
    try {
      const at = await Cloud.store(S);
      meta.rev = at;
      if (seq === editSeq) meta.dirty = false;
      saveLocal();
      setSync('ok');
      if (meta.dirty) { clearTimeout(pushTimer); pushTimer = setTimeout(push, 700); }
    } catch (e) { syncFailed(e); }
    pushing = false;
  }
  // Pick up changes made on another phone or computer.
  async function pull() {
    if (!Cloud.user) return;
    try {
      const row = await Cloud.load();
      if (!row) {
        let moved = false;
        if (!S.profile) { const old = readLegacy(); if (old && old.profile) { S = old; moved = true; } }
        if (S.profile) {
          meta.dirty = true; meta.editedAt = Date.now(); editSeq++;
          await push();
          if (moved && !meta.dirty) {
            try { localStorage.setItem(KEY + '.moved', localStorage.getItem(KEY)); localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
            toast('Your budget from this device is now saved in your account');
          }
        } else setSync('ok');
        settle();
        if (sync.state === 'ok') dayPoint();
        return;
      }
      if (row.at > meta.rev && (!meta.dirty || row.at > meta.editedAt)) {
        const d = tidy(row.data);
        if (d) { S = d; meta = { rev: row.at, dirty: false, editedAt: 0 }; saveLocal(); }
        setSync('ok');
        settle();
      } else if (meta.dirty) await push();
      else setSync('ok');
    } catch (e) { syncFailed(e); }
    if (sync.state === 'ok') dayPoint();
  }
  // After the budget changed underneath: open the right page and redraw (not while a pop-up is open).
  function settle() {
    rollover();
    if (view === 'auth') return;
    if (!S.profile) view = 'setup';
    else if (view === 'setup' && document.getElementById('setup-first')) view = 'home';
    if (!draft && !payDraft) render();
  }
  function syncFailed(e) {
    if (!Cloud.user) { toSignIn('Please sign in again.'); return; }
    setSync(e.offline ? 'offline' : 'error');
  }
  function setSync(state) {
    sync = { state, at: state === 'ok' ? Date.now() : sync.at };
    document.querySelectorAll('[data-sync]').forEach(el => { el.textContent = syncText(); el.dataset.sync = sync.state; });
  }
  function syncText() {
    if (sync.state === 'saving') return 'Saving…';
    if (sync.state === 'offline') return meta.dirty ? 'Offline — will save when back online' : 'Offline';
    if (sync.state === 'error') return 'Could not save — will try again';
    if (sync.state === 'ok') return 'Saved to your account · ' + clock(sync.at);
    return 'Connecting…';
  }

  // ---------- helpers ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const monthKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const keyToDate = k => { const [y, m] = k.split('-').map(Number); return new Date(y, m - 1, 1); };
  const monthEnd = d => new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const nextMonthKey = k => { const d = keyToDate(k); return monthKey(new Date(d.getFullYear(), d.getMonth() + 1, 1)); };
  const daysBetween = (a, b) => Math.round((b - a) / 864e5);
  const ord = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
  const shortDate = d => `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
  const inDays = n => n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`;
  const hasNum = v => /\d/.test(String(v == null ? '' : v)); // something typed — 0 counts
  const num = v => { const n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isFinite(n) ? n : 0; };
  const sym = code => (CUR[code] || { sym: code + ' ' }).sym;
  function money(n, code) {
    const c = CUR[code] || { sym: code + ' ', dec: 2 };
    return (n < 0 ? '−' : '') + c.sym + Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: c.dec, maximumFractionDigits: c.dec });
  }
  function clock(ts) {
    const d = new Date(ts), h = d.getHours();
    return `${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
  }
  function since(ts) {
    const n = daysBetween(new Date(new Date(ts).toDateString()), today());
    return n <= 0 ? `today ${clock(ts)}` : n === 1 ? `yesterday ${clock(ts)}` : `${n} days ago`;
  }

  // ---------- dates ----------
  // Months between repeats; 'every' uses the cost's own number (every 2 months, every 6 months…).
  const everyN = it => Math.min(24, Math.max(2, Math.floor(num(it.every)) || 2));
  const unitDays = it => it.rep === 'every' ? 30.44 * everyN(it) : UNIT[it.rep];
  function step(a, rep, k, every) {
    if (rep === 'week') return addDays(a, 7 * k);
    if (rep === 'fortnight') return addDays(a, 14 * k);
    const mm = rep === 'every' ? every : { month: 1, quarter: 3, year: 12 }[rep];
    const t = new Date(a.getFullYear(), a.getMonth() + mm * k, 1);
    return new Date(t.getFullYear(), t.getMonth(), Math.min(a.getDate(), monthEnd(t).getDate()));
  }
  const isDebt = it => it.rep !== 'once' && it.left > 0;
  // Every due date of a cost between from and to (inclusive). Nothing before the month it was added.
  function occurrences(it, from, to) {
    // A cost stopped from a month on ('until' = its last month) has no dates after that month.
    if (it.until) { const e = monthEnd(keyToDate(it.until)); if (to > e) to = e; }
    const a = parse(it.due), out = [];
    const floor = it.created ? keyToDate(it.created.slice(0, 7)) : from;
    const lo = from > floor ? from : floor;
    if (it.rep === 'once') { if (a >= lo && a <= to) out.push(a); return out; }
    const kmax = isDebt(it) ? it.left - 1 : Infinity;
    for (let k = Math.floor(daysBetween(a, lo) / unitDays(it)) - 2; k <= kmax; k++) {
      const d = step(a, it.rep, k, everyN(it));
      if (d > to) break;
      if (d >= lo) out.push(d);
    }
    return out;
  }
  // Counted in a month: optional costs are left out unless switched on for that month;
  // any cost can be left out of one month (it.count['YYYY-MM'] = true/false overrides the default).
  const counted = (it, mk) => it.count && mk in it.count ? !!it.count[mk] : !it.optional;
  // Paid ticks: the due dates already paid (ymd strings).
  const isPaid = (it, d) => !!(it.paid && it.paid.includes(ymd(d)));
  // The month shown on the Budget screen, its first and last day, and the rate to use for it
  // (a finished month keeps the rate saved in History, so its numbers don't move).
  const vm = () => viewMonth || monthKey(today());
  // Each month keeps its own costs: a change made while looking at a month applies to that month and later ones.
  // A cost runs from its 'created' month to its 'until' month (no until = it carries on).
  const startKey = it => (it.created || '0000-00').slice(0, 7);
  const activeIn = (it, mk) => startKey(it) <= mk && (!it.until || it.until >= mk);
  const prevKey = k => { const d = keyToDate(k); return monthKey(new Date(d.getFullYear(), d.getMonth() - 1, 1)); };
  const monName = k => MON_LONG[keyToDate(k).getMonth()];
  const vmFrom = () => keyToDate(vm());
  const vmTo = () => monthEnd(keyToDate(vm()));
  const vmRate = () => { const h = S.history[vm()]; return vm() < monthKey(today()) && h && h.rate ? h.rate : rateValue(); };
  const monthShift = n => { const d = keyToDate(monthKey(today())); return monthKey(new Date(d.getFullYear(), d.getMonth() + n, 1)); };
  const nextDue = it => occurrences(it, today(), addDays(today(), 800))[0] || null;
  function debtState(it) {
    if (!isDebt(it)) return null;
    const a = parse(it.due), t = today();
    let remaining = 0;
    // A payment is still to go if its date hasn't passed and it isn't ticked paid (paying early counts it down).
    for (let k = 0; k < it.left; k++) { const d = step(a, it.rep, k, everyN(it)); if (d >= t && !isPaid(it, d)) remaining++; }
    return { remaining, end: step(a, it.rep, it.left - 1, everyN(it)), toGo: remaining * it.amt };
  }
  function nthWeekday(y, m, nth, wd) {
    if (nth === 5) { const d = new Date(y, m + 1, 0); while (d.getDay() !== wd) d.setDate(d.getDate() - 1); return d; }
    const d = new Date(y, m, 1);
    while (d.getDay() !== wd) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + (nth - 1) * 7);
    return d;
  }
  function paydays(from, to, p = S.profile) {
    const out = [];
    if (p.freq === 'week' || p.freq === 'fortnight') {
      const a = parse(p.last), n = p.freq === 'week' ? 7 : 14;
      for (let k = Math.floor(daysBetween(a, from) / n) - 1; ; k++) {
        const d = addDays(a, n * k);
        if (d > to) break;
        if (d >= from) out.push(d);
      }
      return out;
    }
    for (let m = new Date(from.getFullYear(), from.getMonth(), 1); m <= to; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
      const d = p.freq === 'month'
        ? new Date(m.getFullYear(), m.getMonth(), Math.min(parse(p.last).getDate(), monthEnd(m).getDate()))
        : nthWeekday(m.getFullYear(), m.getMonth(), p.nth, p.wd);
      if (d >= from && d <= to) out.push(d);
    }
    return out;
  }
  function payLabel(p = S.profile) {
    if (p.freq === 'custom') return `${NTH[p.nth]} ${DOW_LONG[p.wd]} of the month`;
    return FREQ_LABEL[p.freq];
  }

  // ---------- money maths ----------
  const pairKey = () => `${S.profile.home}-${S.profile.other}`;
  // Single Entry: one country, one list. The other country's costs stay saved but hidden.
  const single = () => !!(S.profile && S.profile.mode === 'single');
  function rateValue() {
    const p = S.profile;
    if (p.home === p.other || single()) return 1;
    if (!S.rate || S.rate.pair !== pairKey()) return null;
    if (S.rate.manual) return S.rate.value;
    const v = S.rate.value - (p.margin || 0); // e.g. a remittance service's rate: market minus their margin
    return v > 0 ? v : null;
  }
  function toHome(amount, cur, rate = rateValue()) {
    if (cur === S.profile.home) return amount;
    return rate ? amount / rate : null;
  }
  // Pay for each payday (the usual salary unless changed for that month) plus any extra income added to the month.
  function monthPay(key) { return (S.pay && S.pay[key]) || { pays: {}, extras: [] }; }
  function income(from, to) {
    const base = S.profile.salary, lines = [];
    const days = paydays(from, to);
    let total = 0, changed = false;
    for (const d of days) {
      const o = monthPay(monthKey(d)).pays[ymd(d)];
      const amt = o != null ? o : base;
      if (o != null && o !== base) changed = true;
      total += amt;
      lines.push({ kind: 'pay', date: ymd(d), amt });
    }
    for (let m = new Date(from.getFullYear(), from.getMonth(), 1); m <= to; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
      for (const x of monthPay(monthKey(m)).extras) { total += x.amt; lines.push({ kind: 'extra', name: x.name, amt: x.amt }); }
    }
    return { pays: days.length, total, lines, changed, extra: lines.filter(l => l.kind === 'extra').reduce((a, l) => a + l.amt, 0) };
  }
  function summary(from, to, rate = rateValue()) {
    const inc = income(from, to), pays = inc.pays, income_ = inc.total;
    const t = { other: 0, home: 0 }, due = { other: 0, home: 0 }, lines = [];
    let missing = false;
    const one = single();
    for (const it of S.items) {
      if (one && it.list === 'other') continue;
      const occ = occurrences(it, from, to).filter(d => counted(it, monthKey(d))), n = occ.length;
      if (!n) continue;
      const v = toHome(it.amt, it.cur, rate);
      if (v == null) { missing = true; continue; }
      t[it.list] += n * v;
      due[it.list] += occ.filter(d => !isPaid(it, d)).length * v;
      lines.push({ list: it.list, name: it.name, n, amt: n * v });
    }
    return { left: due.other + due.home, leftOther: due.other, leftHome: due.home, pays, income: income_, payLines: inc.lines, payChanged: inc.changed, extra: inc.extra, other: t.other, home: t.home, costs: t.other + t.home, saved: income_ - t.other - t.home, missing, lines };
  }

  // A finished month is kept in History the first time the app opens in a later month.
  function rollover() {
    if (!S.profile) return;
    const cur = monthKey(today());
    if (!S.seen) { S.seen = cur; saveLocal(); return; }
    let changed = false;
    for (let k = S.seen; k < cur; k = nextMonthKey(k)) {
      if (S.history[k]) continue;
      const f = keyToDate(k), s = summary(f, monthEnd(f));
      S.history[k] = {
        pays: s.pays, income: s.income, salary: S.profile.salary, payLines: s.payLines, other: s.other, home: s.home, saved: s.saved,
        rate: rateValue(), homeCur: S.profile.home, otherCur: single() ? S.profile.home : S.profile.other, single: single() || undefined, lines: s.lines,
        sent: ((S.sent || {})[k] || {}).amt || 0, moved: ((S.savings || {})[k] || {}).amt || 0
      };
      changed = true;
    }
    if (S.seen !== cur) { S.seen = cur; changed = true; }
    if (changed) saveLocal();
  }

  // ---------- exchange rate ----------
  async function refreshRate(force) {
    const p = S.profile;
    if (!p || p.home === p.other || single() || rateBusy) return;
    const fresh = S.rate && S.rate.pair === pairKey() && Date.now() - S.rate.at < RATE_MAX_AGE;
    if (!force && (fresh || (S.rate && S.rate.manual && S.rate.pair === pairKey()))) return;
    rateBusy = true;
    if (view === 'home') render();
    try {
      const r = await fetch(RATE_API + encodeURIComponent(p.home), { cache: 'no-store' });
      const j = await r.json();
      const value = j && j.rates && j.rates[p.other];
      if (!value) throw new Error('no rate');
      S.rate = { pair: pairKey(), value, at: Date.now(), manual: false };
      saveLocal();
      if (force) toast(`Rate updated: ${sym(p.home)}1 = ${sym(p.other)}${rateValue().toFixed(2)}`);
    } catch (e) {
      if (force) toast(rateValue() ? 'Offline — using the saved rate' : 'Could not get a rate. Check your internet, or set your own rate in Setup.');
    }
    rateBusy = false;
    render();
  }

  // ---------- toast ----------
  function toast(msg, action) {
    clearTimeout(toastTimer);
    $toast.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" data-act="toast">${esc(action.label)}</button>` : ''}`;
    $toast.hidden = false;
    $toast.onclick = e => { if (e.target.closest('[data-act="toast"]') && action) { action.run(); $toast.hidden = true; } };
    toastTimer = setTimeout(() => { $toast.hidden = true; }, action ? 6000 : 3000);
  }

  // ---------- views ----------
  function render() {
    if (!Cloud.user) view = 'auth';
    else if (view !== 'auth' && !S.profile) view = 'setup';
    $app.innerHTML = view === 'auth' ? authHtml() : view === 'setup' ? setupHtml() : view === 'history' ? historyHtml() : homeHtml();
    if (view === 'setup') syncSetup();
  }

  function navHtml() {
    const b = (v, label) => `<button type="button" data-act="nav" data-view="${v}"${view === v ? ' aria-current="page"' : ''}>${ICON[v === 'home' ? 'budget' : v]}${label}</button>`;
    return `<nav class="nav" aria-label="Main"><div class="nav-brand"><span class="logo" aria-hidden="true">${ICON.logo}</span><span>Piso<span class="wm-a">Wise</span></span></div><div class="nav-in">${b('home', 'Budget')}${b('history', 'History')}${b('setup', 'Setup')}</div><p class="nav-foot"><span class="sync-dot" data-sync="${sync.state}">${esc(syncText())}</span></p></nav>`;
  }

  function rateBtnHtml() {
    const p = S.profile;
    if (p.home === p.other || single()) return '';
    const v = rateValue();
    const main = v ? `${sym(p.home)}1 = ${sym(p.other)}${v.toFixed(2)}` : 'No rate yet';
    const sub = rateBusy ? 'checking…' : !v ? 'tap to get it' : S.rate.manual ? 'your own rate' : (p.margin ? `market −${p.margin} · ` : '') + since(S.rate.at);
    return `<button type="button" class="rate-btn${rateBusy ? ' busy' : ''}" data-act="rate" aria-label="Exchange rate ${esc(main)}, ${esc(sub)}. Tap to check now."><span><b>${esc(main)}</b><small>${esc(sub)}</small></span>${ICON.refresh}</button>`;
  }

  function dueDesc(it) {
    const a = parse(it.due);
    if (it.rep === 'once') return 'Once · ' + shortDate(a);
    if (it.rep === 'week' || it.rep === 'fortnight') return `${REP[it.rep]} · ${DOW[a.getDay()]}`;
    if (it.rep === 'month') return 'Monthly · ' + ord(a.getDate());
    if (it.rep === 'every') return `Every ${everyN(it)} months · ${a.getDate()} ${MON[a.getMonth()]}`;
    return `${REP[it.rep]} · ${a.getDate()} ${MON[a.getMonth()]}`;
  }

  function homeHtml() {
    const p = S.profile, t = today(), mk = vm(), isNow = mk === monthKey(t), from = vmFrom(), to = vmTo(), mon = from.getMonth();
    const rate = vmRate(), s = summary(from, to, rate);
    const np = paydays(addDays(t, 1), addDays(t, 400))[0];
    const otherName = CUR[p.other].country;
    const one = single();
    const twoCur = p.home !== p.other && !one;
    if (one && tab === 'other') tab = 'home';
    const homeName = one ? 'Costs' : 'Local';
    const sent = one ? null : (S.sent || {})[mk], moved = (S.savings || {})[mk];
    const pct = n => s.income > 0 ? Math.max(0, Math.min(100, n / s.income * 100)).toFixed(1) + '%' : '0%';
    const left = s.saved;
    const count = key => s.lines.filter(l => l.list === key).length;
    const toPayText = (tot, due) => tot <= 0 ? 'nothing due' : due < 0.005 ? 'all paid' : due < tot - 0.005 ? money(due, p.home) + ' to pay' : 'none paid yet';
    const otherBig = v => twoCur && rate ? money(v * rate, p.other) : money(v, p.home);

    const tabs = [
      ['other', otherName, otherBig(s.other), 'dot-other'],
      ['home', homeName, money(s.home, p.home), 'dot-home'],
      ['over', 'Overview', money(left, p.home), 'dot-over']
    ].filter(x => !one || x[0] !== 'other').map(([k, label, sub, dot]) => `<button type="button" role="tab" class="tab" id="tab-${k}" aria-controls="panel" aria-selected="${tab === k}" data-act="tab" data-tab="${k}"><span class="tab-l"><span class="dot ${dot}"></span><span>${esc(label)}</span></span><small>${esc(sub)}</small></button>`).join('');

    // Total at the top of a list. The overseas list shows its own currency first, home currency under it.
    const listHead = key => {
      const tot = key === 'other' ? s.other : s.home, due = key === 'other' ? s.leftOther : s.leftHome, n = count(key);
      const big = key === 'other' ? otherBig(tot) : money(tot, p.home);
      const nOff = S.items.filter(it => it.list === key && !counted(it, mk) && occurrences(it, from, to).length).length;
      const sub = (key === 'other' && twoCur && rate ? money(tot, p.home) + ' · ' : '') + `${n} cost${n === 1 ? '' : 's'} · ${toPayText(tot, due)}${nOff ? ` · ${nOff} not counted` : ''}`;
      const sentNote = key === 'other' && sent ? `<div class="sent-note"><span>Sent <b>${money(sent.amt, p.home)}</b>${twoCur && sent.rate ? ` (≈ ${money(sent.amt * sent.rate, p.other)})` : ''} on ${esc(shortDate(parse(sent.date)))}</span><button type="button" class="link" data-act="sent">Change</button></div>` : '';
      const nHidden = one && key === 'home' ? S.items.filter(it => it.list === 'other').length : 0;
      const hiddenNote = nHidden ? `<div class="sent-note"><span>${nHidden} ${esc(otherName)} cost${nHidden === 1 ? ' is' : 's are'} saved but hidden — Single Entry.</span><button type="button" class="link" data-act="nav" data-view="setup">Setup</button></div>` : '';
      return `<div class="sum"><div class="sum-t"><b class="sum-big">${big}</b><small>${esc(sub)}</small></div>${key === 'other' ? `<button type="button" class="btn sum-btn" data-act="sent">Money sent</button>` : ''}</div>${sentNote}${hiddenNote}`;
    };

    const overview = () => {
      const lo = Math.max(left, 0);
      const sv = moved ? Math.min(moved.amt, lo) : Math.min(Math.max(num(saveDraft || '0'), 0), lo);
      const base = Math.max(s.income, s.costs);
      const inOther = v => twoCur && rate ? '≈ ' + money(v * rate, p.other) : ''; // spare in pesos
      if (base <= 0) return `<div class="empty"><b>Nothing to show yet</b><span>Add your pay and costs to see where your money goes.</span></div>`;
      const segs = [
        one ? null : { n: otherName, v: s.other, c: 'var(--other)', sub: (twoCur && rate ? money(s.other * rate, p.other) + ' · ' : '') + `${count('other')} costs` },
        { n: homeName, v: s.home, c: 'var(--home-bar)', sub: `${count('home')} costs` },
        { n: 'Savings', v: sv, c: 'var(--save)', sub: moved ? `moved ${shortDate(parse(moved.date))} ✓` : sv > 0 ? 'planned' : 'nothing yet' },
        { n: 'Spare', v: lo - sv, c: 'var(--spare)', sub: (inOther(lo - sv) ? inOther(lo - sv) + ' · ' : '') + 'for anything else this month' }
      ].filter(Boolean);
      const pd = segs.map(x => `<div class="pd"><i style="background:${x.c}"></i><span class="pd-n">${esc(x.n)}<small>${esc(x.sub)}</small></span><span class="pd-a">${money(x.v, p.home)}<small>${Math.round(x.v / base * 100)}%</small></span></div>`).join('');
      const formula = one ? `<p class="lo-f">Pay ${money(s.income, p.home)} − Costs ${money(s.home, p.home)} = <b>${money(left, p.home)}</b></p>`
        : `<p class="lo-f">Pay ${money(s.income, p.home)} − Local ${money(s.home, p.home)} − ${esc(otherName)} ${money(s.other, p.home)} = <b>${money(left, p.home)}</b></p>`;
      let plan;
      if (left <= 0) plan = `<div><h3>Over budget</h3>${formula}<p class="sub">Your costs this month are ${money(-left, p.home)} more than your pay.</p></div>`;
      else if (moved) plan = `<div><h3>Leftover this month</h3>${formula}</div>
        <div class="split" aria-hidden="true"><span style="width:${(sv / lo * 100).toFixed(1)}%;background:var(--save)"></span><span style="width:${((lo - sv) / lo * 100).toFixed(1)}%;background:var(--spare)"></span></div>
        <div class="done-box"><span>Moved to savings on ${esc(shortDate(parse(moved.date)))} ✓</span><b>${money(moved.amt, p.home)}</b><span>Spare for the month: ${money(lo - sv, p.home)}${inOther(lo - sv) ? ` (${inOther(lo - sv)})` : ''}</span><button type="button" class="link" data-act="unsave">Change</button></div>`;
      else plan = `<div><h3>Leftover this month</h3>${formula}</div>
        <div class="split" aria-hidden="true"><span style="width:${(sv / lo * 100).toFixed(1)}%;background:var(--save)"></span><span style="width:${((lo - sv) / lo * 100).toFixed(1)}%;background:var(--spare)"></span></div>
        <div class="pots">
          <label class="pot"><span><i style="background:var(--save)"></i>To savings</span><span class="prefix"><span>${esc(sym(p.home).trim())}</span><input class="num" id="save-amt" data-save inputmode="decimal" placeholder="0.00" value="${esc(saveDraft || '')}" aria-label="Amount to move to savings"></span></label>
          <div class="pot"><span><i style="background:var(--spare)"></i>Spare</span><b id="spare-amt">${money(lo - sv, p.home)}</b>${inOther(lo - sv) ? `<small class="pot-sub" id="spare-other">${inOther(lo - sv)}</small>` : ''}</div>
        </div>
        <div class="chips"><button type="button" class="chip" data-act="saveq" data-q="0">None</button><button type="button" class="chip" data-act="saveq" data-q="0.5">Half</button><button type="button" class="chip" data-act="saveq" data-q="1">All</button></div>
        <button type="button" class="btn" data-act="save-open"${sv > 0 ? '' : ' disabled'}>I moved ${money(sv, p.home)} to savings</button>`;
      return `<div class="ov"><div class="ov-pie"><h3>Where your pay goes</h3>${pieSvg(segs, base, s.income > 0 ? 'Pay' : 'Costs', money(Math.round(s.income > 0 ? s.income : s.costs), p.home).replace(/\.00$/, ''))}<div class="pd-list">${pd}</div></div>${plan}</div>`;
    };

    // One list's rows: the phone shows one at a time under the tabs, tablet and desktop show them side by side.
    const body = key => {
      if (key === 'over') return overview();
      const list = S.items.filter(it => it.list === key && (isNow ? activeIn(it, mk) : occurrences(it, from, to).length)).map(it => ({ it, nd: isNow ? nextDue(it) : occurrences(it, from, to).find(d => !isPaid(it, d)) || null }))
        .map(x => Object.assign(x, { off: !counted(x.it, mk) && occurrences(x.it, from, to).length > 0 }))
        .sort((a, b) => (a.off - b.off) || ((a.nd ? a.nd.getTime() : 9e15) - (b.nd ? b.nd.getTime() : 9e15)));
      const offList = list.filter(x => x.off);
      const rowHtml = ({ it, nd, off }) => {
        const occ = occurrences(it, from, to), n = occ.length, dd = nd ? daysBetween(t, nd) : null, ds = debtState(it);
        const subsN = it.subs && it.subs.length ? it.subs.length : 0, subsOpen = subsN && openSubs.has(it.id);
        const subsBtn = subsN ? `<button type="button" class="exp${subsOpen ? ' on' : ''}" data-act="subs" data-id="${it.id}" aria-expanded="${!!subsOpen}" aria-label="${subsOpen ? 'Hide' : 'Show'} what's in ${esc(it.name)}">${ICON.chev}</button>` : '';
        const subsList = subsOpen && it.bnpl ? apSubsHtml(it) : subsOpen ? `<div class="subs">${it.subs.map(x => `<div class="subl"><span>${esc(x.name)}</span><span>${money(x.amt, it.cur)}</span></div>`).join('')}<div class="subl t"><span>Total</span><span>${money(it.amt, it.cur)}</span></div></div>` : '';
        const sw = n ? `<button type="button" class="sw${off ? '' : ' on'}" data-act="count" data-id="${it.id}" role="switch" aria-checked="${!off}" aria-label="Count ${esc(it.name)} in ${esc(MON_LONG[mon])}" title="${off ? 'Not counted in ' : 'Counted in '}${esc(MON_LONG[mon])}"><i></i></button>` : '';
        if (off) return `<div class="row-w is-off">${sw}<button type="button" class="row has-tick" data-act="edit" data-id="${it.id}">
          <span class="row-main"><span class="row-name">${esc(it.name)}</span><span class="row-sub">${esc(dueDesc(it))}</span>${it.optional ? '<span class="tag-opt">Optional</span>' : ''}</span>
          <span class="row-amt"><b>${money(it.amt * n, it.cur)}</b><small class="due">not counted</small></span></button>${subsBtn}<span class="tick none" aria-hidden="true"></span></div>${subsList}`;
        const np = occ.filter(d => isPaid(it, d)).length, allPaid = n > 0 && np === n;
        const ini = `<span class="ini ini-${it.list}" aria-hidden="true">${esc((it.name.trim()[0] || '?').toUpperCase())}</span>`;
        const tick = n ? `<button type="button" class="tick${allPaid ? ' on' : np ? ' part' : ''}" data-act="paid" data-id="${it.id}" aria-pressed="${allPaid}" aria-label="${esc(it.name)}: ${allPaid ? 'paid this month. Tap to undo.' : 'mark as paid'}${n > 1 ? ` (${np} of ${n} paid)` : ''}">${allPaid ? ICON.check : np ? `<small>${np}/${n}</small>` : ICON.check}</button>` : '';
        const status = allPaid ? '<small class="due paid">paid ✓</small>' : np ? `<small class="due paid">${np} of ${n} paid</small>`
          : !isNow ? `<small class="due">${nd ? 'due ' + esc(shortDate(nd)) : ''}</small>`
          : `<small class="due${dd !== null && dd <= 3 ? ' urgent' : ''}">${nd ? 'due ' + inDays(dd) : ds ? 'paid off' : 'done'}</small>`;
        const conv = it.cur !== p.home ? (rate ? `<small>≈ ${money(it.amt / rate, p.home)}</small>` : '<small>needs a rate</small>') : '';
        const debtTag = ds ? `<span class="tag-debt">${ds.remaining ? `${ds.remaining} left · ends ${MON[ds.end.getMonth()]} ${ds.end.getFullYear()}` : 'Paid off'}</span>` : '';
        return `<div class="row-w${allPaid ? ' is-paid' : ''}">${sw}<button type="button" class="row${nd || n ? '' : ' done'}${sw ? ' has-tick' : ''}" data-act="edit" data-id="${it.id}">
          ${sw ? '' : ini}
          <span class="row-main"><span class="row-name">${esc(it.name)}</span><span class="row-sub">${esc(dueDesc(it))}${n > 1 ? ` · ${n}× this month` : ''}${subsN ? ` · ${subsN} item${subsN === 1 ? '' : 's'}` : ''}</span>${debtTag}${it.optional ? '<span class="tag-opt">Optional</span>' : ''}</span>
          <span class="row-amt"><b>${money(it.amt, it.cur)}</b>${conv}${status}</span>
        </button>${subsBtn}${tick}</div>${subsList}`;
      };
      const offTotal = offList.reduce((a, { it }) => a + (toHome(it.amt, it.cur, rate) || 0) * occurrences(it, from, to).length, 0);
      const rows = list.filter(x => !x.off).map(rowHtml).join('')
        + (offList.length ? `<div class="grp-off">Not counted in ${esc(MON_LONG[mon])} · ${money(offTotal, p.home)}</div>` + offList.map(rowHtml).join('') : '');
      const empty = `<div class="empty"><b>No ${key === 'other' ? esc(otherName) + ' ' : one ? '' : 'local '}costs yet</b><span>${key === 'other' ? 'Money you send or pay in ' + esc(otherName) + ' — family allowance, loans, bills.' : 'Rent, groceries, phone, transport, bills.'}</span></div>`;
      return listHead(key) + (key === 'home' ? apCardHtml() : '') + (rows || empty) + `<button type="button" class="add-btn" data-act="add" data-list="${key}">${ICON.plus}Add a cost</button>`;
    };
    const cols = [['other', otherName, 'dot-other'], ['home', homeName, 'dot-home'], ['over', 'Overview', 'dot-over']]
      .filter(x => !one || x[0] !== 'other').map(([k, label, dot]) => `<section class="col col-${k}" aria-label="${esc(label)}"><header class="col-h"><span class="dot ${dot}"></span><h2>${esc(label)}</h2></header><div class="col-b">${body(k)}</div></section>`).join('');

    const tileSub = (tot, due, extra) => extra || toPayText(tot, due);
    return `<div class="wrap${one ? ' one' : ''}">
      <header class="top">
        <div class="logo" aria-hidden="true">${ICON.logo}</div>
        <div class="top-name"><span class="eyebrow">PisoWise</span><span class="hello">Hi, ${esc(p.name)}</span></div>
        ${rateBtnHtml()}
      </header>
      <div class="msw">
        <button type="button" class="x-btn" data-act="mon" data-d="-1" aria-label="Previous month"${mk <= monthShift(-12) ? ' disabled' : ''}>${ICON.chevL}</button>
        <span class="msw-m"><b>${MON_LONG[mon]} ${from.getFullYear()}</b>${isNow ? '' : '<button type="button" class="link" data-act="mon-now">Back to this month</button>'}</span>
        <button type="button" class="x-btn" data-act="mon" data-d="1" aria-label="Next month"${mk >= monthShift(12) ? ' disabled' : ''}>${ICON.chevR}</button>
      </div>
      ${apBellHtml()}
      <section class="hero" aria-label="${esc(MON_LONG[mon])}">
        <div class="hero-top">
          <div><div class="hero-label">${left >= 0 ? 'Leftover' : 'Over budget'} · ${MON_LONG[mon]}</div><div class="hero-amt${left < 0 ? ' neg' : ''}">${money(Math.abs(left), p.home)}</div></div>
          ${isNow ? `<span class="badge">${np ? `Next pay ${np.getDate()} ${MON[np.getMonth()]}` : 'no payday'}</span>` : ''}
        </div>
        <div class="bar" aria-hidden="true"><span style="width:${pct(s.other)};background:var(--other-bar)"></span><span style="width:${pct(s.home)};background:var(--home-bar)"></span>${moved ? `<span style="width:${pct(moved.amt)};background:var(--save-bar)"></span>` : ''}</div>
        <div class="hero-grid">
          <button type="button" class="pay-btn" data-act="pay" aria-label="Income ${esc(money(s.income, p.home))}. Change this month's pay."><small>Income ${ICON.pen}</small><b>${money(s.income, p.home)}</b><small class="${s.extra || s.payChanged ? 'accent' : ''}">${s.extra ? '+' + money(s.extra, p.home) + ' extra' : s.payChanged ? 'pay changed' : `${s.pays} payday${s.pays === 1 ? '' : 's'}`}</small></button>
          <div><small>${homeName}</small><b>${money(s.home, p.home)}</b><small${s.home > 0 && s.leftHome < 0.005 ? ' class="accent"' : ''}>${tileSub(s.home, s.leftHome)}</small></div>
          ${one ? '' : `<div><small>${esc(otherName)}</small><b>${money(s.other, p.home)}</b><small${sent || (s.other > 0 && s.leftOther < 0.005) ? ' class="accent"' : ''}>${tileSub(s.other, s.leftOther, sent ? 'sent ✓' : '')}</small></div>`}
        </div>
        ${s.missing ? `<div class="hero-note">Some ${esc(otherName)} costs aren't counted yet — no exchange rate. Tap the rate button or set one in Setup.</div>` : ''}
      </section>
      <div class="tabs" role="tablist" aria-label="Budget lists">${tabs}</div>
      <div class="panel" id="panel" role="tabpanel" aria-labelledby="tab-${tab}">${body(tab)}</div>
      <div class="cols">${cols}</div>
    </div>${navHtml()}`;
  }

  // Ring chart: each slice's share of base. Slice colours come from the theme.
  function pieSvg(segs, base, label, value) {
    const R = 52, C = 2 * Math.PI * R;
    let off = 0;
    const arcs = segs.filter(x => x.v > 0.005).map(x => {
      const len = Math.min(x.v / base, 1) * C;
      const a = `<circle cx="70" cy="70" r="${R}" fill="none" style="stroke:${x.c}" stroke-width="22" stroke-dasharray="${Math.max(len - 1.5, 0.5).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 70 70)"/>`;
      off += len;
      return a;
    }).join('');
    return `<svg class="pie" viewBox="0 0 140 140" width="168" height="168" role="img" aria-label="${esc(label + ' ' + value + ': ' + segs.map(x => x.n + ' ' + Math.round(x.v / base * 100) + '%').join(', '))}"><circle cx="70" cy="70" r="${R}" fill="none" style="stroke:var(--line2)" stroke-width="22"/>${arcs}<text x="70" y="64" text-anchor="middle" class="pie-l">${esc(label)}</text><text x="70" y="83" text-anchor="middle" class="pie-v">${esc(value)}</text></svg>`;
  }

  // ---------- money sent + savings dialogs ----------
  // dlg: { kind: 'sent', amt: string, tick: bool } or { kind: 'save', amt: number, done: bool }
  function otherOpen(mk) {
    const f = keyToDate(mk), out = [];
    for (const it of S.items) if (it.list === 'other') if (counted(it, mk)) for (const d of occurrences(it, f, monthEnd(f))) if (!isPaid(it, d)) out.push({ it, k: ymd(d) });
    return out;
  }
  function openSent() {
    const mk = vm(), s = summary(vmFrom(), vmTo(), vmRate()), cur = (S.sent || {})[mk];
    dlg = { kind: 'sent', amt: cur ? String(cur.amt) : (s.other > 0 ? (Math.round(s.other * 100) / 100).toFixed(2) : ''), tick: true };
    renderDlg();
  }
  function sentConv() {
    const p = S.profile, rate = vmRate(), s = summary(vmFrom(), vmTo(), rate);
    if (p.home === p.other || !rate) return '';
    const v = num(dlg.amt) * rate, need = s.other * rate, diff = v - need;
    return `≈ <b>${money(v, p.other)}</b> at ${sym(p.other).trim()}${rate.toFixed(2)} · this month's list ${money(need, p.other)}<br>${!(num(dlg.amt) > 0) ? '' : Math.abs(diff) < 1 ? 'Covers the whole list.' : diff > 0 ? money(diff, p.other) + ' more than the list.' : money(-diff, p.other) + ' less than the list.'}`;
  }
  function renderDlg() {
    if (dlg.kind === 'ap-plans') { $modal.innerHTML = apPlansHtml(); return; }
    if (dlg.kind === 'ap-diff') { $modal.innerHTML = apDiffHtml(); return; }
    const p = S.profile, mk = vm(), t = vmFrom(), otherName = CUR[p.other].country;
    if (dlg.kind === 'sent') {
      const open = otherOpen(mk), had = (S.sent || {})[mk];
      $modal.innerHTML = `<div class="overlay" data-act="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
        <div class="dlg-head"><h2 id="dlg-t">Money sent to ${esc(otherName)}</h2><span class="pill pill-other">${MON_LONG[t.getMonth()]}</span></div>
        <label class="fld"><span>Amount sent</span><span class="prefix"><span>${esc(sym(p.home).trim())}</span><input class="num" id="sent-amt" inputmode="decimal" value="${esc(dlg.amt)}" placeholder="0.00"></span>
          <small id="sent-conv">${sentConv()}</small></label>
        ${open.length ? `<label class="chk chk-box"><input type="checkbox" id="sent-tick"${dlg.tick ? ' checked' : ''}><span>Tick all ${open.length} unpaid ${esc(otherName)} cost${open.length === 1 ? '' : 's'} for ${MON_LONG[t.getMonth()]} as paid<small>Local costs are not changed.</small></span></label>`
          : `<p class="sub">Every ${esc(otherName)} cost this month is already ticked.</p>`}
        <p class="err" id="dlg-err" hidden></p>
        <div class="dlg-actions">${had ? '<button type="button" class="btn-ghost" data-act="sent-del">Remove</button>' : ''}<button type="button" class="btn-ghost" data-act="cancel">Cancel</button><button type="button" class="btn" data-act="sent-save">Save</button></div>
      </div></div>`;
    } else {
      $modal.innerHTML = `<div class="overlay" data-act="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
        <div class="dlg-head"><h2 id="dlg-t">Confirm savings</h2></div>
        <p class="sub" style="font-size:15px;color:var(--ink2)">Have you moved <b>${money(dlg.amt, p.home)}</b> to your savings account?</p>
        <label class="chk chk-box"><input type="checkbox" id="save-done"${dlg.done ? ' checked' : ''}><span>Yes, the transfer is done</span></label>
        <div class="dlg-actions"><button type="button" class="btn-ghost" data-act="cancel">Not yet</button><button type="button" class="btn" data-act="save-ok"${dlg.done ? '' : ' disabled'}>Confirm</button></div>
      </div></div>`;
    }
  }
  function closeDlg() { dlg = null; $modal.innerHTML = ''; }
  function saveSent() {
    const amt = Math.round(num(dlg.amt) * 100) / 100, err = document.getElementById('dlg-err');
    if (!hasNum(dlg.amt)) { err.textContent = 'Please enter the amount you sent (0 is fine).'; err.hidden = false; return; }
    const t = today(), mk = vm(), prevSent = (S.sent || {})[mk];
    const ticked = dlg.tick ? otherOpen(mk) : [];
    if (!S.sent) S.sent = {};
    S.sent[mk] = { amt, date: ymd(t), rate: vmRate() || null };
    for (const { it, k } of ticked) it.paid = (it.paid || []).concat(k);
    save(); closeDlg(); render();
    toast(ticked.length ? `Saved · ${ticked.length} cost${ticked.length === 1 ? '' : 's'} ticked` : 'Money sent saved', { label: 'Undo', run: () => {
      if (prevSent) S.sent[mk] = prevSent; else delete S.sent[mk];
      for (const { it, k } of ticked) it.paid = (it.paid || []).filter(x => x !== k);
      save(); render();
    } });
  }
  function saveQuick(q) {
    const s = summary(vmFrom(), vmTo(), vmRate()), lo = Math.max(s.saved, 0);
    saveDraft = q <= 0 ? '' : (Math.floor(lo * q * 100) / 100).toFixed(2);
    render();
  }
  function confirmSave() {
    const t = today(), mk = vm();
    if (!S.savings) S.savings = {};
    S.savings[mk] = { amt: dlg.amt, date: ymd(t) };
    saveDraft = null;
    save(); closeDlg(); render();
    toast('Savings recorded');
  }

  function historyHtml() {
    const p = S.profile, t = today(), cur = monthKey(t);
    const live = summary(new Date(t.getFullYear(), t.getMonth(), 1), monthEnd(t));
    const months = [{ key: cur, live: true, pays: live.pays, income: live.income, salary: p.salary, payLines: live.payLines, other: live.other, home: live.home, saved: live.saved, rate: rateValue(), homeCur: p.home, otherCur: single() ? p.home : p.other, single: single(), lines: live.lines, sent: ((S.sent || {})[cur] || {}).amt || 0, moved: ((S.savings || {})[cur] || {}).amt || 0 }]
      .concat(Object.keys(S.history).filter(k => k < cur).sort().reverse().map(k => Object.assign({ key: k }, S.history[k])));
    const first = months[months.length - 1].key;
    const total = months.reduce((a, m) => a + m.saved, 0);
    if (!openMonth) openMonth = cur;

    const chartMonths = months.slice(0, 6).reverse();
    const max = Math.max(1, ...chartMonths.map(m => Math.abs(m.saved)));
    const bars = chartMonths.map(m => {
      const d = keyToDate(m.key), h = Math.max(0.06, Math.abs(m.saved) / max).toFixed(3);
      return `<button type="button" data-act="month" data-key="${m.key}" aria-pressed="${openMonth === m.key}" aria-label="${MON_LONG[d.getMonth()]}: saved ${esc(money(m.saved, m.homeCur))}">
        <small>${m.saved < 0 ? '−' : ''}${Math.abs(m.saved) >= 1000 ? (Math.abs(m.saved) / 1000).toFixed(1) + 'k' : Math.round(Math.abs(m.saved))}</small><i class="${m.saved < 0 ? 'neg' : ''}" style="--h:${h}"></i><b>${MON[d.getMonth()]}</b></button>`;
    }).join('');

    const rows = months.map(m => {
      const d = keyToDate(m.key), open = openMonth === m.key;
      const extra = (p.freq === 'fortnight' && m.pays >= 3) || (p.freq === 'week' && m.pays >= 5);
      const tag = m.live ? 'In progress' : extra ? `${m.pays} paydays` : '';
      const otherLabel = (CUR[m.otherCur] || {}).country || 'Overseas';
      const lines = l => m.lines.filter(x => x.list === l).map(x => `<div class="li"><span>${esc(x.name)}${x.n > 1 ? ` × ${x.n}` : ''}</span><span>${money(x.amt, m.homeCur)}</span></div>`).join('');
      return `<div class="month">
        <button type="button" class="month-btn" data-act="month" data-key="${m.key}" aria-expanded="${open}">
          <span class="month-h"><b>${MON_LONG[d.getMonth()]} ${d.getFullYear()}</b>${tag ? `<span class="tag">${tag}</span>` : ''}${ICON.chev}</span>
          <span class="trio"><span><small>Income</small><b>${money(m.income, m.homeCur)}</b></span><span><small>Costs</small><b>${money(m.other + m.home, m.homeCur)}</b></span><span><small>Saved</small><b class="${m.saved < 0 ? 'lost' : 'saved'}">${money(m.saved, m.homeCur)}</b></span></span>
        </button>
        ${open ? `<div class="detail">
          ${payDetail(m)}
          ${m.single ? '' : `<div><span class="lst"><span class="dot dot-other"></span>${esc(otherLabel)}</span><span>${money(m.other, m.homeCur)}</span></div>${lines('other')}`}
          <div><span class="lst"><span class="dot dot-home"></span>${m.single ? 'Costs' : 'Local'}</span><span>${money(m.home, m.homeCur)}</span></div>${lines('home')}
          ${m.otherCur !== m.homeCur ? `<div><span class="k">Rate used</span><span>${m.rate ? `${sym(m.homeCur)}1 = ${sym(m.otherCur)}${m.rate.toFixed(2)}` : 'none'}</span></div>` : ''}
          ${(m.sent = ((S.sent || {})[m.key] || {}).amt || 0) ? `<div><span class="k">Sent to ${esc(otherLabel)}</span><span>${money(m.sent, m.homeCur)}</span></div>` : ''}
          ${(m.moved = ((S.savings || {})[m.key] || {}).amt || 0) ? `<div><span class="k">Moved to savings</span><span>${money(m.moved, m.homeCur)}</span></div>` : ''}
          <div><span class="k">Saved</span><b>${m.income > 0 ? Math.round(m.saved / m.income * 100) + '% of income' : '—'}</b></div>
        </div>` : ''}
      </div>`;
    }).join('');

    const fd = keyToDate(first);
    return `<div class="wrap">
      <h1 class="page">History</h1>
      <section class="hero" aria-label="Savings summary">
        <div class="hero-top">
          <div><div class="hero-label">Saved since ${MON_LONG[fd.getMonth()]}${fd.getFullYear() !== t.getFullYear() ? ' ' + fd.getFullYear() : ''}</div><div class="hero-amt${total < 0 ? ' neg' : ''}">${money(total, p.home)}</div></div>
          <span class="badge">avg ${money(total / months.length, p.home)}/mo</span>
        </div>
        <div class="chart" style="grid-template-columns:repeat(${chartMonths.length},minmax(0,1fr))">${bars}</div>
      </section>
      <div class="months">${rows}</div>
      <p class="hint">This month counts what's due so far and still to come. Each month is kept here automatically when the next one starts.</p>
    </div>${navHtml()}`;
  }

  // Income lines in a month's History detail: one line per payday when the pay changed, plus extra income.
  function payDetail(m) {
    const pl = m.payLines;
    if (!pl) return `<div><span class="k">Paydays</span><span>${m.pays} × ${money(m.salary, m.homeCur)}</span></div>`;
    const pays = pl.filter(l => l.kind === 'pay'), extras = pl.filter(l => l.kind === 'extra');
    const same = pays.every(l => l.amt === m.salary);
    let h = `<div><span class="k">Income</span><span>${money(m.income, m.homeCur)}</span></div>`;
    h += same ? (pays.length ? `<div class="li"><span>${pays.length} payday${pays.length === 1 ? '' : 's'} × ${money(m.salary, m.homeCur)}</span><span>${money(pays.length * m.salary, m.homeCur)}</span></div>` : '')
      : pays.map(l => `<div class="li"><span>Pay ${shortDate(parse(l.date))}</span><span>${money(l.amt, m.homeCur)}</span></div>`).join('');
    h += extras.map(l => `<div class="li"><span>${esc(l.name)}</span><span>+${money(l.amt, m.homeCur)}</span></div>`).join('');
    return h;
  }

  function currencyOptions(selected) {
    return CURRENCIES.slice().sort((a, b) => a[1].localeCompare(b[1]))
      .map(([code, country, s]) => `<option value="${code}"${code === selected ? ' selected' : ''}>${esc(country)} · ${esc(s.trim())}</option>`).join('');
  }

  function setupHtml() {
    const first = !S.profile;
    const p = S.profile || { name: '', home: 'AUD', other: 'PHP', salary: '', freq: 'fortnight', last: ymd(today()), nth: 3, wd: 5 };
    const manual = !!(S.rate && S.rate.manual && S.profile && S.rate.pair === pairKey());
    const rmode = manual ? 'own' : p.margin ? 'margin' : 'market';
    const market = S.profile && S.rate && !S.rate.manual && S.rate.pair === pairKey() ? S.rate.value : null;
    const head = first
      ? `<div class="welcome"><div class="brand"><div class="logo" aria-hidden="true">${ICON.logo}</div><span>Piso<span class="wm-a">Wise</span></span></div><h1 id="setup-first">Set up your budget</h1><p>Takes a minute. It's saved to your account, so you can open it on any phone or computer.</p></div>`
      : `<h1 class="page">Setup</h1>`;
    return `<div class="wrap narrow${first ? ' first' : ''}">
      ${head}
      <form class="setup" id="setup" novalidate>
        <label class="fld"><span>Your name</span><input class="inp" name="name" value="${esc(p.name)}" autocomplete="given-name" maxlength="40" required></label>
        <fieldset class="fld" style="border:0;margin:0;padding:0">
          <legend class="lbl" style="padding:0;margin-bottom:6px">Where do your costs go?</legend>
          <input type="hidden" name="mode" value="${p.mode === 'single' ? 'single' : 'two'}">
          <div class="grid2">${[['single', 'Single Entry', 'All my costs are in the country I live in'], ['two', 'Two Way Entry', 'I also pay costs in another country, e.g. sending money home']]
            .map(([k, l, h]) => `<button type="button" class="opt" data-act="mode" data-mode="${k}" aria-pressed="${(p.mode === 'single' ? 'single' : 'two') === k}"><span class="radio"></span><span><b>${l}</b><small>${h}</small></span></button>`).join('')}</div>
        </fieldset>
        <div class="fld">
          <div class="grid2" id="cty-grid">
            <label class="fld"><span>I live in</span><select class="inp" name="home">${currencyOptions(p.home)}</select></label>
            <label class="fld" id="other-f"><span>I also pay for</span><select class="inp" name="other">${currencyOptions(p.other)}</select></label>
          </div>
          <small id="cty-note">Your two lists and the exchange rate follow these.</small>
        </div>
        <label class="fld"><span>Usual salary each payday (after tax)</span>
          <span class="prefix"><span id="sal-sym">${esc(sym(p.home).trim())}</span><input name="salary" inputmode="decimal" value="${p.salary !== '' && p.salary != null ? esc(Number(p.salary).toFixed(2)) : ''}" placeholder="0.00" autocomplete="off"></span>
          <small>Pay changes some months — a bonus, overtime, fewer hours? Tap Income on the Budget page to change any month.</small>
        </label>
        <fieldset class="fld" style="border:0;margin:0;padding:0">
          <legend class="lbl" style="padding:0;margin-bottom:6px">When does your salary arrive?</legend>
          <input type="hidden" name="freq" value="${p.freq}">
          <div class="grid2">${FREQS.map(([k, l, h]) => `<button type="button" class="opt" data-act="freq" data-freq="${k}" aria-pressed="${p.freq === k}"><span class="radio"></span><span><b>${l}</b><small>${h}</small></span></button>`).join('')}</div>
          <div class="box" id="custom-box" style="margin-top:4px">
            <span class="sub">Paid on the</span>
            <div class="grid2">
              <select class="inp" name="nth" aria-label="Which week">${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${+p.nth === n ? ' selected' : ''}>${NTH[n]}</option>`).join('')}</select>
              <select class="inp" name="wd" aria-label="Which day">${[1, 2, 3, 4, 5, 6, 0].map(n => `<option value="${n}"${+p.wd === n ? ' selected' : ''}>${DOW_LONG[n]}</option>`).join('')}</select>
            </div>
            <span class="sub">of every month</span>
          </div>
          <label class="fld" id="last-box" style="margin-top:6px"><span>Your last payday</span><input class="inp" type="date" name="last" value="${esc(p.last)}"></label>
        </fieldset>
        <div class="box"><span class="eyebrow">Your next paydays</span><div class="tiles" id="pay-tiles"></div></div>
        ${first ? '' : `<div class="box" id="rate-box">
          <span class="lbl">Exchange rate</span>
          <input type="hidden" name="ratemode" value="${rmode}">
          <div class="rate-opts">${[['market', 'Market rate', 'Checked automatically'], ['margin', 'Market rate minus a margin', 'Matches a money transfer service, e.g. Remitly or Wise'], ['own', 'My own fixed rate', 'You type it in and change it yourself']]
            .map(([k, l, h]) => `<button type="button" class="opt" data-act="ratemode" data-mode="${k}" aria-pressed="${rmode === k}"><span class="radio"></span><span><b>${l}</b><small>${h}</small></span></button>`).join('')}</div>
          <div class="fld" id="margin-f"><span class="sub">How much less than the market rate they give you</span>
            <span class="prefix"><span id="margin-l">${esc(sym(p.other).trim())}</span><input name="margin" inputmode="decimal" value="${p.margin ? esc(p.margin) : ''}" placeholder="0.42"></span>
            <small id="margin-t" class="ok" data-market="${market || ''}"></small></div>
          <div class="fld" id="manual-f"><span class="sub">e.g. your remittance centre's rate</span>
            <span class="prefix"><span id="rate-l">${esc(sym(p.home).trim())}1 =</span><input name="rate" inputmode="decimal" value="${manual ? esc(S.rate.value) : ''}" placeholder="${rateValue() ? esc(rateValue().toFixed(2)) : '0.00'}"></span></div>
          <span class="credit">Market rates by <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Exchange Rate API</a>, checked every few hours.</span>
        </div>`}
        <p class="err" id="setup-err" hidden></p>
        <button class="btn" type="submit">${first ? 'Start my budget' : 'Save changes'}</button>
      </form>
      ${first ? '' : `<h2 class="section-t">Your account</h2>
      <div class="box">
        <div class="acct"><span class="acct-ini" aria-hidden="true">${esc((Cloud.user.email[0] || '?').toUpperCase())}</span><span class="acct-m"><b>${esc(Cloud.user.email)}</b><small class="sync-dot" data-sync="${sync.state}">${esc(syncText())}</small></span></div>
        <span class="sub">Sign in with this email on any phone, tablet or computer to see the same budget.</span>
        <div class="btn-row"><button type="button" class="btn-ghost" data-act="signout">${confirmOut ? 'Not saved yet — tap again to sign out' : 'Sign out'}</button></div>
      </div>
      <h2 class="section-t">Restore points</h2>
      <div class="box">
        <span class="sub">Saved in your account: one a day, plus one just before anything is removed. Kept for ${POINT_DAYS} days. Restoring saves your budget now first, so you can undo it.</span>
        ${pointsHtml()}
      </div>
      <h2 class="section-t">Your data</h2>
      <div class="box">
        <span class="sub">Save a backup file now and then if you like — you can restore it into any account. A cost list file adds its costs to your budget.</span>
        <div class="btn-row">
          <button type="button" class="btn-ghost" data-act="backup">Save backup</button>
          <label class="btn-ghost" style="display:flex;align-items:center;cursor:pointer">Restore or import<input type="file" accept="application/json,.json" data-act="restore" hidden></label>
          <button type="button" class="btn-danger" data-act="reset">${confirmReset ? 'Tap again to delete your whole budget' : 'Start over'}</button>
        </div>
      </div>`}
    </div>${first ? `<p class="hint" style="text-align:center">Signed in as ${esc(Cloud.user.email)} · <button type="button" class="link" data-act="signout">Sign out</button></p>` : navHtml()}`;
  }

  // ---------- sign in ----------
  function authHtml() {
    const m = authMode;
    const t = { in: ['Welcome back', 'Sign in to see your budget.'], up: ['Create your account', 'Your budget is saved to your account, so you can open it on any phone or computer.'],
      forgot: ['Forgot your password?', "Enter your email and we'll send you a link to set a new one."], reset: ['Set a new password', 'Choose a new password for ' + esc(Cloud.user ? Cloud.user.email : 'your account') + '.'] }[m];
    const email = `<label class="fld"><span>Email</span><input class="inp" type="email" name="email" autocomplete="email" inputmode="email" required></label>`;
    const pw = (label, ac) => `<label class="fld"><span>${label}</span><span class="pw"><input class="inp" type="password" name="password" autocomplete="${ac}" required><button type="button" class="pw-eye" data-act="peek" aria-label="Show password">Show</button></span>${m === 'in' ? '' : '<small>At least 8 characters.</small>'}</label>`;
    const fields = m === 'in' ? email + pw('Password', 'current-password') : m === 'up' ? email + pw('Password', 'new-password') : m === 'forgot' ? email : pw('New password', 'new-password');
    const btn = { in: 'Sign in', up: 'Create account', forgot: 'Send reset link', reset: 'Save new password' }[m];
    const links = m === 'in' ? `<button type="button" class="link" data-act="auth-mode" data-mode="forgot">Forgot password?</button><span>New here? <button type="button" class="link" data-act="auth-mode" data-mode="up">Create an account</button></span>`
      : m === 'reset' ? '' : `<span>${m === 'up' ? 'Already have an account?' : ''} <button type="button" class="link" data-act="auth-mode" data-mode="in">${m === 'up' ? 'Sign in' : 'Back to sign in'}</button></span>`;
    const note = !Cloud.configured() ? `<p class="err">Accounts aren't switched on yet for this copy of PisoWise.</p>`
      : authMsg ? `<p class="${authMsg.ok ? 'note-ok' : 'err'}" role="alert">${esc(authMsg.text)}</p>` : '';
    return `<div class="wrap narrow first auth">
      <div class="welcome"><div class="brand"><div class="logo" aria-hidden="true">${ICON.logo}</div><span>Piso<span class="wm-a">Wise</span></span></div><h1>${t[0]}</h1><p>${t[1]}</p></div>
      <form class="setup" id="auth" novalidate>
        ${fields}
        ${note}
        <button class="btn" type="submit"${authBusy || !Cloud.configured() ? ' disabled' : ''}>${authBusy ? 'Please wait…' : btn}</button>
        <div class="auth-links">${links}</div>
      </form>
      <p class="hint" style="text-align:center">Free, no ads. Only you can see your budget.</p>
    </div>`;
  }
  function toSignIn(text) {
    clearTimeout(pushTimer);
    S = blank(); meta = { rev: 0, dirty: false, editedAt: 0 };
    view = 'auth'; authMode = 'in'; authMsg = text ? { text } : null;
    if (draft) closeEditor();
    if (payDraft) closePay();
    render();
  }
  async function submitAuth() {
    const f = document.getElementById('auth');
    const email = f.elements.email ? f.elements.email.value.trim() : '';
    const password = f.elements.password ? f.elements.password.value : '';
    const fail = text => { authBusy = false; authMsg = { text }; render(); refill(email); };
    if (authMode !== 'reset' && !/^\S+@\S+\.\S+$/.test(email)) return fail('Please enter your email address.');
    if (authMode !== 'forgot' && !password) return fail('Please enter your password.');
    if ((authMode === 'up' || authMode === 'reset') && password.length < 8) return fail('Please use a longer password — at least 8 characters.');
    authBusy = true; authMsg = null; render(); refill(email);
    try {
      if (authMode === 'in') { await Cloud.signIn(email, password); authBusy = false; return enter(); }
      if (authMode === 'up') {
        const ses = await Cloud.signUp(email, password);
        authBusy = false;
        if (ses) return enter();
        authMode = 'in'; authMsg = { ok: true, text: `Almost there — we sent a link to ${email}. Open it to confirm your email, then sign in.` };
        render(); refill(email); return;
      }
      if (authMode === 'forgot') {
        await Cloud.forgot(email);
        authBusy = false; authMode = 'in'; authMsg = { ok: true, text: `If there's an account for ${email}, a reset link is on its way. Check your inbox.` };
        render(); refill(email); return;
      }
      await Cloud.setPassword(password);
      authBusy = false;
      enter('Password changed');
    } catch (e) { fail(e.message); }
  }
  function refill(email) {
    const el = document.querySelector('#auth [name="email"]');
    if (el && email) el.value = email;
  }
  // Signed in: show this device's copy straight away, then catch up with the account.
  function enter(msg) {
    authMsg = null; confirmOut = false; authMode = 'in';
    S = loadLocal();
    view = S.profile ? 'home' : 'setup';
    tab = 'other';
    rollover();
    render();
    window.scrollTo(0, 0);
    if (msg) toast(msg);
    pull().then(() => refreshRate(false));
  }
  function signOut() {
    if (meta.dirty && !confirmOut) { confirmOut = true; render(); return; }
    // Don't leave this budget on a shared phone or computer.
    try { localStorage.removeItem(userKey()); } catch (e) { /* ignore */ }
    Cloud.signOut();
    confirmOut = false;
    toSignIn();
    toast('Signed out');
  }

  function readSetup() {
    const f = document.getElementById('setup');
    if (!f) return null;
    const v = n => f.elements[n] ? f.elements[n].value : '';
    return {
      name: v('name').trim(), mode: v('mode') === 'single' ? 'single' : 'two', home: v('home'), other: v('other'), salary: num(v('salary')), salaryTyped: hasNum(v('salary')),
      freq: v('freq'), last: v('last'), nth: +v('nth'), wd: +v('wd'),
      ratemode: v('ratemode') || 'market', manual: v('ratemode') === 'own', margin: num(v('margin')), rate: num(v('rate'))
    };
  }

  function syncSetup() {
    const p = readSetup();
    if (!p) return;
    document.querySelectorAll('[data-act="freq"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.freq === p.freq));
    document.getElementById('custom-box').hidden = p.freq !== 'custom';
    document.getElementById('last-box').hidden = p.freq === 'custom';
    document.getElementById('sal-sym').textContent = sym(p.home).trim();
    const rl = document.getElementById('rate-l');
    if (rl) rl.textContent = `${sym(p.home).trim()}1 =`;
    const mf = document.getElementById('manual-f');
    if (mf) mf.hidden = !p.manual;
    document.querySelectorAll('[data-act="ratemode"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === p.ratemode));
    const gf = document.getElementById('margin-f');
    if (gf) {
      gf.hidden = p.ratemode !== 'margin';
      document.getElementById('margin-l').textContent = sym(p.other).trim();
      const mt = document.getElementById('margin-t'), mk = +mt.dataset.market;
      mt.textContent = mk && p.margin > 0 && p.margin < mk ? `Today: ${sym(p.home)}1 = ${sym(p.other)}${(mk - p.margin).toFixed(2)} (market ${mk.toFixed(2)})` : '';
    }
    document.querySelectorAll('[data-act="mode"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === p.mode));
    document.getElementById('other-f').hidden = p.mode === 'single';
    document.getElementById('cty-grid').classList.toggle('one-col', p.mode === 'single');
    document.getElementById('cty-note').textContent = p.mode === 'single' ? 'One list in one currency — no exchange rate.' : 'Your two lists and the exchange rate follow these.';
    const rb = document.getElementById('rate-box');
    if (rb) rb.hidden = p.home === p.other || p.mode === 'single';
    const tiles = document.getElementById('pay-tiles');
    if (p.freq !== 'custom' && !p.last) { tiles.innerHTML = '<span class="sub">Pick your last payday</span>'; return; }
    const t = today(), ds = paydays(addDays(t, 1), addDays(t, 400), p).slice(0, 3);
    tiles.innerHTML = ds.map(d => `<div class="tile"><small>${DOW[d.getDay()]}</small><b>${d.getDate()}</b><span>${MON[d.getMonth()]} ${d.getFullYear()}</span></div>`).join('');
  }

  function submitSetup() {
    const p = readSetup(), err = document.getElementById('setup-err');
    const fail = m => { err.textContent = m; err.hidden = false; };
    if (!p.name) return fail('Please enter your name.');
    if (!p.salaryTyped) return fail('Please enter your salary for each payday (0 is fine if it changes every month).');
    if (p.freq !== 'custom' && !p.last) return fail('Please pick your last payday.');
    const two = p.mode !== 'single';
    if (two && p.manual && !(p.rate > 0)) return fail('Please enter your exchange rate, or pick Market rate.');
    if (two && p.ratemode === 'margin' && !(p.margin >= 0)) return fail('Please enter the margin, or pick Market rate.');
    const first = !S.profile, old = S.profile;
    S.profile = { name: p.name, mode: p.mode, home: p.home, other: p.other, salary: p.salary, freq: p.freq, last: p.last || ymd(today()), nth: p.nth, wd: p.wd, margin: p.ratemode === 'margin' ? p.margin : 0 };
    if (old) {
      for (const it of S.items) {
        if (it.cur === old.home) it.cur = p.home;
        else if (it.cur === old.other) it.cur = p.other;
        if (it.cur !== p.home && it.cur !== p.other) it.cur = it.list === 'home' ? p.home : p.other;
      }
    }
    if (!two) { /* keep the saved rate for when Two Way Entry comes back */ }
    else if (p.manual) S.rate = { pair: pairKey(), value: p.rate, at: Date.now(), manual: true };
    else if (S.rate && (S.rate.manual || S.rate.pair !== pairKey())) S.rate = null;
    if (first) S.seen = monthKey(today());
    save();
    view = 'home';
    tab = 'other';
    render();
    window.scrollTo(0, 0);
    toast(first ? `Welcome, ${p.name}! Add your costs to see what you can save.` : 'Saved');
    refreshRate(false);
  }

  // ---------- cost editor ----------
  function openEditor(it, list) {
    const p = S.profile;
    draft = it ? Object.assign({}, it, { amt: String(it.amt), left: it.left ? String(it.left) : '', every: String(it.every || 2), optional: !!it.optional, countNow: counted(it, vm()), subs: it.subs && (it.subs.length || it.bnpl) ? it.subs.map(x => Object.assign({ name: x.name, amt: String(x.amt) }, x.bk ? { bk: x.bk } : {})) : null })
      : { id: null, list, name: '', amt: '', cur: list === 'home' ? p.home : p.other, rep: 'month', every: '2', due: ymd(vm() === monthKey(today()) ? today() : vmFrom()), left: '', optional: false, countNow: true, subs: null };
    clearTimeout(toastTimer);
    $toast.hidden = true;
    renderEditor();
    const n = document.getElementById('d-name');
    if (n && !it) n.focus();
  }
  function closeEditor() { draft = null; $modal.innerHTML = ''; }
  // Switching the currency converts the amount (and each line) at today's rate, e.g. A$100 → ₱4,000 at 40.
  function switchCur(cur) {
    const p = S.profile, d = draft, rate = rateValue();
    if (cur === d.cur) return;
    const conv = v => {
      if (!rate || !hasNum(v)) return v;
      const x = d.cur === p.home && cur === p.other ? num(v) * rate : d.cur === p.other && cur === p.home ? num(v) / rate : num(v);
      return String(Math.round(x * 100) / 100);
    };
    if (d.subs) d.subs = d.subs.map(x => ({ name: x.name, amt: conv(x.amt) }));
    else d.amt = conv(d.amt);
    d.cur = cur;
  }
  const subsTotal = () => (draft.subs || []).reduce((a, x) => a + num(x.amt), 0);

  function editorTexts() {
    const p = S.profile, d = draft, amt = d.subs ? subsTotal() : num(d.amt), rate = rateValue();
    let conv = '';
    if (p.home !== p.other && !single() && amt > 0) {
      if (d.cur === p.home) conv = rate ? `≈ ${money(amt * rate, p.other)} in ${CUR[p.other].country}` : '';
      else conv = rate ? `≈ ${money(amt / rate, p.home)} at ${rate.toFixed(2)}` : 'No exchange rate yet';
    }
    const it = Object.assign({}, d, { amt, left: d.rep === 'once' ? 0 : Math.floor(num(d.left)), created: null });
    let next = '';
    if (d.due) {
      const nd = nextDue(it);
      next = nd ? `${dueDesc(it)} · due ${inDays(daysBetween(today(), nd))}` : d.rep === 'once' ? 'This date has passed' : 'All payments made';
    }
    let debt = '';
    const ds = d.due && isDebt(it) ? debtState(it) : null;
    if (ds) debt = ds.remaining ? `${ds.remaining} payment${ds.remaining === 1 ? '' : 's'} left · paid off ${MON[ds.end.getMonth()]} ${ds.end.getFullYear()} · ${money(ds.toGo, d.cur)} to go` : 'Paid off';
    return { conv, next, debt };
  }
  function updateEditorTexts() {
    const x = editorTexts();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('d-conv', x.conv); set('d-next', x.next); set('d-debt-t', x.debt);
  }

  function renderEditor() {
    const p = S.profile, d = draft, x = editorTexts();
    const listName = d.list === 'home' ? (single() ? 'Costs' : 'Local') : CUR[p.other].country;
    const debtOn = d.left !== '';
    const old = d.id ? S.items.find(x => x.id === d.id) : null, mk = vm();
    const fromHere = old && old.rep !== 'once' && startKey(old) < mk;
    const hint = fromHere ? `<p class="ed-hint">Changes apply from ${monName(mk)} on. ${monName(prevKey(mk))} and earlier stay as they are.</p>` : '';
    const lists = single() ? '' : `<div class="fld"><span>List</span><div class="seg seg-list" role="group" aria-label="List">${[['other', CUR[p.other].country], ['home', 'Local']].map(([k, l]) => `<button type="button" data-act="lst" data-list="${k}" class="sl-${k}" aria-pressed="${d.list === k}" title="${d.list === k ? 'On the ' + esc(l) + ' list' : 'Move this cost to the ' + esc(l) + ' list' + (fromHere ? ' from ' + monName(mk) + ' on' : '')}">${esc(l)}</button>`).join('')}</div></div>`;
    const rmText = !old ? '' : fromHere || (old.rep !== 'once' && startKey(old) < mk)
      ? `Remove ${esc(old.name)} from ${monName(mk)} on? ${monName(prevKey(mk))} and earlier keep it.`
      : `Remove ${esc(old.name)}? It starts in ${monName(startKey(old) > mk ? startKey(old) : mk)}, so it's removed completely.`;
    const actions = d.confirmRm
      ? `<div class="rm-ask"><p>${rmText} A restore point is saved first.</p><div class="dlg-actions">
          <button type="button" class="btn-ghost" data-act="rm-no" title="Keep this cost">Keep</button>
          <button type="button" class="btn-danger" data-act="rm-yes" title="${fromHere ? 'Remove from ' + monName(mk) + ' and later months' : 'Remove this cost'}">Remove</button></div></div>`
      : `<div class="dlg-actions">
        ${d.id ? '<button type="button" class="btn-danger" data-act="remove" title="Remove this cost">Remove</button>' : ''}
        <button type="button" class="btn-ghost" data-act="cancel">Cancel</button>
        <button type="button" class="btn" data-act="save-item">Save</button>
      </div>`;
    const curs = p.home === p.other || single() ? '' : `<div class="seg" role="group" aria-label="Currency">${[p.other, p.home].map(c => `<button type="button" data-act="cur" data-cur="${c}" aria-pressed="${d.cur === c}" aria-label="${esc(CUR[c].country)} currency" title="${d.cur === c ? 'Amount in ' + esc(CUR[c].code || c) : 'Switch to ' + esc(sym(c).trim()) + ' — the amount converts at today\'s rate'}">${esc(sym(c).trim())}</button>`).join('')}</div>`;
    $modal.innerHTML = `<div class="overlay" data-act="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
      <div class="dlg-head"><h2 id="dlg-t">${d.id ? 'Edit cost' : 'New cost'}</h2><span class="pill pill-${d.list}">${esc(listName)}</span></div>
      ${hint}${lists}
      <label class="fld"><span>Name</span><input class="inp" id="d-name" value="${esc(d.name)}" placeholder="${d.list === 'home' ? 'e.g. Rent' : 'e.g. Family allowance'}" maxlength="60"></label>
      <div class="fld"><span>Amount each time</span>
        <div class="amt-row">${curs}<input class="inp num" id="d-amt" inputmode="decimal" value="${esc(d.subs ? subsTotal().toFixed(2) : d.amt)}" placeholder="0" style="text-align:right" aria-label="Amount"${d.subs ? ' readonly aria-readonly="true"' : ''}></div>
        <small id="d-conv">${esc(x.conv)}</small>${d.subs ? '<small>= total of the lines below</small>' : ''}</div>
      <div class="brk">
        <label class="chk"><input type="checkbox" id="d-brk"${d.subs ? ' checked' : ''}><span>Break it down<small class="sub" style="display:block;font-weight:400">Add lines — the amount is their total</small></span></label>
        ${d.subs ? `<div class="sublines">${d.subs.map((x, i) => `<div class="sl">
            <input class="inp" data-subn="${i}" value="${esc(x.name)}" placeholder="What" maxlength="40" aria-label="Line ${i + 1} name">
            <span class="prefix"><span>${esc(sym(d.cur).trim())}</span><input class="num" data-suba="${i}" inputmode="decimal" value="${esc(x.amt)}" placeholder="0" aria-label="Line ${i + 1} amount"></span>
            <button type="button" class="x-btn" data-act="sub-del" data-i="${i}" aria-label="Remove line ${i + 1}">${ICON.x}</button></div>`).join('')}
          <button type="button" class="add-btn" data-act="sub-add" style="margin:0">${ICON.plus}Add a line</button></div>` : ''}
      </div>
      <div class="fld"><span>Repeats</span><div class="chips">${REPEATS.map(([k, l]) => `<button type="button" class="chip" data-act="rep" data-rep="${k}" aria-pressed="${d.rep === k}">${l}</button>`).join('')}</div>
        ${d.rep === 'every' ? `<label class="inline"><span>Every</span><input class="inp" id="d-every" inputmode="numeric" value="${esc(d.every)}" aria-label="Number of months"><span>months</span></label><small>From 2 to 24 months — e.g. 2 for every second month, 6 for twice a year.</small>` : ''}</div>
      <label class="fld"><span>${d.rep === 'once' ? 'Due on' : 'Next due'}</span><input class="inp" type="date" id="d-due" value="${esc(d.due)}"><small id="d-next" class="ok">${esc(x.next)}</small></label>
      ${d.rep === 'once' ? '' : `<div class="debt-box">
        <label class="chk"><input type="checkbox" id="d-debt"${debtOn ? ' checked' : ''}> Debt or loan — it ends</label>
        ${debtOn ? `<label class="inline"><span>Payments left, including the next one</span><input class="inp" id="d-left" inputmode="numeric" value="${esc(d.left)}"></label><small id="d-debt-t" class="debt-t">${esc(x.debt)}</small>` : ''}
      </div>`}
      <div class="fld"><span>${esc(MON_LONG[vmFrom().getMonth()])}</span><div class="chips cnt">
        <button type="button" class="chip" data-act="cnt" data-on="1" aria-pressed="${d.countNow}">Count in ${esc(MON_LONG[vmFrom().getMonth()])}</button>
        <button type="button" class="chip" data-act="cnt" data-on="0" aria-pressed="${!d.countNow}">Leave out in ${esc(MON_LONG[vmFrom().getMonth()])}</button></div></div>
      <label class="chk chk-box"><input type="checkbox" id="d-opt"${d.optional ? ' checked' : ''}><span>Optional<small>Not counted each month until you switch it on for that month — for costs you don't pay every month.</small></span></label>
      <p class="err" id="d-err" hidden></p>
      ${actions}
    </div></div>`;
  }

  function saveItem() {
    const d = draft, err = document.getElementById('d-err');
    const fail = m => { err.textContent = m; err.hidden = false; };
    let subs = null;
    if (d.subs) {
      subs = [];
      for (const x of d.subs) {
        if (!x.name.trim() && !x.amt.trim()) continue;
        if (!hasNum(x.amt)) return fail('Please enter an amount for each line (0 is fine), or remove it.');
        subs.push(Object.assign({ name: x.name.trim() || 'Item', amt: Math.round(num(x.amt) * 100) / 100 }, x.bk ? { bk: x.bk } : {}));
      }
      if (!subs.length && !d.bnpl) return fail('Please add at least one line, or untick Break it down.');
    }
    const amt = subs ? Math.round(subs.reduce((a, x) => a + x.amt, 0) * 100) / 100 : num(d.amt), left = Math.floor(num(d.left));
    if (!d.name.trim()) return fail('Please give this cost a name.');
    if (!subs && !hasNum(d.amt)) return fail('Please enter an amount (0 is fine).');
    if (!d.due) return fail('Please pick a due date.');
    if (d.left !== '' && d.rep !== 'once' && !(left > 0)) return fail('Please enter how many payments are left.');
    const item = {
      id: d.id || S.nextId++, list: d.list, name: d.name.trim(), amt, cur: d.cur, rep: d.rep, due: d.due,
      left: d.rep !== 'once' && d.left !== '' ? left : 0,
      paid: d.paid || [],
      // A cost added while looking at a later month starts in that month.
      created: d.created || (vm() > monthKey(today()) ? vm() + '-01' : ymd(new Date(Math.min(today(), parse(d.due)))))
    };
    if (d.rep === 'every') {
      const ev = Math.floor(num(d.every));
      if (!(ev >= 2 && ev <= 24)) return fail('Please enter every 2 to 24 months.');
      item.every = ev;
    }
    if (d.optional) item.optional = true;
    if (subs) item.subs = subs;
    // An Afterpay cost stays linked: a payment line taken out here counts as deleted, so an update doesn't bring it back.
    if (d.bnpl) { const keep = new Set((subs || []).map(x => x.bk).filter(Boolean)); item.bnpl = Object.assign({}, d.bnpl, { skip: d.bnpl.snap.map(x => x.k).filter(k => !keep.has(k)) }); }
    const cnt = Object.assign({}, d.count), mk = vm();
    if (d.countNow === !d.optional) delete cnt[mk]; else cnt[mk] = d.countNow;
    if (Object.keys(cnt).length) item.count = cnt;
    const i = S.items.findIndex(x => x.id === item.id), old = i >= 0 ? S.items[i] : null;
    if (old && old.until) item.until = old.until;
    // A real change to a cost that started before this month: the old one stops last month and a copy carries on from here.
    const shape = x => JSON.stringify([x.list, x.name, x.amt, x.cur, x.rep, x.due, x.left || 0, x.rep === 'every' ? x.every : 0, !!x.optional, x.subs || null]);
    const split = old && old.rep !== 'once' && item.rep !== 'once' && startKey(old) < mk && shape(old) !== shape(item);
    if (split) {
      old.until = prevKey(mk);
      item.id = S.nextId++;
      item.created = mk + '-01';
      S.items.splice(i + 1, 0, item);
    } else if (i >= 0) S.items[i] = item; else S.items.push(item);
    save();
    closeEditor();
    render();
    toast(split ? `Saved from ${monName(mk)} on` : i >= 0 ? 'Saved' : `Added ${item.name}`);
  }

  function removeItem() {
    const i = S.items.findIndex(x => x.id === draft.id);
    if (i < 0) return closeEditor();
    const it = S.items[i], mk = vm();
    addPoint('Before removing ' + it.name);
    if (it.rep !== 'once' && startKey(it) < mk) {
      // Earlier months keep it: it just stops last month.
      const was = it.until;
      it.until = prevKey(mk);
      save(); closeEditor(); render();
      toast(`Removed ${it.name} from ${monName(mk)} on`, { label: 'Undo', run: () => { if (was) it.until = was; else delete it.until; save(); render(); } });
      return;
    }
    const [gone] = S.items.splice(i, 1);
    save();
    closeEditor();
    render();
    undo = { item: gone, index: i };
    toast(`Removed ${gone.name}`, { label: 'Undo', run: () => { S.items.splice(undo.index, 0, undo.item); save(); render(); } });
  }

  // ---------- restore points ----------
  // Copies of the budget kept inside the account: one a day, plus one before anything is removed or restored. 14 days.
  const POINT_DAYS = 14, POINT_MAX = 24;
  function pointData() {
    const o = {};
    for (const k of ['profile', 'items', 'rate', 'pay', 'sent', 'savings', 'bnpl', 'nextId']) o[k] = S[k];
    return JSON.parse(JSON.stringify(o));
  }
  function addPoint(why) {
    if (!S.profile) return false;
    const data = pointData(), cut = Date.now() - POINT_DAYS * 864e5;
    const pts = (S.points || []).filter(x => x && x.at >= cut);
    if (why === 'day' && pts[0] && JSON.stringify(pts[0].data) === JSON.stringify(data)) { S.points = pts; return false; }
    S.points = [{ at: Date.now(), why, data }].concat(pts).slice(0, POINT_MAX);
    return true;
  }
  function dayPoint() {
    const d = ymd(today());
    if ((S.points || []).some(x => x.why === 'day' && ymd(new Date(x.at)) === d)) return;
    if (addPoint('day')) save();
  }
  function restorePoint(at) {
    const pt = (S.points || []).find(x => x.at === at);
    if (!pt) return;
    addPoint('Before restoring');
    const pts = S.points, data = JSON.parse(JSON.stringify(pt.data));
    S = Object.assign(blank(), S, data, { points: pts, nextId: Math.max(S.nextId || 1, data.nextId || 1) });
    confirmRp = null;
    save();
    rollover();
    view = 'home';
    render();
    window.scrollTo(0, 0);
    toast(`Restored to ${pointWhen(pt.at)}`);
  }
  function pointWhen(at) {
    const d = new Date(at), n = daysBetween(new Date(d.toDateString()), today());
    return (n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`) + ' ' + clock(at);
  }
  function pointsHtml() {
    const pts = S.points || [];
    if (!pts.length) return '<span class="sub">The first one is saved the next time PisoWise syncs.</span>';
    return `<div class="rps">${pts.map(x => {
      const n = (x.data.items || []).length, sure = confirmRp === x.at;
      return `<div class="rp"><span class="rp-m"><b>${x.why === 'day' ? 'Start of the day' : esc(x.why)}</b><small>${esc(pointWhen(x.at))} · ${n} cost${n === 1 ? '' : 's'}</small></span>
        <button type="button" class="${sure ? 'btn-danger' : 'btn-ghost'} rp-btn" data-act="rp" data-at="${x.at}" title="Put your budget back to how it was ${esc(pointWhen(x.at))}. Your budget now is saved first.">${sure ? 'Tap again' : 'Restore'}</button></div>`;
    }).join('')}</div>`;
  }

  // Tick: marks the next unpaid due date this month as paid; once all are paid, a tap clears this month's ticks.
  function togglePaid(id) {
    const it = S.items.find(x => x.id === id);
    if (!it) return;
    const t = today(), occ = occurrences(it, vmFrom(), vmTo()).map(ymd);
    if (!occ.length || !counted(it, vm())) return;
    const paid = (it.paid || []).filter(k => k >= ymd(new Date(t.getFullYear() - 1, t.getMonth(), 1))); // keep a year
    const open = occ.filter(k => !paid.includes(k));
    it.paid = open.length ? paid.concat(open[0]) : paid.filter(k => !occ.includes(k));
    save();
    render();
    if (open.length) toast(`${it.name}: paid`, { label: 'Undo', run: () => { it.paid = it.paid.filter(k => k !== open[0]); save(); render(); } });
  }

  // ---------- month pay editor ----------
  // payDraft: { key, pays: [{date, amt:string}], extras: [{name, amt:string}] }
  function openPay(key) {
    const k = key || vm(), m = monthPay(k), f = keyToDate(k);
    payDraft = {
      key: k,
      pays: paydays(f, monthEnd(f)).map(d => ({ date: ymd(d), amt: m.pays[ymd(d)] != null ? String(m.pays[ymd(d)]) : '' })),
      extras: m.extras.map(x => ({ name: x.name, amt: String(x.amt) }))
    };
    clearTimeout(toastTimer);
    $toast.hidden = true;
    renderPay();
  }
  function closePay() { payDraft = null; $modal.innerHTML = ''; }
  function payTotal() {
    const base = S.profile.salary;
    return payDraft.pays.reduce((a, x) => a + (x.amt.trim() === '' ? base : num(x.amt)), 0)
      + payDraft.extras.reduce((a, x) => a + num(x.amt), 0);
  }
  function renderPay() {
    const p = S.profile, d = payDraft, f = keyToDate(d.key), cur = monthKey(today());
    const canPrev = d.key > monthShift(-12), canNext = d.key < monthShift(12);
    const s = sym(p.home).trim();
    const pays = d.pays.length ? d.pays.map((x, i) => {
      const dt = parse(x.date);
      return `<div class="pay-row"><span class="cal"><small>${DOW[dt.getDay()]}</small><b>${dt.getDate()}</b></span><span class="pay-l">Payday<small>${MON[dt.getMonth()]} ${dt.getFullYear()}</small></span>
        <span class="prefix"><span>${esc(s)}</span><input class="num" data-pay="${i}" inputmode="decimal" value="${esc(x.amt)}" placeholder="${esc(p.salary.toFixed(2))}" aria-label="Pay on ${esc(shortDate(dt))}"></span></div>`;
    }).join('') : `<p class="sub">No payday this month.</p>`;
    const extras = d.extras.map((x, i) => `<div class="extra-row">
        <input class="inp" data-xname="${i}" value="${esc(x.name)}" placeholder="e.g. Bonus" maxlength="40" aria-label="What is it">
        <span class="prefix"><span>${esc(s)}</span><input class="num" data-xamt="${i}" inputmode="decimal" value="${esc(x.amt)}" placeholder="0.00" aria-label="Amount"></span>
        <button type="button" class="x-btn" data-act="x-del" data-i="${i}" aria-label="Remove">${ICON.x}</button></div>`).join('');
    $modal.innerHTML = `<div class="overlay" data-act="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
      <div class="dlg-head"><h2 id="dlg-t">Your pay</h2></div>
      <div class="mon-sw">
        <button type="button" class="x-btn" data-act="p-prev" aria-label="Previous month"${canPrev ? '' : ' disabled'}>${ICON.chevL}</button>
        <b>${MON_LONG[f.getMonth()]} ${f.getFullYear()}</b>
        <button type="button" class="x-btn" data-act="p-next" aria-label="Next month"${canNext ? '' : ' disabled'}>${ICON.chevR}</button>
      </div>
      <div class="fld"><span>Paydays</span>${pays}<small>Leave a payday empty for your usual ${money(p.salary, p.home)}. Change it when the pay is different.</small></div>
      <div class="fld"><span>Extra income</span>${extras}
        <button type="button" class="add-btn" data-act="x-add" style="margin:0">${ICON.plus}Add extra income</button>
        <small>A bonus, overtime, tax refund, side job — anything on top of your pay this month.</small></div>
      <div class="pay-total"><span>Income in ${MON_LONG[f.getMonth()]}</span><b id="p-total">${money(payTotal(), p.home)}</b></div>
      <p class="err" id="p-err" hidden></p>
      <div class="dlg-actions">
        <button type="button" class="btn-ghost" data-act="cancel">Cancel</button>
        <button type="button" class="btn" data-act="save-pay">Save</button>
      </div>
    </div></div>`;
  }
  function savePay(silent) {
    const d = payDraft, err = document.getElementById('p-err');
    const fail = m => { if (err) { err.textContent = m; err.hidden = false; } return false; };
    const pays = {}, extras = [];
    for (const x of d.pays) if (x.amt.trim() !== '') pays[x.date] = Math.round(num(x.amt) * 100) / 100;
    for (const x of d.extras) {
      if (!x.name.trim() && !x.amt.trim()) continue;
      if (!hasNum(x.amt)) return fail('Please enter an amount for each extra income (0 is fine), or remove it.');
      extras.push({ name: x.name.trim() || 'Extra income', amt: Math.round(num(x.amt) * 100) / 100 });
    }
    if (!S.pay) S.pay = {};
    if (Object.keys(pays).length || extras.length) S.pay[d.key] = { pays, extras };
    else delete S.pay[d.key];
    save();
    if (!silent) { closePay(); render(); toast('Pay saved'); }
    return true;
  }

  // ---------- backup ----------
  function backup() {
    const blob = new Blob([JSON.stringify(Object.assign({}, S, { points: undefined }), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pisowise-backup-${ymd(today())}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Backup saved to your downloads');
  }
  // A cost list (kind: 'pisowise-costs', or the older 'budgetwise-costs') adds to the budget instead of replacing it.
  function importCosts(list) {
    const p = S.profile, t = ymd(today());
    const REPS = REPEATS.map(r => r[0]);
    let added = 0;
    for (const x of list) {
      const amt = num(x.amt), lst = x.list === 'home' ? 'home' : 'other';
      if (!x.name || (!hasNum(x.amt) && !(Array.isArray(x.subs) && x.subs.length))) continue;
      const cur = x.cur === 'home' || x.cur === p.home ? p.home : x.cur === 'other' || x.cur === p.other ? p.other : lst === 'home' ? p.home : p.other;
      const rep = REPS.includes(x.rep) ? x.rep : 'month';
      const due = /^\d{4}-\d{2}-\d{2}$/.test(x.due || '') ? x.due : t;
      const it = { id: S.nextId++, list: lst, name: String(x.name).slice(0, 60), amt, cur, rep, due,
        left: rep !== 'once' && x.left > 0 ? Math.floor(x.left) : 0, paid: [], created: due < t ? due : t };
      if (rep === 'every') it.every = Math.min(24, Math.max(2, Math.floor(num(x.every)) || 2));
      if (x.optional) it.optional = true;
      if (Array.isArray(x.subs) && x.subs.length) {
        it.subs = x.subs.filter(y => y && hasNum(y.amt)).map(y => ({ name: String(y.name || 'Item').slice(0, 40), amt: Math.round(num(y.amt) * 100) / 100 }));
        if (it.subs.length) it.amt = Math.round(it.subs.reduce((a, y) => a + y.amt, 0) * 100) / 100; else delete it.subs;
      }
      S.items.push(it);
      added++;
    }
    if (!added) return toast('No costs found in that file');
    save();
    view = 'home';
    render();
    toast(`Added ${added} cost${added === 1 ? '' : 's'}`);
  }
  function restore(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const s = JSON.parse(r.result);
        if (s && (s.kind === 'pisowise-costs' || s.kind === 'budgetwise-costs') && Array.isArray(s.items)) return importCosts(s.items);
        if (!s || s.v !== 1 || !s.profile || !Array.isArray(s.items)) throw new Error('bad');
        addPoint('Before restoring a backup file');
        const pts = S.points;
        S = Object.assign(blank(), s, { points: pts });
        save();
        rollover();
        view = 'home';
        render();
        toast('Backup restored');
      } catch (e) { toast('That file is not a PisoWise backup'); }
    };
    r.readAsText(file);
  }

  // ---------- Afterpay ----------
  // S.bnpl: plans { id, store, total, n (payments), gap ('fortnight' | 'month'), first (ymd of payment 1), off (ymd: paid off early) }.
  // Each payday can get one "Afterpay" cost (it.bnpl) holding the payments due from that payday up to the next one.
  // it.bnpl = { from: payday, to: next payday, snap: the payments when it was made or last updated, skip: lines deleted by hand }.
  // A change to the plans after that (new plan, deleted plan, paid off early) shows a banner until the cost is updated.
  const AP_GAPS = [['fortnight', 'Every 2 weeks'], ['month', 'Every month']];
  const r2 = v => Math.round(v * 100) / 100;
  // A plan from an uploaded payment list keeps each payment's own date and amount (dates, known); the others follow the plan.
  const apDate = (pl, i) => pl.dates && pl.dates[i] ? parse(pl.dates[i]) : pl.gap === 'month' ? step(parse(pl.first), 'month', i) : addDays(parse(pl.first), 14 * i);
  function apAmt(pl, i) { if (pl.known && pl.known[i] != null) return pl.known[i]; if (pl.each) return pl.each; const c = Math.round(pl.total * 100), base = Math.floor(c / pl.n); return (i === pl.n - 1 ? c - base * (pl.n - 1) : base) / 100; }
  function apPays(pl) {
    const out = [];
    for (let i = 0; i < pl.n; i++) { const d = apDate(pl, i); if (pl.off && d > parse(pl.off)) break; out.push({ k: pl.id + ':' + i, d, i, amt: apAmt(pl, i), pl }); }
    return out;
  }
  const apName = x => `${x.d.getDate()} ${MON[x.d.getMonth()]} · ${x.pl.store.slice(0, 22)} ${x.i + 1} of ${x.pl.n}`;
  const apNext = P => paydays(addDays(P, 1), addDays(P, 400))[0] || null;
  const apItem = P => S.items.find(it => it.bnpl && it.bnpl.from === ymd(P));
  // Payments already in another payday's Afterpay cost: a payment due on a payday stays with the cost that took it first.
  function apTaken(exceptId) { const s = new Set(); for (const it of S.items) if (it.bnpl && it.id !== exceptId) for (const x of it.bnpl.snap) s.add(x.k); return s; }
  // Payments from payday P up to and including the next payday N (so the payday-morning payment is covered).
  function apLines(P, N, exceptId) {
    const taken = apTaken(exceptId), out = [];
    for (const pl of S.bnpl || []) for (const x of apPays(pl)) if (x.d >= P && x.d <= N && !taken.has(x.k)) out.push(x);
    return out.sort((a, b) => (a.d - b.d) || a.pl.store.localeCompare(b.pl.store)).map(x => ({ k: x.k, name: apName(x), amt: x.amt }));
  }
  const apSnap = cur => cur.map(({ k, name, amt }) => ({ k, name, amt }));
  function apBuild(cur, skip) {
    const subs = cur.filter(x => !skip.includes(x.k)).map(x => ({ name: x.name, amt: x.amt, bk: x.k }));
    return { subs, amt: r2(subs.reduce((a, x) => a + x.amt, 0)) };
  }
  function apDiff(it) {
    const cur = apLines(parse(it.bnpl.from), parse(it.bnpl.to), it.id);
    const was = new Map(it.bnpl.snap.map(x => [x.k, x])), now = new Map(cur.map(x => [x.k, x]));
    const added = cur.filter(x => !was.has(x.k)), gone = it.bnpl.snap.filter(x => !now.has(x.k));
    const changed = cur.filter(x => was.has(x.k) && Math.abs(was.get(x.k).amt - x.amt) > 0.004).map(x => ({ k: x.k, name: x.name, amt: x.amt, was: was.get(x.k).amt }));
    return { cur, added, gone, changed, any: added.length + gone.length + changed.length > 0 };
  }
  // Afterpay costs whose plans changed since they were made, newest payday first (only ones not finished yet).
  const apChanged = () => S.items.filter(it => it.bnpl && parse(it.bnpl.to) >= today() && apDiff(it).any).sort((a, b) => a.bnpl.from < b.bnpl.from ? 1 : -1);

  function apAdd(from) {
    const P = parse(from), N = apNext(P);
    if (!N || apItem(P)) return;
    const cur = apLines(P, N), b = apBuild(cur, []);
    const it = { id: S.nextId++, list: 'home', name: 'Afterpay', amt: b.amt, cur: S.profile.home, rep: 'once', due: from, left: 0, paid: [], created: from, subs: b.subs, bnpl: { from, to: ymd(N), snap: apSnap(cur), skip: [] } };
    S.items.push(it);
    openSubs.add(it.id);
    save(); render();
    toast(`Added Afterpay to ${monName(monthKey(P))} · ${money(it.amt, it.cur)}`, { label: 'Undo', run: () => { S.items = S.items.filter(x => x !== it); save(); render(); } });
  }
  function apUpdate(it) {
    const d = apDiff(it), before = JSON.stringify({ subs: it.subs, amt: it.amt, bnpl: it.bnpl });
    const skip = (it.bnpl.skip || []).filter(k => d.cur.some(x => x.k === k)), b = apBuild(d.cur, skip);
    it.subs = b.subs; it.amt = b.amt;
    it.bnpl = Object.assign({}, it.bnpl, { snap: apSnap(d.cur), skip });
    save(); closeDlg(); render();
    toast(`Afterpay updated · ${money(it.amt, it.cur)}`, { label: 'Undo', run: () => { Object.assign(it, JSON.parse(before)); save(); render(); } });
  }
  const apSum = subs => r2(subs.reduce((a, x) => a + x.amt, 0));
  function apLineDel(it, k) {
    const i = (it.subs || []).findIndex(x => x.bk === k);
    if (i < 0) return;
    const was = { subs: it.subs.slice(), amt: it.amt, skip: (it.bnpl.skip || []).slice() }, name = it.subs[i].name;
    it.subs.splice(i, 1); it.amt = apSum(it.subs); it.bnpl.skip = was.skip.concat(k);
    save(); render();
    toast(`Deleted ${name}`, { label: 'Undo', run: () => { it.subs = was.subs; it.amt = was.amt; it.bnpl.skip = was.skip; save(); render(); } });
  }
  function apLineBack(it, k) {
    const x = it.bnpl.snap.find(y => y.k === k);
    if (!x) return;
    const order = it.bnpl.snap.map(y => y.k), at = s => { const i = order.indexOf(s.bk); return i < 0 ? 999 : i; };
    it.bnpl.skip = (it.bnpl.skip || []).filter(y => y !== k);
    it.subs = (it.subs || []).concat({ name: x.name, amt: x.amt, bk: k }).sort((a, b) => at(a) - at(b));
    it.amt = apSum(it.subs);
    save(); render();
  }
  // The open breakdown of an Afterpay cost: × deletes a line, a deleted line stays crossed out with Undo.
  function apSubsHtml(it) {
    const live = (it.subs || []).map(x => `<div class="subl ap-l"><span>${esc(x.name)}</span><span>${money(x.amt, it.cur)}</span>${x.bk ? `<button type="button" class="ap-x" data-act="ap-line-del" data-id="${it.id}" data-k="${esc(x.bk)}" aria-label="Delete ${esc(x.name)}" title="Delete this line">${ICON.x}</button>` : '<span class="ap-x" aria-hidden="true"></span>'}</div>`).join('');
    const gone = (it.bnpl.skip || []).map(k => it.bnpl.snap.find(y => y.k === k)).filter(Boolean).map(x => `<div class="subl ap-l gone"><span>${esc(x.name)}</span><span>${money(x.amt, it.cur)}</span><button type="button" class="ap-undo" data-act="ap-line-back" data-id="${it.id}" data-k="${esc(x.k)}" title="Put this line back">Undo</button></div>`).join('');
    return `<div class="subs">${live}${gone}<div class="subl t ap-l"><span>Total</span><span>${money(it.amt, it.cur)}</span><span class="ap-x" aria-hidden="true"></span></div></div>`;
  }
  // Banner at the top of the Budget screen when the plans changed after an Afterpay cost was made.
  function apBellHtml() {
    const ch = apChanged();
    if (!ch.length) return '';
    const it = ch[0], m = monName(monthKey(parse(it.bnpl.from)));
    return `<div class="ap-bell" role="status"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><span>Afterpay changed since you added ${esc(m)}'s cost${ch.length > 1 ? ` (+${ch.length - 1} more)` : ''}</span><button type="button" class="link" data-act="ap-review" data-id="${it.id}" title="See what changed and update the cost">Review</button></div>`;
  }
  const apUpBtn = cls => `<label class="${cls}" title="Upload a CSV of Afterpay purchases: Store, Total, First payment, Payments, Every. Plans already saved are skipped."><input type="file" class="ap-csv-in" accept=".csv,text/csv,text/plain" hidden>Upload CSV</label>`;
  // Every pay period after this one until the last Afterpay payment: what each takes, and when it's all finished.
  function apAheadHtml(N) {
    const p = S.profile, all = (S.bnpl || []).flatMap(pl => apPays(pl)).filter(x => x.d > N);
    if (!all.length) return '';
    const dd = d => `${d.getDate()} ${MON[d.getMonth()]}`, last = all.reduce((a, x) => x.d > a ? x.d : a, all[0].d), rows = [];
    for (let A = N, g = 0; A < last && g < 36; g++) {
      const B = apNext(A);
      if (!B) break;
      const xs = all.filter(x => x.d > A && x.d <= B).sort((a, b) => a.d - b.d);
      if (xs.length) rows.push(`<div class="ap-ah"><span class="ap-ah-p">${dd(A)} → ${dd(B)}</span><b class="num">${money(r2(xs.reduce((a, x) => a + x.amt, 0)), p.home)}</b><small>${xs.map(x => `${esc(x.pl.store.slice(0, 16))} ${x.i + 1}/${x.pl.n}${x.i === x.pl.n - 1 ? ' (last)' : ''}`).join(' · ')}</small></div>`);
      A = B;
    }
    return `<div class="ap-ahead"><div class="ap-foot"><span>Still owed after ${dd(N)}</span><b>${money(r2(all.reduce((a, x) => a + x.amt, 0)), p.home)} · ${all.length} payment${all.length === 1 ? '' : 's'}</b></div>
      <div class="ap-fin">All Afterpay finished ${esc(shortDate(last))} ${last.getFullYear()}</div>${rows.join('')}</div>`;
  }
  // Card on the Local list: what Afterpay takes from each payday in the month shown.
  function apCardHtml() {
    const p = S.profile, plans = S.bnpl || [];
    if (!plans.length) return `<div class="ap-card ap-empty"><span class="ap-t"><b>Afterpay</b><small>Add your plans to see what to set aside each payday.</small></span><span class="ap-two"><button type="button" class="btn-ghost ap-sm" data-act="ap-plans" title="Add your Afterpay plans one by one">Add a plan</button>${apUpBtn('btn-ghost ap-sm ap-up')}</span></div>`;
    return paydays(vmFrom(), vmTo()).map(P => {
      const N = apNext(P);
      if (!N) return '';
      const it = apItem(P), mon = monName(monthKey(P)), dd = d => `${d.getDate()} ${MON[d.getMonth()]}`;
      const after = plans.flatMap(pl => apPays(pl).filter(x => x.d > N));
      const owed = after.length ? apAheadHtml(N) : '';
      const head = (amt, sub) => `<div class="ap-head"><span class="ap-t"><small>Payday ${dd(P)} · next pay ${dd(N)}</small><b>Afterpay until next pay</b><small>${sub}</small></span><span class="ap-amt">${money(amt, p.home)}</span></div>`;
      const plansBtn = `${apUpBtn('link ap-up-l')}<button type="button" class="link ap-plans" data-act="ap-plans" title="Add, change or delete your Afterpay plans">Plans (${plans.length})</button>`;
      if (it) {
        const ch = apDiff(it).any;
        return `<div class="ap-card"><div class="ap-links">${plansBtn}</div>${head(it.amt, `In ${esc(mon)} costs as “${esc(it.name)}”`)}
          ${ch ? `<div class="ap-warn"><span>Your plans changed since you added it.</span><button type="button" class="link" data-act="ap-review" data-id="${it.id}" title="See what changed and update the cost">Review</button></div>` : `<div class="ap-ok">${ICON.check}<span>Added to ${esc(mon)} costs · up to date</span></div>`}
          ${owed}</div>`;
      }
      const cur = apLines(P, N), tot = r2(cur.reduce((a, x) => a + x.amt, 0));
      const lines = cur.length ? `<div class="ap-lines">${cur.map(x => `<div class="subl"><span>${esc(x.name)}</span><span>${money(x.amt, p.home)}</span></div>`).join('')}</div>` : '';
      return `<div class="ap-card"><div class="ap-links">${plansBtn}</div>${head(tot, cur.length ? `${cur.length} payment${cur.length === 1 ? '' : 's'} to set aside` : 'Nothing due before your next pay')}${lines}
        ${cur.length ? `<button type="button" class="btn ap-btn" data-act="ap-add" data-from="${ymd(P)}" title="Make one cost, Afterpay, in ${esc(mon)} with these payments as its lines">${ICON.plus}Add to ${esc(mon)} costs</button>` : ''}
        ${owed}</div>`;
    }).join('');
  }

  // ----- Afterpay dialogs: plans list + add/edit form, and "what changed" -----
  function apOpenPlans(form) { dlg = { kind: 'ap-plans', form: form || null, sure: null }; renderDlg(); }
  function apNewForm(pl) {
    return pl ? { id: pl.id, store: pl.store, total: String(pl.total), first: pl.first, n: String(pl.n), gap: pl.gap, off: !!pl.off }
      : { id: null, store: '', total: '', first: ymd(today()), n: '4', gap: 'fortnight', off: false };
  }
  function apReadForm() {
    const f = dlg && dlg.form, v = id => { const el = document.getElementById(id); return el ? el.value : null; };
    if (!f) return;
    const s = v('ap-store'), t = v('ap-total'), d = v('ap-first'), n = v('ap-n'), o = document.getElementById('ap-off');
    if (s != null) f.store = s; if (t != null) f.total = t; if (d != null) f.first = d; if (n != null) f.n = n.replace(/[^0-9]/g, '');
    if (o) f.off = o.checked;
  }
  function apPreview(f) {
    const n = Math.floor(num(f.n)), tot = num(f.total);
    if (!(n >= 1) || !(tot > 0) || !f.first) return '';
    const pl = { id: 0, store: '', total: tot, n, gap: f.gap, first: f.first }, last = apDate(pl, n - 1), a = apAmt(pl, 0), z = apAmt(pl, n - 1);
    return `${n} × ${money(a, S.profile.home)}${Math.abs(z - a) > 0.004 ? ` (last ${money(z, S.profile.home)})` : ''} · last payment ${shortDate(last)}`;
  }
  function apPlansHtml() {
    const p = S.profile, f = dlg.form, t = today();
    const rows = (S.bnpl || []).map(pl => {
      const pays = apPays(pl), next = pays.find(x => x.d >= t), sure = dlg.sure === pl.id;
      const end = pays.length ? pays[pays.length - 1].d : parse(pl.first), done = pays.filter(x => x.d < t).length, toGo = r2(pays.filter(x => x.d >= t).reduce((a, x) => a + x.amt, 0));
      const sub = pl.off ? `Paid off ${shortDate(parse(pl.off))}` : next ? `Payment ${next.i + 1} of ${pl.n} next: ${shortDate(next.d)} · ${money(next.amt, p.home)}` : `Finished ${shortDate(end)}`;
      const fin = pl.off || !next ? '' : `<small>${done} paid · ${money(toGo, p.home)} to go · finishes ${esc(shortDate(end))} ${end.getFullYear()}</small>`;
      return `<div class="ap-plan${next || pl.off ? '' : ' ap-done'}"><span class="ap-t"><b>${esc(pl.store)}</b><small>${money(pl.total, p.home)} · ${pl.n} payments ${pl.gap === 'month' ? 'monthly' : 'every 2 weeks'}${pl.order ? ` · order ${esc(pl.order)}` : ''}</small><small class="ap-nx">${esc(sub)}</small>${fin}</span>
        <button type="button" class="x-btn" data-act="ap-edit" data-id="${pl.id}" aria-label="Change ${esc(pl.store)}" title="Change this plan">${ICON.pen}</button>
        <button type="button" class="${sure ? 'btn-danger' : 'btn-ghost'} ap-sm" data-act="ap-del" data-id="${pl.id}" title="${sure ? 'Tap again to delete this plan' : 'Delete this plan'}">${sure ? 'Tap again' : 'Delete'}</button></div>`;
    }).join('');
    const form = f ? `<div class="ap-form">
        <h3>${f.id ? 'Change plan' : 'New plan'}</h3>
        <label class="fld"><span>Store</span><input class="inp" id="ap-store" value="${esc(f.store)}" placeholder="e.g. Kmart" maxlength="40"></label>
        <label class="fld"><span>Total price</span><span class="prefix"><span>${esc(sym(p.home).trim())}</span><input class="num" id="ap-total" inputmode="decimal" value="${esc(f.total)}" placeholder="0.00"></span></label>
        <label class="fld"><span>First payment (the day you bought it)</span><input class="inp" type="date" id="ap-first" value="${esc(f.first)}"></label>
        <label class="inline"><span>Payments</span><input class="inp" id="ap-n" inputmode="numeric" value="${esc(f.n)}" aria-label="Number of payments" title="Afterpay is usually 4"></label>
        <div class="chips">${AP_GAPS.map(([k, l]) => `<button type="button" class="chip" data-act="ap-gap" data-gap="${k}" aria-pressed="${f.gap === k}" title="Payments ${l.toLowerCase()}">${l}</button>`).join('')}</div>
        <small class="ap-prev" id="ap-prev">${esc(apPreview(f))}</small>
        ${f.id ? `<label class="chk chk-box"><input type="checkbox" id="ap-off"${f.off ? ' checked' : ''}><span>I paid it off early<small>Payments after today are taken off.</small></span></label>` : ''}
        <p class="err" id="ap-err" hidden></p>
        <div class="dlg-actions"><button type="button" class="btn-ghost" data-act="ap-form-x">Cancel</button><button type="button" class="btn" data-act="ap-save">${f.id ? 'Save' : 'Add plan'}</button></div>
      </div>` : `<div class="ap-addrow"><button type="button" class="add-btn" data-act="ap-new" style="margin:0" title="Add an Afterpay purchase">${ICON.plus}Add a plan</button>
        <label class="add-btn ap-up" style="margin:0" title="Upload a CSV file with columns Store, Total, First payment, Payments, Every. Plans already saved are skipped."><input type="file" id="ap-csv" accept=".csv,text/csv,text/plain" hidden>Upload CSV</label></div>
        <small class="sub">CSV columns: Store, Total, First payment, Payments (4), Every (2 weeks or month).</small>`;
    return `<div class="overlay" data-act="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
      <div class="dlg-head"><h2 id="dlg-t">Afterpay plans</h2><button type="button" class="x-btn" data-act="cancel" aria-label="Close" title="Close">${ICON.x}</button></div>
      ${rows ? `<div class="ap-plist">${rows}</div>` : '<p class="sub">No plans yet. Add each Afterpay purchase once — PisoWise works out every payment.</p>'}
      ${form}
    </div></div>`;
  }
  function apSavePlan() {
    apReadForm();
    const f = dlg.form, err = document.getElementById('ap-err'), fail = m => { err.textContent = m; err.hidden = false; };
    const n = Math.floor(num(f.n)), total = r2(num(f.total));
    if (!f.store.trim()) return fail('Please enter the store.');
    if (!(total > 0)) return fail('Please enter the total price.');
    if (!f.first) return fail('Please pick the first payment date.');
    if (!(n >= 1 && n <= 48)) return fail('Please enter 1 to 48 payments.');
    if (!S.bnpl) S.bnpl = [];
    const old = f.id ? S.bnpl.find(x => x.id === f.id) : null;
    const pl = { id: f.id || S.nextId++, store: f.store.trim(), total, n, gap: f.gap, first: f.first };
    if (old && old.order) pl.order = old.order;
    if (old && old.known && old.n === n && old.gap === f.gap && old.first === f.first && Math.abs(old.total - total) < 0.005) { pl.known = old.known; pl.dates = old.dates; pl.each = old.each; }
    if (f.off) pl.off = old && old.off ? old.off : ymd(today());
    if (old) S.bnpl[S.bnpl.indexOf(old)] = pl; else S.bnpl.push(pl);
    save(); render();
    dlg.form = null; renderDlg();
    toast(old ? `Saved ${pl.store}` : `Added ${pl.store}`);
  }
  function apDelPlan(id) {
    if (dlg.sure !== id) { dlg.sure = id; renderDlg(); return; }
    const i = S.bnpl.findIndex(x => x.id === id);
    if (i < 0) return;
    addPoint('Before deleting Afterpay ' + S.bnpl[i].store);
    const [gone] = S.bnpl.splice(i, 1);
    dlg.sure = null;
    if (dlg.form && dlg.form.id === id) dlg.form = null;
    save(); render(); renderDlg();
    toast(`Deleted ${gone.store}`, { label: 'Undo', run: () => { S.bnpl.splice(i, 0, gone); save(); render(); if (dlg && dlg.kind === 'ap-plans') renderDlg(); } });
  }
  function apDiffHtml() {
    const p = S.profile, it = S.items.find(x => x.id === dlg.id);
    if (!it || !it.bnpl) return '';
    const d = apDiff(it), skip = (it.bnpl.skip || []).filter(k => d.cur.some(x => x.k === k)), nw = apBuild(d.cur, skip).amt;
    const touched = new Set([...d.added, ...d.changed].map(x => x.k)), same = d.cur.filter(x => !touched.has(x.k));
    const row = (cls, sign, text, amt) => `<div class="ap-d ${cls}"><b aria-hidden="true">${sign}</b><span>${text}</span><b class="num">${amt}</b></div>`;
    const rows = d.added.map(x => row('add', '+', `<b>New:</b> ${esc(x.name)}`, money(x.amt, p.home)))
      + d.gone.map(x => row('rm', '−', `<b>Gone:</b> ${esc(x.name)}`, `<s>${money(x.amt, p.home)}</s>`))
      + d.changed.map(x => row('chg', '~', `<b>Changed:</b> ${esc(x.name)}`, `${money(x.was, p.home)} → ${money(x.amt, p.home)}`))
      + (same.length ? row('', '', `${same.length} line${same.length === 1 ? '' : 's'} unchanged`, money(r2(same.reduce((a, x) => a + x.amt, 0)), p.home)) : '');
    return `<div class="overlay" data-act="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
      <div class="dlg-head"><h2 id="dlg-t">Update ${esc(monName(monthKey(parse(it.bnpl.from))))}'s Afterpay?</h2></div>
      <p class="sub">Your Afterpay plans changed after you added this cost.${skip.length ? ` Lines you deleted stay deleted.` : ''}</p>
      <div class="ap-diff">${rows}</div>
      <div class="ap-tot"><span>Cost total</span><span class="num">${Math.abs(nw - it.amt) > 0.004 ? `<s>${money(it.amt, p.home)}</s> ` : ''}<b>${money(nw, p.home)}</b></span></div>
      <div class="dlg-actions"><button type="button" class="btn-ghost" data-act="cancel" title="Keep the banner until you update it">Not now</button><button type="button" class="btn" data-act="ap-apply" title="Rewrite the cost's lines from your plans">Update cost</button></div>
    </div></div>`;
  }

  // ----- Afterpay plans from a CSV file (e.g. made by Gemini from Afterpay's emails) -----
  // Columns, any order, header names matched loosely: Store, Total, First payment (date), Payments (default 4), Every (2 weeks / month).
  // A row matching a plan already saved (same store, total and first date) is skipped, so the same file can be uploaded again.
  function csvRows(text) {
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',' || ch === ';' || ch === '\t') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.map(r => r.map(c => c.trim())).filter(r => r.some(c => c));
  }
  function csvDate(v) {
    v = String(v || '').trim();
    let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return ymd(new Date(+m[1], m[2] - 1, +m[3]));
    m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/); // day/month/year (Australian order)
    if (m) return ymd(new Date(m[3].length === 2 ? 2000 + +m[3] : +m[3], m[2] - 1, +m[1]));
    m = v.match(/^(?:[A-Za-z]{3,9},?\s+)?(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})$/); // 20 Nov 2026
    if (m) { const mi = MON.findIndex(x => m[2].toLowerCase().startsWith(x.toLowerCase())); if (mi >= 0) return ymd(new Date(+m[3], mi, +m[1])); }
    m = v.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/); // Nov 20, 2026
    if (m) { const mi = MON.findIndex(x => m[1].toLowerCase().startsWith(x.toLowerCase())); if (mi >= 0) return ymd(new Date(+m[3], mi, +m[2])); }
    return null;
  }
  // Two kinds of file:
  //  · one row per purchase: Store, Total, First payment, Payments, Every
  //  · one row per payment (as Gemini makes from Afterpay's emails): Due Date, Merchant, Plan, Order #, Instalment ("2 of 4"), Amount
  //    Rows of the same order make one plan; the payments in the file keep their own dates and amounts, the rest are
  //    worked out (same amount, every 2 weeks for Pay in 4, monthly for Pay Monthly), so the plan runs to its last payment.
  function apImportCsv(text) {
    const rows = csvRows(text.replace(/^﻿/, ''));
    if (rows.length < 2) return { error: 'That file has no rows under the header.' };
    const h = rows[0].map(x => x.toLowerCase().replace(/\s+/g, ' ').trim());
    const find = (...names) => { for (const n of names) { const i = h.indexOf(n); if (i >= 0) return i; } for (const n of names) { const i = h.findIndex(x => x.includes(n)); if (i >= 0) return i; } return -1; };
    const ofN = v => { const m = String(v || '').match(/(\d+)\s*(?:of|\/)\s*(\d+)/i); return m ? { k: +m[1], n: +m[2] } : null; };
    const isTotalRow = r => r.some(c => /^(grand )?total$/i.test(c));
    if (!S.bnpl) S.bnpl = [];
    let added = 0, same = 0, updated = 0, bad = 0, fixed = 0;
    const cI = find('instalment', 'installment', 'payment number', 'payment no');
    if (cI >= 0 && rows.slice(1).some(r => ofN(r[cI]))) {
      const cM = find('merchant', 'store', 'shop', 'retailer'), cO = find('order #', 'order number', 'order id', 'order no', 'order');
      const cA = find('amount', 'instalment amount', 'payment amount'), cD = find('due date', 'date', 'due'), cP = find('plan', 'type');
      if (cM < 0 || cA < 0 || cD < 0) return { error: 'The file needs Merchant, Instalment, Amount and Due Date columns.' };
      const groups = new Map();
      for (const r of rows.slice(1)) {
        if (isTotalRow(r)) continue;
        const kn = ofN(r[cI]), store = (r[cM] || '').slice(0, 40), d = csvDate(r[cD]), amt = r2(num(r[cA])), order = cO >= 0 ? String(r[cO] || '').replace(/[^0-9A-Za-z-]/g, '') : '';
        if (!kn || !store || !d || !(amt > 0) || kn.k < 1 || kn.k > kn.n || kn.n > 48) { bad++; continue; }
        const key = order || store.toLowerCase() + '|' + kn.n;
        const g = groups.get(key) || { store, order, n: kn.n, gap: cP >= 0 && /month/i.test(r[cP] || '') ? 'month' : 'fortnight', pays: {} };
        g.pays[kn.k - 1] = { d, amt };
        groups.set(key, g);
      }
      for (const g of groups.values()) {
        // A plan from an earlier upload that took the order number as its price: replace it.
        if (g.order) S.bnpl = S.bnpl.filter(x => { const broke = !x.order && String(Math.round(x.total)) === g.order; if (broke) fixed++; return !broke; });
        const old = S.bnpl.find(x => g.order ? x.order === g.order : !x.order && x.store.toLowerCase() === g.store.toLowerCase() && x.n === g.n && x.known);
        const known = Object.assign({}, old && old.known), dates = Object.assign({}, old && old.dates);
        for (const [i, x] of Object.entries(g.pays)) { known[i] = x.amt; dates[i] = x.d; }
        const idx = Object.keys(dates).map(Number).sort((a, b) => a - b), i0 = idx[0], d0 = parse(dates[i0]);
        const first = ymd(g.gap === 'month' ? step(d0, 'month', -i0) : addDays(d0, -14 * i0));
        const notLast = idx.filter(i => i < g.n - 1), each = known[notLast.length ? notLast[notLast.length - 1] : idx[idx.length - 1]];
        const pl = { id: old ? old.id : S.nextId++, store: g.store, n: g.n, gap: g.gap, first, each, known, dates };
        if (g.order) pl.order = g.order;
        if (old && old.off) pl.off = old.off;
        pl.total = r2(Array.from({ length: g.n }, (_, i) => known[i] != null ? known[i] : each).reduce((a, v) => a + v, 0));
        if (!old) { S.bnpl.push(pl); added++; continue; }
        const was = JSON.stringify([old.n, old.gap, old.first, old.total, old.known, old.dates]);
        S.bnpl[S.bnpl.indexOf(old)] = pl;
        if (was === JSON.stringify([pl.n, pl.gap, pl.first, pl.total, pl.known, pl.dates])) same++; else updated++;
      }
      return { added, same, updated, bad, fixed };
    }
    const cS = find('store', 'merchant', 'shop', 'retailer', 'name'), cT = find('total', 'price', 'order total', 'purchase amount', 'amount');
    const cD = find('first payment', 'first', 'purchase date', 'date', 'bought', 'start');
    const cN = find('payments', 'number of payments', 'instalments', 'installments', 'count'), cE = find('every', 'frequency', 'freq', 'schedule', 'interval', 'plan');
    if (cS < 0 || cT < 0 || cD < 0) return { error: 'The file needs Store, Total and First payment columns.' };
    for (const r of rows.slice(1)) {
      if (isTotalRow(r)) continue;
      const store = (r[cS] || '').slice(0, 40), total = r2(num(r[cT])), first = csvDate(r[cD]);
      const nv = cN >= 0 ? r[cN] : '', kn = ofN(nv), n = kn ? kn.n : /^\s*\d+\s*$/.test(nv || '') ? +nv : 4;
      const gap = cE >= 0 && /month/i.test(r[cE] || '') ? 'month' : 'fortnight';
      if (!store || !(total > 0) || !first || !(n >= 1 && n <= 48)) { bad++; continue; }
      if (S.bnpl.some(x => x.store.toLowerCase() === store.toLowerCase() && Math.abs(x.total - total) < 0.005 && x.first === first)) { same++; continue; }
      S.bnpl.push({ id: S.nextId++, store, total, n, gap, first });
      added++;
    }
    return { added, same, updated, bad, fixed };
  }
  function apCsvFile(file) {
    const rd = new FileReader();
    rd.onload = () => {
      addPoint('Before uploading Afterpay plans');
      const res = apImportCsv(String(rd.result || ''));
      if (res.error) { toast(res.error); return; }
      if (res.added || res.updated || res.fixed) { save(); render(); }
      if (dlg && dlg.kind === 'ap-plans') renderDlg();
      const parts = [res.added ? `Added ${res.added} plan${res.added === 1 ? '' : 's'}` : 'No new plans', res.updated ? `${res.updated} updated` : '', res.fixed ? `${res.fixed} wrong plan${res.fixed === 1 ? '' : 's'} replaced` : '', res.same ? `${res.same} already there` : '', res.bad ? `${res.bad} row${res.bad === 1 ? '' : 's'} skipped (missing store, total or date)` : ''].filter(Boolean);
      if (res.added || res.updated || res.fixed) { const ends = (S.bnpl || []).map(pl => { const ps = apPays(pl); return ps.length ? ps[ps.length - 1].d : null; }).filter(Boolean); if (ends.length) parts.push('all finished ' + shortDate(new Date(Math.max(...ends))) + ' ' + new Date(Math.max(...ends)).getFullYear()); }
      toast(parts.join(' · '));
    };
    rd.readAsText(file);
  }

  // ---------- events ----------
  $app.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'nav') { view = b.dataset.view; confirmReset = false; confirmRp = null; render(); window.scrollTo(0, 0); }
    else if (act === 'rp') { const at = +b.dataset.at; if (confirmRp === at) restorePoint(at); else { confirmRp = at; render(); } }
    else if (act === 'tab') { tab = b.dataset.tab; render(); }
    else if (act === 'rate') refreshRate(true);
    else if (act === 'add') openEditor(null, b.dataset.list);
    else if (act === 'paid') togglePaid(+b.dataset.id);
    else if (act === 'pay') openPay();
    else if (act === 'sent') openSent();
    else if (act === 'subs') { const id = +b.dataset.id; if (openSubs.has(id)) openSubs.delete(id); else openSubs.add(id); render(); }
    else if (act === 'count') {
      const it = S.items.find(x => x.id === +b.dataset.id), mk = vm();
      if (!it) return;
      const before = it.count ? Object.assign({}, it.count) : null, on = !counted(it, mk);
      it.count = Object.assign({}, it.count);
      if (on === !it.optional) delete it.count[mk]; else it.count[mk] = on;
      if (!Object.keys(it.count).length) delete it.count;
      save(); render();
      toast(`${it.name}: ${on ? 'counted' : 'not counted'} in ${MON_LONG[keyToDate(mk).getMonth()]}`, { label: 'Undo', run: () => { if (before) it.count = before; else delete it.count; save(); render(); } });
    }
    else if (act === 'mon') { const d = keyToDate(vm()), k = monthKey(new Date(d.getFullYear(), d.getMonth() + +b.dataset.d, 1)); viewMonth = k === monthKey(today()) ? null : k; saveDraft = null; render(); }
    else if (act === 'mon-now') { viewMonth = null; saveDraft = null; render(); }
    else if (act === 'saveq') saveQuick(+b.dataset.q);
    else if (act === 'save-open') { const lo = Math.max(summary(vmFrom(), vmTo(), vmRate()).saved, 0), v = Math.min(Math.round(num(saveDraft || '0') * 100) / 100, lo); if (v > 0) { dlg = { kind: 'save', amt: v, done: false }; renderDlg(); } }
    else if (act === 'unsave') { const mk = vm(), was = S.savings[mk]; delete S.savings[mk]; saveDraft = String(was.amt); save(); render(); toast('Savings unmarked', { label: 'Undo', run: () => { S.savings[mk] = was; saveDraft = null; save(); render(); } }); }
    else if (act === 'ap-add') apAdd(b.dataset.from);
    else if (act === 'ap-plans') apOpenPlans();
    else if (act === 'ap-review') { dlg = { kind: 'ap-diff', id: +b.dataset.id }; renderDlg(); }
    else if (act === 'ap-line-del' || act === 'ap-line-back') { const it = S.items.find(x => x.id === +b.dataset.id); if (it && it.bnpl) (act === 'ap-line-del' ? apLineDel : apLineBack)(it, b.dataset.k); }
    else if (act === 'edit') { const it = S.items.find(x => x.id === +b.dataset.id); if (it) openEditor(it); }
    else if (act === 'month') { openMonth = openMonth === b.dataset.key && b.classList.contains('month-btn') ? '-' : b.dataset.key; render(); }
    else if (act === 'ratemode') { document.querySelector('#setup [name="ratemode"]').value = b.dataset.mode; syncSetup(); }
    else if (act === 'mode') { document.querySelector('#setup [name="mode"]').value = b.dataset.mode; syncSetup(); }
    else if (act === 'freq') { document.querySelector('#setup [name="freq"]').value = b.dataset.freq; syncSetup(); }
    else if (act === 'backup') backup();
    else if (act === 'signout') signOut();
    else if (act === 'auth-mode') { const em = document.querySelector('#auth [name="email"]'), v = em ? em.value : ''; authMode = b.dataset.mode; authMsg = null; render(); refill(v); }
    else if (act === 'peek') { const i = b.previousElementSibling, show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.textContent = show ? 'Hide' : 'Show'; b.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); }
    else if (act === 'reset') {
      if (!confirmReset) { confirmReset = true; render(); return; }
      clearTimeout(pushTimer);
      S = blank(); meta = { rev: 0, dirty: false, editedAt: 0 }; confirmReset = false;
      try { localStorage.removeItem(userKey()); } catch (err) { /* ignore */ }
      Cloud.remove().then(() => toast('Your budget was deleted'), () => toast('Deleted here — could not reach your account, so it may come back. Try again online.'));
      view = 'setup'; render();
    }
  });
  $app.addEventListener('input', e => {
    if (e.target.id === 'save-amt') {
      saveDraft = e.target.value;
      const pos = e.target.selectionStart, y = window.scrollY;
      render();
      document.querySelectorAll('#save-amt').forEach(i => { if (i.offsetParent) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (err) { /* ignore */ } } });
      window.scrollTo(0, y);
      return;
    }
    if (e.target.closest('#setup')) syncSetup();
  });
  $app.addEventListener('change', e => {
    if (e.target.classList.contains('ap-csv-in') && e.target.files[0]) { apCsvFile(e.target.files[0]); e.target.value = ''; return; }
    if (e.target.matches('[data-act="restore"]') && e.target.files[0]) restore(e.target.files[0]);
    else if (e.target.closest('#setup')) syncSetup();
  });
  $app.addEventListener('submit', e => { e.preventDefault(); if (e.target.id === 'auth') { if (!authBusy) submitAuth(); } else submitSetup(); });

  $modal.addEventListener('click', e => {
    if (dlg) {
      if (e.target.matches('[data-act="scrim"]')) return closeDlg();
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      const act = b.dataset.act;
      if (dlg.kind === 'ap-plans' && act !== 'cancel') {
        if (act === 'ap-new') { dlg.form = apNewForm(); dlg.sure = null; renderDlg(); const el = document.getElementById('ap-store'); if (el) el.focus(); }
        else if (act === 'ap-edit') { const pl = S.bnpl.find(x => x.id === +b.dataset.id); if (pl) { dlg.form = apNewForm(pl); dlg.sure = null; renderDlg(); } }
        else if (act === 'ap-gap') { apReadForm(); dlg.form.gap = b.dataset.gap; renderDlg(); }
        else if (act === 'ap-form-x') { dlg.form = null; renderDlg(); }
        else if (act === 'ap-save') apSavePlan();
        else if (act === 'ap-del') apDelPlan(+b.dataset.id);
        return;
      }
      if (act === 'ap-apply') { const it = S.items.find(x => x.id === dlg.id); if (it) apUpdate(it); return; }
      if (act === 'cancel') closeDlg();
      else if (act === 'sent-save') saveSent();
      else if (act === 'sent-del') { const mk = vm(), was = S.sent[mk]; delete S.sent[mk]; save(); closeDlg(); render(); toast('Money sent removed', { label: 'Undo', run: () => { S.sent[mk] = was; save(); render(); } }); }
      else if (act === 'save-ok') confirmSave();
      return;
    }
    if (payDraft) {
      if (e.target.matches('[data-act="scrim"]')) return closePay();
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'cancel') closePay();
      else if (act === 'save-pay') savePay();
      else if (act === 'x-add') {
        payDraft.extras.push({ name: '', amt: '' }); renderPay();
        const el = document.querySelector(`[data-xname="${payDraft.extras.length - 1}"]`); if (el) el.focus();
      }
      else if (act === 'x-del') { payDraft.extras.splice(+b.dataset.i, 1); renderPay(); }
      else if (act === 'p-prev' || act === 'p-next') {
        if (!savePay(true)) return;
        const f = keyToDate(payDraft.key);
        openPay(monthKey(new Date(f.getFullYear(), f.getMonth() + (act === 'p-next' ? 1 : -1), 1)));
        render();
      }
      return;
    }
    if (!draft) return;
    if (e.target.matches('[data-act="scrim"]')) return closeEditor();
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'cancel') closeEditor();
    else if (act === 'save-item') saveItem();
    else if (act === 'remove') { draft.confirmRm = true; renderEditor(); const el = document.querySelector('[data-act="rm-no"]'); if (el) el.focus(); }
    else if (act === 'rm-no') { draft.confirmRm = false; renderEditor(); }
    else if (act === 'rm-yes') removeItem();
    else if (act === 'lst') { draft.list = b.dataset.list; renderEditor(); }
    else if (act === 'cur') { switchCur(b.dataset.cur); renderEditor(); }
    else if (act === 'rep') { draft.rep = b.dataset.rep; renderEditor(); }
    else if (act === 'cnt') { draft.countNow = b.dataset.on === '1'; renderEditor(); }
    else if (act === 'sub-add') { draft.subs.push({ name: '', amt: '' }); renderEditor(); const el = document.querySelector(`[data-subn="${draft.subs.length - 1}"]`); if (el) el.focus(); }
    else if (act === 'sub-del') { draft.subs.splice(+b.dataset.i, 1); renderEditor(); }
  });
  $modal.addEventListener('input', e => {
    if (dlg) {
      if (dlg.kind === 'ap-plans' && dlg.form) { apReadForm(); const pv = document.getElementById('ap-prev'); if (pv) pv.textContent = apPreview(dlg.form); return; }
      if (e.target.id === 'sent-amt') { dlg.amt = e.target.value; const c = document.getElementById('sent-conv'); if (c) c.innerHTML = sentConv(); }
      return;
    }
    if (payDraft) {
      const t = e.target, ds = t.dataset;
      if (ds.pay != null) payDraft.pays[+ds.pay].amt = t.value;
      else if (ds.xname != null) payDraft.extras[+ds.xname].name = t.value;
      else if (ds.xamt != null) payDraft.extras[+ds.xamt].amt = t.value;
      const tot = document.getElementById('p-total');
      if (tot) tot.textContent = money(payTotal(), S.profile.home);
      return;
    }
    if (!draft) return;
    const id = e.target.id;
    if (id === 'd-name') draft.name = e.target.value;
    else if (id === 'd-amt') draft.amt = e.target.value;
    else if (id === 'd-due') draft.due = e.target.value;
    else if (id === 'd-left') draft.left = e.target.value.replace(/[^0-9]/g, '');
    else if (id === 'd-every') draft.every = e.target.value.replace(/[^0-9]/g, '');
    else if (e.target.dataset.subn != null) draft.subs[+e.target.dataset.subn].name = e.target.value;
    else if (e.target.dataset.suba != null) { draft.subs[+e.target.dataset.suba].amt = e.target.value; const a = document.getElementById('d-amt'); if (a) a.value = subsTotal().toFixed(2); }
    updateEditorTexts();
  });
  $modal.addEventListener('change', e => {
    if (dlg) {
      if (e.target.id === 'ap-csv' && e.target.files[0]) { apCsvFile(e.target.files[0]); return; }
      if (e.target.id === 'sent-tick') dlg.tick = e.target.checked;
      if (e.target.id === 'save-done') { dlg.done = e.target.checked; const ok = document.querySelector('[data-act="save-ok"]'); if (ok) ok.disabled = !dlg.done; }
      return;
    }
    if (!draft) return;
    if (e.target.id === 'd-due') { draft.due = e.target.value; updateEditorTexts(); }
    if (e.target.id === 'd-brk') {
      if (e.target.checked) draft.subs = [{ name: draft.name.trim(), amt: hasNum(draft.amt) ? String(num(draft.amt)) : '' }];
      else { draft.amt = subsTotal().toFixed(2); draft.subs = null; }
      renderEditor();
      const el = document.querySelector('[data-suba="0"]'); if (el && e.target.checked) el.focus();
    }
    if (e.target.id === 'd-opt') { const was = draft.optional; draft.optional = e.target.checked; if (draft.countNow === !was) draft.countNow = !draft.optional; renderEditor(); }
    if (e.target.id === 'd-debt') {
      draft.left = e.target.checked ? '12' : '';
      renderEditor();
      const l = document.getElementById('d-left');
      if (l) l.focus();
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (dlg) closeDlg(); else if (draft) closeEditor(); else if (payDraft) closePay(); } });
  document.addEventListener('visibilitychange', () => {
    if (!Cloud.user) return;
    if (document.visibilityState === 'hidden') { if (meta.dirty) push(); return; }
    rollover();
    if (!draft && !payDraft && !dlg && view !== 'setup' && view !== 'auth') render();
    pull().then(() => refreshRate(false));
  });
  window.addEventListener('online', () => { if (Cloud.user) { if (meta.dirty) push(); else pull(); } });

  // ---------- start ----------
  (async () => {
    let link = null;
    try { link = await Cloud.fromLink(); } catch (e) { link = { error: e.offline ? 'You seem to be offline. Try the link again when connected.' : 'That link did not work. Please ask for a new one.' }; }
    if (link && link.error) { view = 'auth'; authMsg = { text: link.error }; render(); return; }
    if (!Cloud.user) { view = 'auth'; render(); return; }
    if (link && link.type === 'recovery') { view = 'auth'; authMode = 'reset'; render(); return; }
    enter(link ? 'Email confirmed — welcome!' : '');
  })();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
