// Usage: set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD to a seeded admin, run backend (8000) + 'vite preview' (5173), then: node e2e-browser-test.js (needs playwright-core + Chromium; edit executablePath).
const { chromium } = require('playwright-core');
const fs = require('fs');
const BASE = 'http://localhost:5173';
const results = []; const errors = [];
const step = async (name, fn) => { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' :: ' + e.message.split('\n').slice(0,3).join(' | ')]); try { await globalThis.__page.screenshot({ path: '/tmp/claude-0/e2e/shots/FAIL-' + name.replace(/\W+/g,'_') + '.png' }); } catch {} } };
const dlg = (p) => p.getByRole('dialog');
const shot = (page, n) => page.screenshot({ path: `/tmp/claude-0/e2e/shots/${n}.png`, fullPage: false });
const future = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 820 } });
  const page = await ctx.newPage(); globalThis.__page = page;
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  const email = `farmer${Date.now()}@example.com`;

  await step('Landing page renders', async () => { await page.goto(BASE); await page.getByRole('heading', { name: /Grow smarter/ }).waitFor(); await shot(page, '01-landing'); });
  await step('Register farmer', async () => {
    await page.getByRole('link', { name: 'Register' }).first().click();
    await page.getByLabel('Full name').fill('Kashish Test'); await page.getByLabel('Email').fill(email); await page.getByLabel('Password').fill('Farm1234');
    await shot(page, '02-register'); await page.getByRole('button', { name: 'Register' }).click();
    await page.getByText('first farm').waitFor(); await shot(page, '03-dashboard-empty');
  });
  await step('Create farm', async () => {
    await page.getByRole('link', { name: 'Add farm' }).click(); await page.getByRole('button', { name: /Add farm/ }).first().waitFor();
    if (!(await page.getByText('Farm name').isVisible().catch(() => false))) await page.getByRole('button', { name: /Add farm/ }).first().click();
    await page.getByLabel('Farm name').fill('Green Acre'); await page.getByLabel(/Location/).fill('Pune, Maharashtra'); await page.getByLabel('Size').fill('4.5');
    await page.getByLabel('Soil type').selectOption('black'); await page.getByLabel('Irrigation').selectOption('drip');
    await shot(page, '04-farm-form'); await page.getByRole('button', { name: 'Save' }).click(); await page.getByRole('heading', { name: 'Green Acre' }).waitFor(); await shot(page, '05-farms');
  });
  await step('Reject invalid crop dates (server validation shown)', async () => {
    await page.goto(BASE + '/crops'); await page.getByRole('button', { name: /Add crop/ }).click();
    const d = dlg(page); await d.getByLabel('Farm').selectOption({ label: 'Green Acre' }); await d.getByLabel('Crop name').fill('Wheat');
    await d.getByLabel('Sowing date').fill(future(0)); await d.getByLabel('Expected harvest date').fill(future(-5));
    await d.getByRole('button', { name: 'Save' }).click(); await page.getByText(/after the sowing date/).waitFor(); await shot(page, '06-crop-validation');
  });
  await step('Add crop and view details', async () => {
    await dlg(page).getByLabel('Expected harvest date').fill(future(5)); await dlg(page).getByRole('button', { name: 'Save' }).click();
    await page.getByRole('link', { name: 'Wheat', exact: true }).click(); await page.getByRole('heading', { name: 'Season progress' }).waitFor();
    await page.getByRole('button', { name: 'Vegetative' }).click(); await page.getByText('Growth stage updated').waitFor(); await shot(page, '07-crop-detail');
  });
  await step('Crop guide search + detail', async () => {
    await page.goto(BASE + '/crop-info'); await page.getByPlaceholder(/Search/).fill('tomato'); await page.getByRole('link', { name: /Read guide/ }).first().click();
    await page.getByRole('heading', { name: 'Tomato' }).waitFor(); await shot(page, '08-crop-guide');
  });
  await step('Weather by city (stand-in provider), invalid city, farm weather', async () => {
    await page.goto(BASE + '/weather'); await page.getByLabel('City or village name').fill('Pune'); await page.getByRole('button', { name: 'Check weather' }).click();
    await page.getByText('Humidity').waitFor(); await page.getByText(/retrieved/).waitFor(); await shot(page, '09-weather');
    await page.getByLabel('City or village name').fill('Nowhereville'); await page.getByRole('button', { name: 'Check weather' }).click(); await page.getByText(/Location not found/).waitFor();
    await page.goto(BASE + '/weather?farm=' + (await page.evaluate(async () => { const t = localStorage.getItem('agritech_token'); const r = await fetch('http://localhost:8000/api/farms', { headers: { Authorization: 'Bearer ' + t } }); return (await r.json()).data[0]._id; })));
    await page.getByText('Humidity').waitFor();
  });
  await step('Soil record + guidance + alerts', async () => {
    await page.goto(BASE + '/soil'); await page.getByRole('button', { name: /Add soil record/ }).first().click();
    const d = dlg(page); await d.getByLabel('Farm').selectOption({ label: 'Green Acre' }); await d.getByLabel(/Soil pH/).fill('5.0'); await d.getByLabel(/Moisture/).fill('15'); await d.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'Guidance' }).click(); await page.getByText(/not a laboratory diagnosis/).first().waitFor(); await shot(page, '10-soil');
    await page.keyboard.press('Escape'); await page.goto(BASE + '/alerts'); await page.getByText('harvest due soon').waitFor(); await page.getByText(/Warm, humid weather/).waitFor(); await shot(page, '11-alerts');
  });
  await step('Marketplace: search, add to cart, demo checkout, order history', async () => {
    await page.goto(BASE + '/marketplace'); await page.getByRole('heading', { name: 'Urea (45 kg)' }).waitFor(); await shot(page, '12-marketplace');
    await page.getByPlaceholder(/Search/).fill('urea'); await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await page.getByRole('link', { name: /^Cart/ }).first().click(); await page.getByText('Demo checkout').waitFor();
    await page.getByLabel('Delivery address').fill('12 Farm Road, Pune'); await shot(page, '13-cart');
    await page.getByRole('button', { name: 'Place demo order' }).click(); await page.getByText(/Order #/).waitFor(); await shot(page, '14-orders');
  });
  await step('Booking: create, view, reschedule, cancel', async () => {
    await page.goto(BASE + '/services'); await page.getByRole('heading', { name: 'Tractor rental (with driver)' }).waitFor();
    await page.getByRole('button', { name: 'Book' }).first().click(); await page.getByLabel('Date').fill(future(7)); await shot(page, '15-booking-form');
    await page.getByRole('button', { name: 'Request booking' }).click(); await page.getByRole('cell', { name: 'Pending' }).waitFor(); await shot(page, '16-bookings');
    await page.getByRole('button', { name: 'Reschedule' }).click(); await page.getByLabel('New date').fill(future(9)); await page.getByRole('button', { name: 'Save' }).click(); await page.getByText('Booking updated').waitFor();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click(); await page.getByRole('button', { name: 'Cancel booking' }).click(); await page.getByRole('cell', { name: 'Cancelled' }).waitFor();
  });
  await step('Community post + comment', async () => {
    await page.goto(BASE + '/community'); await page.getByRole('button', { name: 'New post' }).first().click();
    await dlg(page).getByLabel('Title').fill('Leaf spots on tomato'); await dlg(page).getByLabel('Your post').fill('Any advice on brown spots?'); await dlg(page).getByRole('button', { name: 'Publish' }).click();
    await page.getByLabel('Add a comment').fill('Remove infected leaves.'); await page.getByRole('button', { name: 'Post comment' }).click(); await page.getByText('Remove infected leaves.').waitFor(); await shot(page, '17-community');
  });
  await step('Hindi UI switch + dashboard with real data', async () => {
    await page.goto(BASE + '/dashboard'); await page.getByLabel('Language').selectOption('hi'); await page.getByText('मेरे खेत').first().waitFor(); await shot(page, '18-dashboard-hindi');
    await page.getByLabel('भाषा').selectOption('en'); await page.getByText('Active crops').first().waitFor();
  });
  await step('Farmer cannot open admin UI; admin API refused', async () => {
    await page.goto(BASE + '/admin'); await page.waitForURL('**/dashboard');
    const status = await page.evaluate(async () => { const t = localStorage.getItem('agritech_token'); return (await fetch('http://localhost:8000/api/admin/stats', { headers: { Authorization: 'Bearer ' + t } })).status; });
    if (status !== 403) throw new Error('expected 403 got ' + status);
  });
  await step('Logout', async () => { await page.goto(BASE + '/dashboard'); await page.getByRole('button', { name: /Kashish/ }).click(); await page.getByRole('button', { name: 'Log out' }).click(); await page.getByRole('heading', { name: /Grow smarter/ }).waitFor(); });
  await step('Wrong password shows safe error', async () => {
    await page.goto(BASE + '/login'); await page.getByLabel('Email').fill(email); await page.getByLabel('Password').fill('Wrong1234'); await page.getByRole('button', { name: 'Log in' }).click(); await page.getByText('Invalid email or password').waitFor(); await shot(page, '19-login-error');
  });
  await step('Protected route redirects anonymous user to login', async () => { await page.goto(BASE + '/farms'); await page.waitForURL('**/login'); });

  // ---- admin ----
  await step('Admin login → dashboard stats', async () => {
    await page.evaluate(() => localStorage.clear()); await page.goto(BASE + '/login'); await page.getByLabel('Email').fill((process.env.E2E_ADMIN_EMAIL || 'admin@agritech.test')); await page.getByLabel('Password').fill(process.env.E2E_ADMIN_PASSWORD); await page.getByRole('button', { name: 'Log in' }).click();
    await page.getByRole('heading', { name: 'My Farms' }).waitFor(); /* returned to the page requested before login */ await page.goto(BASE + '/admin');
    await page.getByRole('heading', { name: 'Admin dashboard' }).waitFor(); await page.getByText('Orders by status').waitFor(); await shot(page, '20-admin-dashboard');
  });
  await step('Admin: add product, update stock, hide product', async () => {
    await page.goto(BASE + '/admin/products'); await page.getByRole('button', { name: 'Add product' }).click();
    const d = dlg(page); await d.getByLabel('Product name').fill('E2E Test Seed'); await d.getByLabel('Category').selectOption('seed'); await d.getByLabel(/Price/).fill('99'); await d.getByLabel(/Stock/).fill('7'); await d.getByRole('button', { name: 'Save' }).click();
    await page.getByText('E2E Test Seed').waitFor(); const stock = page.getByLabel('Stock for E2E Test Seed'); await stock.fill('25'); await stock.blur(); await page.getByText('Stock updated').waitFor(); await shot(page, '21-admin-products');
    await page.getByRole('row', { name: /E2E Test Seed/ }).getByRole('button', { name: 'Remove' }).click(); await dlg(page).getByRole('button', { name: 'Remove', exact: true }).click(); await page.getByText('Product hidden from shop').waitFor();
  });
  await step('Admin: orders, bookings, users, advisory', async () => {
    await page.goto(BASE + '/admin/orders'); await page.getByText(/Urea/).first().waitFor(); await page.getByLabel(/Update status of order/).first().selectOption('confirmed'); await page.getByText('Order marked confirmed').waitFor(); await shot(page, '22-admin-orders');
    await page.goto(BASE + '/admin/bookings'); await page.getByRole('heading', { name: 'Bookings' }).waitFor();
    await page.goto(BASE + '/admin/users'); await page.getByText('kashish', { exact: false }).first().waitFor(); await shot(page, '23-admin-users');
    await page.goto(BASE + '/admin/alerts'); await page.getByRole('button', { name: 'New advisory' }).click(); await dlg(page).getByLabel('Title').fill('Pest warning'); await dlg(page).getByLabel(/Message/).fill('Check local advisories for armyworm.'); await dlg(page).getByRole('button', { name: 'Publish' }).click(); await page.getByText('Pest warning').waitFor();
  });

  // ---- responsive ----
  await step('Mobile layout (390px): menu opens, no horizontal scroll', async () => {
    await page.setViewportSize({ width: 390, height: 800 }); await page.goto(BASE + '/admin');
    await page.getByRole('heading', { name: 'Admin dashboard' }).waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); if (overflow) throw new Error('horizontal overflow on /admin');
    await page.getByRole('button', { name: 'Menu' }).click(); await page.getByRole('link', { name: 'Marketplace' }).waitFor(); await shot(page, '24-mobile-menu'); await page.getByRole('link', { name: 'Marketplace' }).click();
    await page.getByRole('heading', { name: 'Marketplace' }).waitFor(); const o2 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); if (o2) throw new Error('horizontal overflow on marketplace'); await shot(page, '25-mobile-marketplace');
    await page.goto(BASE + '/'); await shot(page, '26-mobile-landing');
  });
  await browser.close();
  const real = errors.filter((e) => !/favicon|fonts\.g|ERR_INTERNET|ERR_NAME|Failed to load resource.*(40[0-9]|50[0-9])/.test(e));
  console.log(results.map((r) => r.join('  ')).join('\n')); console.log('\nConsole errors (excluding expected 4xx and blocked fonts):', real.length); real.slice(0, 8).forEach((e) => console.log(' -', e.slice(0, 200)));
  fs.writeFileSync('/tmp/claude-0/e2e/results.json', JSON.stringify({ results, errors }, null, 1));
})();
