import { test, expect } from '@playwright/test';

// 1x1 transparent PNG data URI so stubbed photos load without network/CORS.
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('renders the stage and switches correction modes', async ({ page }) => {
  await page.goto('/');
  const stage = page.getByTestId('stage');
  await expect(stage).toBeVisible();
  await expect(page.getByTestId('webgl-error')).toHaveCount(0);

  await page.getByRole('button', { name: /with glasses/i }).click();
  await expect(page.getByRole('button', { name: /with glasses/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: /compare/i }).click();
  await expect(page.getByTestId('wipe-handle')).toBeVisible();
});

test('falls back to a scene when the camera is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Camera' }).click();
  await expect(page.getByTestId('toast')).toContainText(/camera unavailable/i);
  await expect(page.getByRole('button', { name: 'Scenes' })).toHaveAttribute('aria-pressed', 'true');
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
  await page.getByRole('button', { name: 'Photos' }).click();
  await expect(page.getByTestId('attribution')).toContainText('Jane Doe');
  await expect(page.getByTestId('attribution')).toContainText('CC BY 4.0');
});
