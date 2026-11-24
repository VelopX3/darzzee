import { test, expect } from './fixtures.js';
import { fakeSession } from './fake-supabase.js';

const tokenRequests = (backend) => backend.state.requests.filter((r) => r.path.startsWith('/auth/v1/token?grant_type=password'));

test.describe('sign in', () => {
  test('signs in, lands on the requested page, survives a reload', async ({ page, backend }) => {
    backend.seed('asha@example.com', 'Tailor123', { full_name: 'ASHA' });
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);

    await page.getByLabel('Email address', { exact: true }).fill('asha@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Tailor123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible();
    await expect(page.locator('#profile-email')).toHaveValue('ASHA@EXAMPLE.COM');

    await page.reload();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible();
  });

  test('shows a clear error for wrong credentials and stays usable', async ({ page, backend }) => {
    backend.seed('asha@example.com', 'Tailor123');
    await page.goto('/login');
    await page.getByLabel('Email address', { exact: true }).fill('asha@example.com');
    await page.getByLabel('Password', { exact: true }).fill('wrong-password1');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Incorrect email or password.');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled();
  });

  test('explains when the email is not verified yet', async ({ page, backend }) => {
    backend.seed('new@example.com', 'Tailor123', {}, false);
    await page.goto('/login');
    await page.getByLabel('Email address', { exact: true }).fill('new@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Tailor123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('verify your email');
  });

  test('ignores duplicate submissions while a login is in flight', async ({ page, backend }) => {
    backend.seed('asha@example.com', 'Tailor123');
    backend.state.loginDelayMs = 800;
    await page.goto('/login');
    await page.getByLabel('Email address', { exact: true }).fill('asha@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Tailor123');
    const submit = page.getByRole('button', { name: 'Sign in', exact: true });
    await submit.click();
    await page.getByLabel('Password', { exact: true }).press('Enter');
    await expect(page.getByRole('button', { name: /Signing in/ })).toBeDisabled();
    await expect(page).toHaveURL('/');
    expect(tokenRequests(backend)).toHaveLength(1);
  });

  test('validates the email format before calling the backend', async ({ page, backend }) => {
    await page.goto('/login');
    await page.getByLabel('Email address', { exact: true }).fill('not-an-email');
    await page.getByLabel('Password', { exact: true }).fill('whatever1');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    expect(tokenRequests(backend)).toHaveLength(0);
  });

  test('"keep me signed in" off stores the session for this tab only', async ({ page, backend }) => {
    backend.seed('asha@example.com', 'Tailor123');
    await page.goto('/login');
    await page.getByLabel('Email address', { exact: true }).fill('asha@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Tailor123');
    await page.getByText('Keep me signed in').click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('/');
    const where = await page.evaluate(() => ({
      local: localStorage.getItem('sb-testproj-auth-token'),
      session: sessionStorage.getItem('sb-testproj-auth-token')
    }));
    expect(where.local).toBeNull();
    expect(where.session).toContain('access_token');
  });
});

test.describe('sign up', () => {
  test('creates an account and shows the verification step', async ({ page, backend }) => {
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Ravi Kumar');
    await page.getByLabel('Phone number').fill('9876543210');
    await page.getByLabel('Email address', { exact: true }).fill('ravi@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Stitch2026');
    await page.getByLabel('Confirm password').fill('Stitch2026');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();
    await expect(page.getByText('ravi@example.com')).toBeVisible();
    const signup = backend.state.requests.filter((r) => r.path.startsWith('/auth/v1/signup'));
    expect(signup).toHaveLength(1);
  });

  test('reports an existing account instead of a fake success', async ({ page, backend }) => {
    backend.seed('taken@example.com', 'Tailor123');
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Someone');
    await page.getByLabel('Phone number').fill('9876543210');
    await page.getByLabel('Email address', { exact: true }).fill('taken@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Stitch2026');
    await page.getByLabel('Confirm password').fill('Stitch2026');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('alert')).toContainText('already exists');
  });

  test('signs straight in when email confirmation is disabled', async ({ page, backend }) => {
    backend.state.confirmEmail = false;
    await page.goto('/signup?next=%2Ftailors');
    await page.getByLabel('Full name').fill('Meera');
    await page.getByLabel('Phone number').fill('9876543210');
    await page.getByLabel('Email address', { exact: true }).fill('meera@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Stitch2026');
    await page.getByLabel('Confirm password').fill('Stitch2026');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/tailors$/);
    await expect(page.getByRole('link', { name: 'Profile' }).first()).toBeAttached();
  });

  test('blocks weak and mismatched passwords client-side', async ({ page, backend }) => {
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Meera');
    await page.getByLabel('Phone number').fill('9876543210');
    await page.getByLabel('Email address', { exact: true }).fill('meera@example.com');
    await page.getByLabel('Password', { exact: true }).fill('short');
    await page.getByLabel('Confirm password').fill('short');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();

    await page.getByLabel('Password', { exact: true }).fill('Stitch2026');
    await page.getByLabel('Confirm password').fill('Stitch2027');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Passwords do not match.')).toBeVisible();
    expect(backend.state.requests.filter((r) => r.path.startsWith('/auth/v1/signup'))).toHaveLength(0);
  });
});

