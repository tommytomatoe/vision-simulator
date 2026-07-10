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

test('the next arrow shows on the eye chart and jumps to photos', async ({ page }) => {
  await page.route('**/api.openverse.org/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          { id: 'x', url: PNG, thumbnail: PNG, creator: 'Jane Doe', license: 'by', license_version: '4.0', foreign_landing_url: 'https://src/x', title: 'A View' },
        ],
      }),
    });
  });
  await page.goto('/');
  // default view is the eye chart (no photo yet), but the next arrow is present
  await expect(page.getByTestId('attribution')).toHaveCount(0);
  const next = page.getByRole('button', { name: /next photo/i });
  await expect(next).toBeVisible();
  await next.click();
  // clicking it from the eye chart drops straight into photo mode
  await expect(page.getByTestId('attribution')).toContainText('Jane Doe');
});

test('right arrow advances to the next photo', async ({ page }) => {
  await page.route('**/api.openverse.org/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          { id: 'a', url: PNG, thumbnail: PNG, creator: 'Alpha One', license: 'by', foreign_landing_url: 'https://src/a', title: 'A' },
          { id: 'b', url: PNG, thumbnail: PNG, creator: 'Beta Two', license: 'by', foreign_landing_url: 'https://src/b', title: 'B' },
        ],
      }),
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^settings$/i }).click();
  await page.getByRole('button', { name: /photos/i }).click();
  await page.getByRole('button', { name: /^done$/i }).click();
  const caption = page.getByTestId('attribution');
  await expect(caption).toBeVisible();
  const first = (await caption.textContent()) ?? '';
  await page.keyboard.press('ArrowRight');
  // pool has two distinct creators; advancing must change the caption
  await expect(caption).not.toHaveText(first);
});
