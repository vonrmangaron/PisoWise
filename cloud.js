'use strict';
// PisoWise accounts: Supabase sign-in + one saved budget per account.
// Plain fetch calls to Supabase's auth and data APIs — no library to load.
// The URL and publishable key are public by design; Row Level Security (supabase.sql) keeps each budget private.
window.Cloud = (() => {
  const SUPABASE_URL = 'https://qfzizbuypkatlzxtmnjc.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_5xFpInfoGZrIypnJudmolQ_pjcdHf3A';
  const SESSION_KEY = 'budgetwise.session';

  const configured = () => !/YOUR-/.test(SUPABASE_URL + SUPABASE_KEY);
  let session = readSession();

  function readSession() {
    try { const s = JSON.parse(localStorage.getItem(SESSION_KEY)); return s && s.access_token && s.user ? s : null; } catch (e) { return null; }
  }
  function keep(s) {
    session = s;
    try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch (e) { /* storage blocked */ }
  }
  function fromAuth(j) {
    return {
      access_token: j.access_token, refresh_token: j.refresh_token,
      expires_at: j.expires_at ? j.expires_at * 1000 : Date.now() + (j.expires_in || 3600) * 1000,
      user: { id: j.user.id, email: j.user.email }
    };
  }

  // Friendly messages for the errors people actually hit.
  function message(j, status) {
    const raw = String((j && (j.msg || j.message || j.error_description || j.error)) || '');
    const code = j && (j.error_code || j.code);
    if (code === 'invalid_credentials' || /invalid login/i.test(raw)) return 'Wrong email or password.';
    if (code === 'email_not_confirmed' || /not confirmed/i.test(raw)) return 'Please confirm your email first — check your inbox for the link.';
    if (code === 'user_already_exists' || /already registered/i.test(raw)) return 'There is already an account with this email. Sign in instead.';
    if (code === 'weak_password' || /password should/i.test(raw)) return 'Please use a longer password — at least 8 characters.';
    if (code === 'over_email_send_rate_limit' || status === 429) return 'Too many tries. Please wait a minute and try again.';
    if (/email.*invalid|invalid.*email/i.test(raw)) return 'Please check the email address.';
    return raw || 'Something went wrong. Please try again.';
  }

  async function call(path, { method = 'GET', body, token, headers = {} } = {}) {
    let r;
    try {
      r = await fetch(SUPABASE_URL + path, {
        method, cache: 'no-store',
        headers: Object.assign({ apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}, headers),
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      const err = new Error('You seem to be offline.'); err.offline = true; throw err;
    }
    const text = await r.text();
    let j = null;
    try { j = text ? JSON.parse(text) : null; } catch (e) { /* not json */ }
    if (!r.ok) { const err = new Error(message(j, r.status)); err.status = r.status; throw err; }
    return j;
  }

  async function signIn(email, password) {
    const j = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
    keep(fromAuth(j));
    return session;
  }
  // Returns the session, or null when the project asks people to confirm their email first.
  async function signUp(email, password) {
    const j = await call('/auth/v1/signup?redirect_to=' + encodeURIComponent(redirect()), { method: 'POST', body: { email, password } });
    if (j && j.access_token) { keep(fromAuth(j)); return session; }
    return null;
  }
  async function forgot(email) {
    await call('/auth/v1/recover?redirect_to=' + encodeURIComponent(redirect()), { method: 'POST', body: { email } });
  }
  async function setPassword(password) {
    const t = await token();
    await call('/auth/v1/user', { method: 'PUT', body: { password }, token: t });
  }
  function signOut() {
    const s = session;
    keep(null);
    if (s) call('/auth/v1/logout', { method: 'POST', token: s.access_token }).catch(() => {});
  }
  const redirect = () => location.origin + location.pathname;

  async function refresh() {
    if (!session) throw Object.assign(new Error('Signed out'), { status: 401 });
    try {
      const j = await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } });
      keep(fromAuth(j));
    } catch (e) {
      if (!e.offline) keep(null); // refresh token no longer valid → sign in again
      throw e;
    }
  }
  async function token() {
    if (!session) throw Object.assign(new Error('Signed out'), { status: 401 });
    if (session.expires_at - 60e3 < Date.now()) await refresh();
    return session.access_token;
  }
  async function authed(path, opts = {}) {
    try { return await call(path, Object.assign({}, opts, { token: await token() })); } catch (e) {
      if (e.status !== 401 || !session) throw e;
      await refresh();
      return call(path, Object.assign({}, opts, { token: session.access_token }));
    }
  }

  // Links from the confirm and reset emails land back here with the session in the address (#access_token=…).
  async function fromLink() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (!h.get('access_token') && !h.get('error') && !h.get('error_description')) return null;
    history.replaceState(null, '', location.pathname + location.search);
    if (h.get('error') || h.get('error_description')) {
      return { error: /expired|invalid/i.test(h.get('error_description') || '') ? 'That link has expired. Please ask for a new one.' : (h.get('error_description') || 'That link did not work.').replace(/\+/g, ' ') };
    }
    const at = h.get('access_token');
    const user = await call('/auth/v1/user', { token: at });
    keep({
      access_token: at, refresh_token: h.get('refresh_token'),
      expires_at: h.get('expires_at') ? +h.get('expires_at') * 1000 : Date.now() + (+h.get('expires_in') || 3600) * 1000,
      user: { id: user.id, email: user.email }
    });
    return { type: h.get('type') || 'signup' };
  }

  // ---- the budget row ----
  async function load() {
    const rows = await authed('/rest/v1/budgets?select=data,updated_at&limit=1');
    return rows && rows[0] ? { data: rows[0].data, at: Date.parse(rows[0].updated_at) } : null;
  }
  async function store(data) {
    const at = new Date().toISOString();
    await authed('/rest/v1/budgets?on_conflict=user_id', {
      method: 'POST', body: { user_id: session.user.id, data, updated_at: at },
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
    });
    return Date.parse(at);
  }
  async function remove() {
    await authed('/rest/v1/budgets?user_id=eq.' + encodeURIComponent(session.user.id), { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  }

  return {
    configured, signIn, signUp, forgot, setPassword, signOut, fromLink, load, store, remove,
    get user() { return session ? session.user : null; }
  };
})();
