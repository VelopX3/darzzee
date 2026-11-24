// In-memory fake of the Supabase Auth (GoTrue) + PostgREST endpoints the app uses.
// Installed with Playwright route interception for https://testproj.supabase.co/**.
// This lets us exercise the real client code paths (supabase-js, state handling,
// redirects, persistence) without the production backend, which this container
// cannot reach.

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
export function fakeJwt(user, ttl = 3600) {
  const now = Math.floor(Date.now() / 1000);
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({
    sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated',
    exp: now + ttl, iat: now, session_id: 'sess-' + user.id
  })}.c2lnbmF0dXJl`;
}

export function makeUser(email, meta = {}, id) {
  return {
    id: id || '11111111-2222-3333-4444-' + Math.random().toString(16).slice(2, 14).padEnd(12, '0'),
    aud: 'authenticated', role: 'authenticated', email,
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: meta, identities: [{ id: 'i1', provider: 'email' }],
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };
}

export function fakeSession(user = makeUser('test.user@example.com', { full_name: 'TEST USER', phone: '9876543210' }, '11111111-2222-3333-4444-555555555555')) {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: fakeJwt(user), token_type: 'bearer', expires_in: 3600,
    expires_at: now + 3600, refresh_token: 'refresh-' + user.id, user
  };
}

export function createBackend(opts = {}) {
  const state = {
    users: {}, // email -> { user, password, confirmed }
    profiles: {}, // id -> row
    bookings: [],
    applications: [],
    subscribers: [],
    requests: [], // log of {method, path}
    confirmEmail: opts.confirmEmail ?? true,
    loginDelayMs: opts.loginDelayMs ?? 0,
    failBookingsTable: opts.failBookingsTable ?? false,
    sessions: {} // access_token -> user id
  };
  const seed = (email, password, meta = {}, confirmed = true) => {
    const user = makeUser(email, meta);
    state.users[email.toLowerCase()] = { user, password, confirmed };
    return user;
  };
  const userByToken = (req) => {
    const auth = req.headers()['authorization'] || '';
    const tok = auth.replace(/^Bearer /, '');
    const id = state.sessions[tok];
    if (!id) {
      // Accept seeded fake sessions whose JWT sub we can decode.
      try {
        const payload = JSON.parse(Buffer.from(tok.split('.')[1], 'base64url').toString());
        const found = Object.values(state.users).find((u) => u.user.id === payload.sub);
        if (found) return found.user;
        if (payload.sub && payload.email) return makeUser(payload.email, {}, payload.sub);
      } catch { /* anon key */ }
      return null;
    }
    return Object.values(state.users).find((u) => u.user.id === id)?.user || null;
  };
  const issue = (user) => {
    const s = fakeSession(user);
    state.sessions[s.access_token] = user.id;
    return s;
  };

  async function handle(route) {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const p = url.pathname;
    state.requests.push({ method, path: p + url.search });
    const json = (status, body) => route.fulfill({
      status, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' },
      body: body === undefined ? '' : JSON.stringify(body)
    });
    if (method === 'OPTIONS') return json(200, {});
    let body = {};
    try { body = req.postDataJSON() || {}; } catch { body = {}; }

    // ---------------- AUTH ----------------
    if (p === '/auth/v1/token') {
      const grant = url.searchParams.get('grant_type');
      if (grant === 'password') {
        if (state.loginDelayMs) await new Promise((r) => setTimeout(r, state.loginDelayMs));
        const rec = state.users[(body.email || '').toLowerCase()];
        if (!rec || rec.password !== body.password) return json(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
        if (!rec.confirmed) return json(400, { code: 400, error_code: 'email_not_confirmed', msg: 'Email not confirmed' });
        return json(200, issue(rec.user));
      }
      if (grant === 'refresh_token') {
        const rec = Object.values(state.users).find((u) => 'refresh-' + u.user.id === body.refresh_token);
        if (!rec) return json(400, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
        return json(200, issue(rec.user));
      }
    }
    if (p === '/auth/v1/signup') {
      const email = (body.email || '').toLowerCase();
      if (state.users[email]) {
        // GoTrue obfuscates existing users when confirmation is on: user with empty identities.
        const u = { ...makeUser(email, body.data || {}), identities: [] };
        return json(200, u);
      }
      const user = seed(email, body.password, body.data || {}, !state.confirmEmail);
      if (state.confirmEmail) return json(200, { ...user, email_confirmed_at: null, confirmation_sent_at: new Date().toISOString() });
      return json(200, issue(user));
    }
    if (p === '/auth/v1/user') {
      const user = userByToken(req);
      if (!user) return json(401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' });
      if (method === 'PUT') {
        if (body.data) user.user_metadata = { ...body.data };
        if (body.password) {
          const rec = Object.values(state.users).find((u) => u.user.id === user.id);
          if (rec) rec.password = body.password;
        }
      }
      return json(200, user);
    }
    if (p === '/auth/v1/logout') return json(204);
    if (p === '/auth/v1/recover') return json(200, {});
    if (p === '/auth/v1/authorize') return route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>google oauth stub</h1>' });

    // ---------------- REST ----------------
    const user = userByToken(req);
    const filterEq = (col) => {
      const v = url.searchParams.get(col);
      return v && v.startsWith('eq.') ? decodeURIComponent(v.slice(3)) : null;
    };
    const wantsSingle = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    if (p === '/rest/v1/profiles') {
      if (!user) return json(401, { code: '42501', message: 'permission denied' });
      if (method === 'GET') {
        const id = filterEq('id');
        if (id !== user.id) return wantsSingle ? json(406, { code: 'PGRST116', message: 'no rows' }) : json(200, []);
        const row = state.profiles[id];
        if (wantsSingle) return row ? json(200, row) : json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
        return json(200, row ? [row] : []);
      }
      if (method === 'POST') {
        const rows = Array.isArray(body) ? body : [body];
        for (const r of rows) {
          if (r.id !== user.id) return json(403, { code: '42501', message: 'new row violates row-level security policy' });
          state.profiles[r.id] = { ...state.profiles[r.id], ...r };
        }
        return json(201, rows);
      }
    }
    if (p === '/rest/v1/bookings') {
      if (state.failBookingsTable) return json(404, { code: '42P01', message: 'relation "public.bookings" does not exist' });
      if (!user) return json(401, { code: '42501', message: 'permission denied' });
      const isAdmin = user.email === 'admin@darzzee.com';
      if (method === 'GET') {
        const uid = filterEq('userId');
        let rows = state.bookings.filter((b) => isAdmin || b.userId === user.id);
        if (uid) rows = rows.filter((b) => b.userId === uid);
        rows.sort((a, b) => b.timestamp - a.timestamp);
        return json(200, rows);
      }
      if (method === 'POST') {
        const rows = Array.isArray(body) ? body : [body];
        const allowed = new Set(['id', 'tailorName', 'tailorCity', 'garment', 'fabric', 'consultationMode', 'measurements', 'address', 'speed', 'paymentMethod', 'total', 'status', 'date', 'userId', 'timestamp']);
        if (opts.strictBookingColumns) {
          for (const r of rows) for (const k of Object.keys(r)) if (!allowed.has(k)) return json(400, { code: 'PGRST204', message: `Could not find the '${k}' column of 'bookings' in the schema cache` });
        }
        for (const r of rows) {
          if (r.userId !== user.id) return json(403, { code: '42501', message: 'new row violates row-level security policy for table "bookings"' });
          state.bookings.push(r);
        }
        return json(201, rows);
      }
      if (method === 'PATCH') {
        if (!isAdmin) return json(200, []);
        const id = filterEq('id');
        const rows = state.bookings.filter((b) => b.id === id);
        rows.forEach((b) => Object.assign(b, body));
        return json(200, rows);
      }
    }
    if (p === '/rest/v1/tailor_applications' && method === 'POST') {
      if (!user) return json(401, { code: '42501', message: 'permission denied' });
      const rows = Array.isArray(body) ? body : [body];
      state.applications.push(...rows);
      return json(201, '');
    }
    if (p === '/rest/v1/newsletter_subscribers' && method === 'POST') {
      const rows = Array.isArray(body) ? body : [body];
      if (rows.some((r) => state.subscribers.includes(r.email))) return json(409, { code: '23505', message: 'duplicate key value violates unique constraint' });
      state.subscribers.push(...rows.map((r) => r.email));
      return json(201, '');
    }
    if (p.startsWith('/storage/v1/object/')) return json(400, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' });
    return json(404, { message: 'not mocked: ' + method + ' ' + p });
  }

  return {
    state, seed,
    async install(target) { await target.route('https://testproj.supabase.co/**', handle); }
  };
}
