import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against a production build served with the real
// vercel.json headers (so the Content-Security-Policy is exercised too).
// Supabase is replaced by an in-memory fake (tests/e2e/fake-supabase.js)
// via request interception — no real backend or credentials are used.
const PORT = 4300;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ }
  ],
  webServer: {
    command: `npx vite build --outDir dist-e2e --emptyOutDir && node tests/e2e/serve.mjs dist-e2e ${PORT} vercel.json`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: 'https://testproj.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'e2e-placeholder-anon-key'
    }
  }
});
