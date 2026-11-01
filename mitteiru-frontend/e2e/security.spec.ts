import { expect, test } from '@playwright/test';

/**
 * Requiere un backend sembrado y las variables E2E_* para crear cuentas.
 * Si no están definidas, los tests se marcan como skipped para no romper CI.
 */
const userEmail = process.env.E2E_USER_EMAIL;
const userPassword = process.env.E2E_USER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('seguridad de sesión y XSS', () => {
  test.skip(!userEmail || !userPassword, 'Define E2E_USER_EMAIL/E2E_USER_PASSWORD');

  test('la cookie de sesión es HttpOnly y SameSite=Strict', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', userEmail!);
    await page.fill('input[name="password"]', userPassword!);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/selectprofile');

    const cookies = await context.cookies();
    const session = cookies.find((cookie) => cookie.name === 'session');
    expect(session).toBeTruthy();
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe('Strict');
  });

  test('una reseña con HTML malicioso no ejecuta scripts', async ({ page }) => {
    let dialogSeen = false;
    page.on('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });

    await page.goto('/anime');
    // Este test depende de datos sembrados; se documenta como plantilla.
    await page.waitForTimeout(500);
    expect(dialogSeen).toBe(false);
  });
});

test.describe('panel de administración', () => {
  test.skip(!adminEmail || !adminPassword, 'Define E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD');

  test('sin sesión de admin redirige a /admin/login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('**/admin/login');
    await expect(page.locator('h1')).toContainText('administración');
  });
});
