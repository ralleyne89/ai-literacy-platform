import { devices, defineConfig } from '@playwright/test';

const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
const frontendPort = Number(process.env.PLAYWRIGHT_FRONTEND_PORT || '5195');
const backendPort = Number(process.env.PLAYWRIGHT_BACKEND_PORT || '5001');
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://${host}:${frontendPort}`;
const recordMode = ['1', 'true', 'yes'].includes((process.env.PLAYWRIGHT_RECORD_MODE || '').toLowerCase());
const e2eDatabasePath = process.env.PLAYWRIGHT_DATABASE_PATH || '/tmp/ai-literacy-playwright.db';
const e2eDatabaseUrl = process.env.PLAYWRIGHT_DATABASE_URL || `sqlite:////${e2eDatabasePath.replace(/^\/+/, '')}`;
const backendCommand = [
  'cd backend',
  `rm -f ${e2eDatabasePath}`,
  `DATABASE_URL=${e2eDatabaseUrl} venv/bin/python -m flask --app app.py db upgrade`,
  `DATABASE_URL=${e2eDatabaseUrl} venv/bin/python -m flask --app app.py seed-training-modules --silent`,
  `DATABASE_URL=${e2eDatabaseUrl} venv/bin/python -m flask --app app.py seed-certifications --silent`,
  `DATABASE_URL=${e2eDatabaseUrl} venv/bin/python -m flask --app app.py seed-course-content --silent`,
  `PORT=${backendPort} FLASK_DEBUG=0 DATABASE_URL=${e2eDatabaseUrl} venv/bin/python app.py`,
].join(' && ');

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
      command: backendCommand,
      port: backendPort,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        PORT: String(backendPort),
        DATABASE_URL: e2eDatabaseUrl,
        FRONTEND_URL: `http://${host}:${frontendPort}`,
        ALLOWED_ORIGINS: `http://${host}:${frontendPort}`,
      },
    },
    {
      command: `npm run dev -- --host ${host} --port ${frontendPort}`,
      port: frontendPort,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        VITE_API_URL: `http://${host}:${backendPort}`,
        VITE_AUTH_MODE: 'clerk',
        VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_playwright_clerk_stub',
        PLAYWRIGHT_CLERK_STUB: '1',
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
