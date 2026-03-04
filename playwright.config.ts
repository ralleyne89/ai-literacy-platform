import { devices, defineConfig } from '@playwright/test';

const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
const frontendPort = Number(process.env.PLAYWRIGHT_FRONTEND_PORT || '5173');
const backendPort = Number(process.env.PLAYWRIGHT_BACKEND_PORT || '5001');
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://${host}:${frontendPort}`;
const recordMode = ['1', 'true', 'yes'].includes((process.env.PLAYWRIGHT_RECORD_MODE || '').toLowerCase());

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: recordMode ? 'on' : 'on-first-retry',
    video: {
      mode: recordMode ? 'on' : 'retain-on-failure',
      size: {
        width: 1365,
        height: 768
      }
    },
    viewport: {
      width: 1365,
      height: 768
    }
  },
  webServer: [
    {
      command: 'npm run backend',
      port: backendPort,
      reuseExistingServer: true,
      timeout: 120000,
      env: {
        PORT: String(backendPort),
      },
    },
    {
      command: `npm run dev -- --host ${host} --port ${frontendPort}`,
      port: frontendPort,
      reuseExistingServer: true,
      timeout: 120000,
      env: {
        VITE_API_URL: `http://${host}:${backendPort}`,
        VITE_AUTH_MODE: 'backend',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
