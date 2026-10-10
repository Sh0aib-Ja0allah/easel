// Launches Chromium from the data dir and screenshots a page. Skips when doctor has not
// installed Playwright + Chromium yet (CI's engine job installs them in T1.6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { doctorReport } from '../lib/doctor.mjs';
import { loadPlaywright } from '../lib/deps.mjs';

const report = doctorReport();
const ready = ['playwright-core', 'chromium'].every((n) => report.checks.find((c) => c.name === n)?.ok);

test('chromium renders a page from the data dir', { skip: ready ? false : 'Playwright/Chromium not installed (run doctor --install)' }, async () => {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 64, height: 32 } });
    await page.setContent('<body style="margin:0;background:rgb(255,0,0)"></body>');
    const color = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.equal(color, 'rgb(255, 0, 0)');
    const png = await page.screenshot();
    assert.ok(png.length > 50 && png[0] === 0x89 && png[1] === 0x50, 'PNG bytes');
  } finally {
    await browser.close();
  }
});
