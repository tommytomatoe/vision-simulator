import { test, expect } from '@playwright/test';

test('renders the stage and switches correction modes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('stage')).toBeVisible();
  await expect(page.getByTestId('webgl-error')).toHaveCount(0);

  // Default is "Without glasses" (blurred) — lead with the impaired view.
  await expect(page.getByRole('button', { name: /^without$/i })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /with glasses/i }).click();
  await expect(page.getByRole('button', { name: /with glasses/i })).toHaveAttribute('aria-pressed', 'true');
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

test('shows Unsplash attribution in photo mode', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^settings$/i }).click();
  await page.getByRole('button', { name: /photos/i }).click();
  await page.getByRole('button', { name: /^done$/i }).click();
  const caption = page.getByTestId('attribution');
  await expect(caption).toContainText(/Photo by/);
  await expect(caption.getByRole('link', { name: 'Unsplash' })).toBeVisible();
});

test('the next arrow shows on the eye chart and jumps to photos', async ({ page }) => {
  await page.goto('/');
  // default view is the eye chart (no photo yet), but the next arrow is present
  await expect(page.getByTestId('attribution')).toHaveCount(0);
  const next = page.getByRole('button', { name: /next photo/i });
  await expect(next).toBeVisible();
  await next.click();
  // clicking it from the eye chart drops straight into photo mode
  await expect(page.getByTestId('attribution')).toContainText(/Photo by/);
});

test('right arrow advances to the next photo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^settings$/i }).click();
  await page.getByRole('button', { name: /photos/i }).click();
  await page.getByRole('button', { name: /^done$/i }).click();
  const caption = page.getByTestId('attribution');
  await expect(caption).toBeVisible();
  const first = (await caption.textContent()) ?? '';
  await page.keyboard.press('ArrowRight');
  // advancing moves to a different bundled photo, changing the credit
  await expect(caption).not.toHaveText(first);
});
