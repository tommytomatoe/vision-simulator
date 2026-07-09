import { test, expect } from '@playwright/test';

// Regression guard for the false "WebGL2 not supported" notice.
//
// React StrictMode (dev only) double-invokes the mount effect:
// mount → cleanup → mount. The cleanup calls VisionRenderer.dispose(),
// which previously ran WEBGL_lose_context.loseContext() and permanently
// poisoned the canvas. The second mount then reused the same (lost)
// context, shader compilation failed, and the error was mislabeled as
// "WebGL2 not supported" — even in Chrome, where WebGL2 works fine.
//
// The production preview (other webServer) does NOT double-invoke effects,
// so only the dev server reproduces this. Hence a dedicated dev-server test.
test('dev/StrictMode: renders without a false "WebGL2 not supported" notice', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page.getByTestId('stage')).toBeVisible();
  await expect(page.getByTestId('webgl-error')).toHaveCount(0);
});