test.describe('password recovery', () => {
  test('forgot password shows a neutral confirmation', async ({ page, backend }) => {
    await page.goto('/forgot-password');
    await page.getByLabel('Email address', { exact: true }).fill('anyone@example.com');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'If an account exists' })).toBeVisible();
    expect(backend.state.requests.some((r) => r.path.startsWith('/auth/v1/recover'))).toBe(true);
  });

  test('recovery link opens the reset form and updates the password', async ({ page, backend }) => {
    const user = backend.seed('asha@example.com', 'OldPass123');
    const s = fakeSession(user);
    await page.goto(`/?type=recovery#access_token=${s.access_token}&expires_at=${s.expires_at}&expires_in=3600&refresh_token=${s.refresh_token}&token_type=bearer&type=recovery`);
    await expect(page).toHaveURL(/\/reset-password$/);
    await page.getByLabel('New password', { exact: true }).fill('NewPass456');
    await page.getByLabel('Confirm new password').fill('NewPass456');
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page).toHaveURL(/\/profile$/);
    expect(backend.state.users['asha@example.com'].password).toBe('NewPass456');
  });

  test('an expired email link explains what happened', async ({ page }) => {
    await page.goto('/?type=recovery#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.locator('#toast-container')).toContainText('expired');
  });

  test('reset page without a recovery session asks for a new link', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByText('This reset link is invalid or has expired.')).toBeVisible();
  });
});

test.describe('session & guards', () => {
  test('sign out clears the session and protects private pages', async ({ page, signedIn }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/');
    expect(await page.evaluate(() => localStorage.getItem('sb-testproj-auth-token'))).toBeNull();
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);
  });

  test('signed-in users are sent away from the login page', async ({ page, signedIn }) => {
    await page.goto('/login?next=%2Ftailors');
    await expect(page).toHaveURL(/\/tailors$/);
  });

  test('open redirects via ?next= are refused', async ({ page, backend }) => {
    backend.seed('asha@example.com', 'Tailor123');
    await page.goto('/login?next=%2F%2Fevil.example.com');
    await page.getByLabel('Email address', { exact: true }).fill('asha@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Tailor123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('http://localhost:4300/');
  });

  test('non-admin accounts cannot open the admin panel', async ({ page, signedIn }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin access only' })).toBeVisible();
    await expect(page.getByText('ADMIN CONTROL CENTER')).toHaveCount(0);
  });

  test('admin account sees the dashboard and every booking', async ({ page, backend, context }) => {
    const admin = backend.seed('admin@darzzee.com', 'AdminPass1');
    backend.state.bookings.push({ id: 'bk-1', userId: 'someone', tailorName: 'Priya Das', tailorCity: 'Kolkata', garment: 'Blouse', status: 'assigned', total: 1400, timestamp: 1, consultationMode: 'home' });
    await context.addInitScript((s) => localStorage.setItem('sb-testproj-auth-token', JSON.stringify(s)), fakeSession(admin));
    await page.goto('/admin');
    await expect(page.getByText('ADMIN CONTROL CENTER')).toBeVisible();
    await page.getByRole('tab', { name: 'MANAGE BOOKINGS' }).click();
    await expect(page.getByRole('cell', { name: 'bk-1' })).toBeVisible();
    await page.getByLabel('Status for booking bk-1').selectOption('in_progress');
    await expect(page.locator('#toast-container')).toContainText('Status updated');
    expect(backend.state.bookings[0].status).toBe('in_progress');
  });

  test('legacy admin passcode no longer exists in the shipped code', async ({ page }) => {
    await page.goto('/');
    const scripts = await page.evaluate(() => Array.from(document.scripts).map((s) => s.src).filter(Boolean));
    for (const src of scripts) {
      const body = await (await page.request.get(src)).text();
      expect(body).not.toContain('darzzeeadmin');
    }
  });
});
