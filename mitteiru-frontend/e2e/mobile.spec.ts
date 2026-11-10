import { expect, test } from '@playwright/test';
import { gotoHydrated } from './utils';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('experiencia móvil', () => {
  test('muestra cabecera y tab bar en la home', async ({ page }) => {
    await gotoHydrated(page, '/');

    await expect(page.locator('nav[data-site-navbar]')).toBeVisible();
    const tabbar = page.locator('nav[data-mobile-tabbar]');
    await expect(tabbar).toBeVisible();

    const active = tabbar.locator('a[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toContainText('Inicio');
  });

  test('permite buscar desde la tab bar', async ({ page }) => {
    await gotoHydrated(page, '/');

    await page.locator('nav[data-mobile-tabbar]').getByRole('button', { name: 'Buscar' }).click();

    const dialog = page.getByRole('dialog', { name: /buscar anime/i });
    await expect(dialog).toBeVisible();

    const input = dialog.getByRole('searchbox');
    await input.fill('naruto');
    await input.press('Enter');

    await page.waitForURL('**/search?q=naruto');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('naruto');
  });

  test('abre la hoja de cuenta para invitados', async ({ page }) => {
    await gotoHydrated(page, '/');

    await page.locator('nav[data-mobile-tabbar]').getByRole('button', { name: 'Perfil' }).click();

    const dialog = page.getByRole('dialog', { name: /tu cuenta/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Bienvenido a Mitteiru');
    await expect(dialog.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('los filtros del directorio se abren como hoja', async ({ page }) => {
    await gotoHydrated(page, '/directory');

    await page.getByRole('button', { name: /filtros/i }).click();

    const dialog = page.getByRole('dialog', { name: /filtros/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /aplicar filtros/i })).toBeVisible();

    await dialog.getByRole('button', { name: /aplicar filtros/i }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('no hay desborde horizontal en el directorio', async ({ page }) => {
    await gotoHydrated(page, '/directory');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
