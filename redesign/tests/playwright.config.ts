// Playwright config for the LOCKED redesign harness.
// Run from /redesign/tests:   npx playwright test            (baseline against tests/app/index.html)
// Against the demo:           APP_URL=/10-final/locked-demo.html RESULTS_DIR=final npx playwright test
//   APP_URL is read by fixtures/index.mjs (path relative to baseURL); RESULTS_DIR picks baseline/ or final/.
// The static server (serve.mjs) serves the whole redesign tree, so both apps are reachable on 4173.
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RESULTS_DIR = process.env.RESULTS_DIR || 'baseline';
// iPhone 15 Pro defaults to WebKit; only Chromium is installed in this environment, so force it.
const iphone = { ...devices['iPhone 15 Pro'], browserName: 'chromium' as const, defaultBrowserType: 'chromium' as const };

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 2,
  fullyParallel: false,
  reporter: [
    ['list'],
    ['json', { outputFile: `${RESULTS_DIR}/results.json` }],
    ['html', { outputFolder: `${RESULTS_DIR}/report`, open: 'never' }],
  ],
  outputDir: `${RESULTS_DIR}/artifacts`,
  use: {
    ...iphone,
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    trace: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'dark',
  },
  webServer: {
    command: 'node serve.mjs 4173',
    cwd: __dirname,
    url: 'http://127.0.0.1:4173/tests/app/index.html',
    reuseExistingServer: true,
    timeout: 15_000,
  },
  projects: [
    // flows: one spec per user flow, with video for the audit record
    { name: 'flows', testMatch: /e2e\/flows\/.*\.spec\.[tj]s/, use: { ...iphone, video: 'on' } },
    // pages + global + smoke: no video
    { name: 'pages', testMatch: /e2e\/(pages\/.*|global|smoke)\.spec\.[tj]s/, use: { ...iphone, video: 'off' } },
  ],
});
