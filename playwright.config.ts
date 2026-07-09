import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4173' },
  webServer: [
    {
      command: 'npm run build && npm run preview -- --port 4173',
      port: 4173,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      // Dev server exercises React StrictMode's double effect invocation,
      // which the production preview does not — needed to guard the
      // WebGL2 context-lifecycle regression (see dev-strictmode.spec.ts).
      command: 'npm run dev -- --port 5173',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
