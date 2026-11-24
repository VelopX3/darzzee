import { test as base, expect } from '@playwright/test';
import { createBackend, fakeSession, makeUser } from './fake-supabase.js';

export const test = base.extend({
  // Each test gets its own in-memory Supabase backend.
  backend: async ({ context }, use) => {
    const be = createBackend();
    await be.install(context);
    await use(be);
  },
  /** Seeds a signed-in session for `test.user@example.com`. */
  signedIn: async ({ context, backend }, use) => {
    const session = fakeSession();
    backend.state.users['test.user@example.com'] = { user: session.user, password: 'Passw0rd!', confirmed: true };
    await context.addInitScript((s) => {
      if (!sessionStorage.getItem('__seeded')) {
        localStorage.setItem('sb-testproj-auth-token', JSON.stringify(s));
        sessionStorage.setItem('__seeded', '1');
      }
    }, session);
    await use(session.user);
  }
});

export { expect, makeUser };
