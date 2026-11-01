import { expect, test } from '@playwright/test';

test.describe('feedback de navegación y estados', () => {
  test('marca el link activo de la navbar', async ({ page }) => {
    await page.goto('/directory');

    const active = page.locator('nav a[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toContainText('Directorio');
  });

  test('navega entre páginas sin errores de consola', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/');
    // La navbar se oculta en la home hasta que hay scroll: la revelamos.
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(250);
    await page.locator('nav a[href="/directory"]').first().click();
    await page.waitForURL('**/directory');

    await expect(page.locator('h1')).toContainText('Directorio');
    expect(errors).toEqual([]);
  });

  test('muestra una página 404 con la identidad del sitio', async ({ page }) => {
    const response = await page.goto('/ruta-que-no-existe');

    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText('No encontramos esta página');
    await expect(page.getByRole('link', { name: /volver al inicio/i })).toBeVisible();
  });

  test('respeta prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const animation = await page
      .locator('[data-anime-card]')
      .first()
      .evaluate((element) => getComputedStyle(element).animationName);

    expect(animation).toBe('none');
  });

  test('el selector de idioma es un desplegable real', async ({ page }) => {
    await page.goto('/directory');

    const trigger = page.locator('nav button[aria-haspopup="listbox"]').first();
    const listbox = page.getByRole('listbox');

    await trigger.click();
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole('option')).toHaveCount(2);
    await expect(listbox.getByRole('option', { name: /español/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    await page.keyboard.press('Escape');
    await expect(listbox).not.toBeVisible();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await listbox.getByRole('option', { name: /english/i }).click();

    await expect(trigger).toContainText('EN');
    await expect(page.locator('nav a[aria-current="page"]')).toContainText('Directory');
  });

  test('el desplegable de idioma sobrevive al auto-hide', async ({ page }) => {
    await page.goto('/');

    const nav = page.locator('nav');
    // En la home la navbar arranca oculta: el hotzone superior la revela.
    await page.mouse.move(640, 3);
    await page.waitForTimeout(350);
    await expect(nav).toHaveCSS('opacity', '1');

    const trigger = page.locator('nav button[aria-haspopup="listbox"]').first();
    await trigger.click();

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    const english = listbox.getByRole('option', { name: /english/i });
    // Este movimiento pasaba por debajo de los 80px y ocultaba la navbar.
    await english.hover();
    await expect(nav).toHaveCSS('opacity', '1');

    await english.click();
    await expect(trigger).toContainText('EN');
    await expect(listbox).not.toBeVisible();
  });

  test('la navbar conserva su estado activo en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/directory');

    await page.getByRole('button', { name: /open menu/i }).click();
    const active = page.locator('nav a[aria-current="page"]').last();
    await expect(active).toContainText('Directorio');
  });
});
