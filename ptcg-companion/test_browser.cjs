const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
    await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
  } catch (e) {
    console.error("Script failed:", e);
  }
})();
