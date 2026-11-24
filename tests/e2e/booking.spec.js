import { test, expect } from './fixtures.js';
import { createBackend, fakeSession } from './fake-supabase.js';

async function fillAddress(page) {
  await page.getByLabel('Street address').fill('12 MG Road, Indiranagar');
  await page.getByLabel('City').fill('Bengaluru');
  await page.getByLabel('State').fill('Karnataka');
  await page.getByLabel('Pincode').fill('560038');
}

test('signed-out visitors see the tailor profile and a sign-in prompt', async ({ page }) => {
  await page.goto('/book/tailor-3');
  await expect(page.getByRole('heading', { level: 1, name: 'Priya Das' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stitching prices' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in' }).last()).toHaveAttribute('href', '/login?next=%2Fbook%2Ftailor-3');
  await expect(page.getByRole('button', { name: 'Place booking' })).toHaveCount(0);
});

test('books a tailor end-to-end and shows it in booking history', async ({ page, backend, signedIn }) => {
  await page.goto('/tailors');
  await page.getByRole('link', { name: /Book Now\s*: Arjun Sharma/ }).click();
  await expect(page).toHaveURL(/\/book\/tailor-1$/);

  await page.getByLabel('Garment').selectOption('Kurta');
  await page.getByLabel(/Special notes/).fill('Mandarin collar, full sleeves');
  await fillAddress(page);
  await page.getByText('Express', { exact: true }).click();
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByText('FIRSTORDER applied')).toBeVisible();

  // 1500 kurta + 200 platform + 1000 express - 500 coupon
  await expect(page.locator('.summary-total')).toContainText('₹2,200');

  const submit = page.getByRole('button', { name: 'Place booking' });
  await submit.dblclick();
  await expect(page).toHaveURL(/\/profile#bookings$/);
  await expect(page.getByRole('heading', { name: 'Kurta stitching — Arjun Sharma' })).toBeVisible();
  await expect(page.getByText('Mandarin collar, full sleeves')).toBeVisible();

  expect(backend.state.bookings).toHaveLength(1);
  const saved = backend.state.bookings[0];
  expect(saved.userId).toBe(signedIn.id);
  expect(saved.total).toBe(2200);
  expect(saved.speed).toBe('express');
  expect(saved.address.pincode).toBe('560038');
});

test('validates measurements and pincode before saving', async ({ page, backend, signedIn }) => {
  await page.goto('/book/tailor-2');
  await page.getByText('Send my measurements').click();
  await page.getByLabel('Chest').fill('200');
  await page.getByLabel('Waist').fill('32');
  await page.getByLabel('Hips').fill('38');
  await page.getByLabel('Length').fill('40');
  await fillAddress(page);
  await page.getByRole('button', { name: 'Place booking' }).click();
  await expect(page.locator('#booking-error')).toHaveText('Chest must be a number between 5 and 90 inches.');

  await page.getByLabel('Chest').fill('40');
  await page.getByLabel('Pincode').fill('12');
  await page.getByRole('button', { name: 'Place booking' }).click();
  await expect(page.locator('#booking-error')).toHaveText('Please enter a valid 6-digit pincode.');
  expect(backend.state.bookings).toHaveLength(0);
});

test('keeps notes when the live bookings table lacks the newer columns', async ({ page, context }) => {
  const backend = createBackend({ strictBookingColumns: true });
  await backend.install(context);
  const session = fakeSession();
  backend.state.users['test.user@example.com'] = { user: session.user, password: 'x', confirmed: true };
  await context.addInitScript((s) => localStorage.setItem('sb-testproj-auth-token', JSON.stringify(s)), session);

  await page.goto('/book/tailor-1');
  await page.getByLabel(/Special notes/).fill('Slim fit');
  await fillAddress(page);
  await page.getByRole('button', { name: 'Place booking' }).click();
  await expect(page).toHaveURL(/\/profile#bookings$/);
  expect(backend.state.bookings).toHaveLength(1);
  expect(backend.state.bookings[0].notes).toBeUndefined();
  expect(backend.state.bookings[0].measurements.notes).toBe('Slim fit');
  await expect(page.getByText('Slim fit')).toBeVisible();
});

test('alteration request is saved as a real booking', async ({ page, backend, signedIn }) => {
  await page.goto('/alterations');
  await page.getByLabel('Describe the alteration').fill('Shorten sleeves by 2 inches and taper the waist');
  await fillAddress(page);
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page).toHaveURL(/\/profile#bookings$/);
  await expect(page.getByRole('heading', { name: 'Alteration request' })).toBeVisible();
  expect(backend.state.bookings[0].requestType).toBe('alteration');
  expect(backend.state.bookings[0].notes).toContain('Shorten sleeves');
});

test('alteration photo upload rejects non-image files', async ({ page, signedIn }) => {
  await page.goto('/alterations');
  await page.locator('#alteration-photo').setInputFiles({ name: 'script.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') });
  await expect(page.locator('#photo-error')).toContainText('Unsupported file type');
});

test('tailor application is submitted to the backend', async ({ page, backend, signedIn }) => {
  await page.goto('/join');
  await page.getByLabel('Full name').fill('Ritu Verma');
  await page.getByLabel('Phone number').fill('+91 98765 43210');
  await page.getByLabel('City of operations').fill('Lucknow');
  await page.getByLabel('Years of experience').fill('16');
  await page.getByLabel(/Specialties/).fill('Chikankari kurtas and anarkali suits');
  await page.getByRole('button', { name: 'Submit application' }).click();
  await expect(page.getByRole('heading', { name: 'Application received' })).toBeVisible();
  expect(backend.state.applications).toHaveLength(1);
  expect(backend.state.applications[0]).toMatchObject({ full_name: 'Ritu Verma', phone: '919876543210', experience_years: 16, user_id: signedIn.id });
});

test('profile edits are saved', async ({ page, backend, signedIn }) => {
  await page.goto('/profile');
  await page.getByLabel('Full name').fill('TEST USER UPDATED');
  await page.getByLabel('Phone number').fill('9123456780');
  await page.getByRole('button', { name: 'Save details' }).click();
  await expect(page.locator('#toast-container')).toContainText('Profile details saved');
  expect(backend.state.profiles[signedIn.id]).toMatchObject({ name: 'TEST USER UPDATED', phone: '9123456780' });
});

test('newsletter signup validates and submits', async ({ page, backend }) => {
  await page.goto('/');
  const input = page.getByLabel('Email address for updates');
  await input.fill('bad');
  await page.getByRole('button', { name: 'Notify Me' }).click();
  await expect(page.locator('#newsletter-error')).toBeVisible();
  await input.fill('hello@example.com');
  await page.getByRole('button', { name: 'Notify Me' }).click();
  await expect(page.locator('#toast-container')).toContainText('on the list');
  expect(backend.state.subscribers).toEqual(['hello@example.com']);
});
