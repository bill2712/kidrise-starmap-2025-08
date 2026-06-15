const { chromium } = require('playwright');
const { spawn } = require('child_process');

(async () => {
  const preview = spawn('npm', ['run', 'preview', '--', '--port', '4322'], { cwd: '/Users/billtsang/Downloads/kidrise-starmap-2025-08/ptcg-companion' });
  
  await new Promise(r => setTimeout(r, 3000)); // wait for preview server to start

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
    
    await page.goto('http://localhost:4322/', { waitUntil: 'networkidle' });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Page loaded successfully without crashing!");
    await browser.close();
  } catch (e) {
    console.error("Script failed:", e);
  } finally {
    preview.kill();
  }
})();
