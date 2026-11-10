import { expect, test } from '@playwright/test';
import { gotoHydrated } from './utils';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('ficha y reproductor en móvil', () => {
  test('la ficha muestra acciones fijas y no desborda', async ({ page }) => {
    await gotoHydrated(page, '/directory');
    await page.locator('[data-anime-card] a').first().click();
    await page.waitForURL(/\/anime\/[^/]+/);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver ahora' })).toBeVisible();

    const posterHeight = await page
      .locator('.detail-poster img')
      .first()
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(posterHeight).toBeLessThan(260);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('el player va primero y permite fullscreen y lista de episodios', async ({ page }) => {
    await gotoHydrated(page, '/directory');
    await page.locator('[data-anime-card] a').first().click();
    await page.waitForURL(/\/anime\/[^/]+/);

    const firstEpisode = page.getByRole('button', { name: /ver episodio/i }).first();
    if ((await firstEpisode.count()) === 0) {
      test.skip(true, 'El catálogo de prueba no tiene episodios');
      return;
    }

    await firstEpisode.click();
    await page.waitForURL(/\/episode\//);
    await expect(page.locator('.player-shell')).toBeVisible();

    const positions = await page.evaluate(() => ({
      player: document.querySelector('.player-shell')!.getBoundingClientRect().top,
      title: document.querySelector('h1')!.getBoundingClientRect().top
    }));
    expect(positions.player).toBeLessThan(positions.title);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    await page.getByRole('button', { name: 'Pantalla completa' }).click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            Boolean(document.fullscreenElement) ||
            getComputedStyle(document.querySelector('.player-shell')!).position === 'fixed'
        )
      )
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            !document.fullscreenElement &&
            getComputedStyle(document.querySelector('.player-shell')!).position !== 'fixed'
        )
      )
      .toBe(true);

    await page.getByRole('button', { name: /ver episodios/i }).click();
    await expect(page.getByRole('dialog', { name: /episodios/i })).toBeVisible();
  });
});
