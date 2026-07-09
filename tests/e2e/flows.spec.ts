import { test, expect } from '@playwright/test';

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('renders the stage and switches correction modes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('stage')).toBeVisible();
  await expect(page.getByTestId('webgl-error')).toHaveCount(0);

  // Default is "With glasses" (sharp).
  await expect(page.getByRole('button', { name: /with glasses/i })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /^without$/i }).click();
  await expect(page.getByRole('button', { name: /^without$/i })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /compare/i }).click();
  await expect(page.getByTestId('wipe-handle')).toBeVisible();
});

test('camera denied falls back to a scene (from the settings sheet)', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^settings$/i }).click();
  await expect(page.getByTestId('settings-sheet')).toBeVisible();
  await page.getByRole('button', { name: /camera/i }).click();
  await expect(page.getByTestId('toast')).toContainText(/camera unavailable/i);
});

test('shows attribution for a stubbed Openverse photo', async ({ page }) => {
  await page.route('**/api.openverse.org/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            id: '1',
            url: PNG,
            thumbnail: PNG,
            creator: 'Jane Doe',
            license: 'by',
            license_version: '4.0',
            license_url: 'https://cc/by',
            foreign_landing_url: 'https://src/photo',
            title: 'A View',
          },
        ],
      }),
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^settings$/i }).click();
  await page.getByRole('button', { name: /photos/i }).click();
  await page.getByRole('button', { name: /^done$/i }).click();
  await expect(page.getByTestId('attribution')).toContainText('Jane Doe');
  await expect(page.getByTestId('attribution')).toContainText('CC BY 4.0');
});
