import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  testMatch: '*.pw.ts',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    ...devices['iPhone 13'],
    browserName: 'chromium',
    baseURL: 'http://localhost:4173/meu-saldo/',
    locale: 'pt-MZ',
    timezoneId: 'Africa/Maputo',
    launchOptions: { executablePath: process.env.MEUSALDO_CHROMIUM_PATH || undefined },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4173',
    url: 'http://localhost:4173/meu-saldo/',
    reuseExistingServer: !process.env.CI,
  },
});
