import { test, expect } from './fixtures.js';

const WIDTHS = [320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920];
const PUBLIC_ROUTES = ['/', '/tailors', '/book/tailor-1', '/alterations', '/join', '/login', '/signup'];
const PRIVATE_ROUTES = ['/profile', '/book/tailor-3', '/alterations', '/join'];

/** Finds elements that stick out past the viewport, with the page's
 *  overflow-x: clip safety net disabled so real overflow cannot hide. */
async function findOverflow(page) {
  await page.addStyleTag({ content: 'html, body { overflow-x: visible !important; }' });
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [];
    const isClippedByAncestor = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox !== 'visible') return true;
      }
      return false;
    };
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (el.closest('.announcement-banner, .sub-hero-ticker, .visually-hidden')) continue; // marquees are clipped by design
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if ((r.right > vw + 1 || r.left < -1) && !isClippedByAncestor(el)) {
        offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} [${Math.round(r.left)}..${Math.round(r.right)}]`);
      }
    }
    return { scrollWidth: document.documentElement.scrollWidth, vw, offenders: offenders.slice(0, 8) };
  });
}

for (const width of WIDTHS) {
  test(`no horizontal overflow on public pages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);
      await page.locator('h1').first().waitFor();
      await page.waitForTimeout(150);
      const res = await findOverflow(page);
      expect.soft(res.offenders, `${route} @ ${width}px`).toEqual([]);
      expect.soft(res.scrollWidth, `${route} @ ${width}px scrollWidth`).toBeLessThanOrEqual(res.vw);
    }
  });

  test(`no horizontal overflow on signed-in pages at ${width}px`, async ({ page, signedIn }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of PRIVATE_ROUTES) {
      await page.goto(route);
      await page.locator('h1').first().waitFor();
      await page.waitForTimeout(150);
      const res = await findOverflow(page);
      expect.soft(res.offenders, `${route} @ ${width}px`).toEqual([]);
      expect.soft(res.scrollWidth, `${route} @ ${width}px scrollWidth`).toBeLessThanOrEqual(res.vw);
    }
  });
}

test('the whole sign-up form is reachable on a small phone (no clipped modal)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/signup');
  const submit = page.getByRole('button', { name: 'Create account' });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeInViewport();
  const heading = page.getByRole('heading', { name: 'Create account' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(heading).toBeInViewport();
});

test('mobile menu: opens, traps focus, closes with Escape and on navigation @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/');
  const toggle = page.locator('.mobile-menu-toggle');
  await expect(page.locator('.header-nav')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Home' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(toggle).toBeFocused();

  await toggle.click();
  await dialog.getByRole('link', { name: 'Book Tailor' }).click();
  await expect(page).toHaveURL(/\/tailors$/);
  await expect(dialog).toBeHidden();
});

test('desktop navigation links are real, crawlable anchors', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const hrefs = await page.locator('.header-nav a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(hrefs).toEqual(expect.arrayContaining(['/', '/tailors', '/alterations', '/join']));
  expect(await page.locator('a[href^="javascript:"]').count()).toBe(0);
});

test('browser back/forward moves between views', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Book Now' }).click();
  await expect(page).toHaveURL(/\/tailors$/);
  await page.getByRole('button', { name: 'kurta' }).click();
  await expect(page).toHaveURL(/category=kurta/);
  await page.locator('.tailor-card-btn').first().click();
  await expect(page).toHaveURL(/\/book\//);
  await page.goBack();
  await expect(page).toHaveURL(/\/tailors\?category=kurta/);
  await page.goBack();
  await expect(page).toHaveURL('http://localhost:4300/');
});

test('tailor search filters results and survives reload', async ({ page }) => {
  await page.goto('/tailors');
  await page.getByLabel('Search tailors').fill('kolkata');
  await expect(page.locator('.results-count')).toHaveText('2 tailors');
  await expect(page).toHaveURL(/q=kolkata/);
  await page.reload();
  await expect(page.getByLabel('Search tailors')).toHaveValue('kolkata');
  await expect(page.locator('.results-count')).toHaveText('2 tailors');
});

test('every public page has one h1, a title, description and canonical', async ({ page }) => {
  for (const route of ['/', '/tailors', '/book/tailor-5', '/alterations', '/join']) {
    await page.goto(route);
    await page.locator('h1').first().waitFor();
    expect(await page.locator('h1').count(), route).toBe(1);
    expect(await page.title(), route).toMatch(/DARZZEE/);
    expect(await page.locator('meta[name="description"]').getAttribute('content'), route).toBeTruthy();
    expect(await page.locator('link[rel="canonical"]').getAttribute('href'), route).toBe(`https://www.darzzee.com${route}`);
    expect(await page.locator('img:not([alt])').count(), `${route} images without alt`).toBe(0);
  }
});

test('static SEO files are served', async ({ request }) => {
  expect((await request.get('/robots.txt')).status()).toBe(200);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('<loc>https://www.darzzee.com/tailors</loc>');
  expect((await request.get('/favicon.svg')).status()).toBe(200);
});
