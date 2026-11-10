import type { Page } from '@playwright/test';

/**
 * Espera a que la hidratación termine antes de interactuar. Los controles
 * existen en el HTML del SSR, pero sus handlers se adjuntan al hidratar.
 */
export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
  await page.waitForTimeout(150);
}
