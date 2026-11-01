import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion, staggerDelay } from './motion';

describe('staggerDelay', () => {
  it('escala por índice', () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(2)).toBe(70);
  });

  it('aplica un tope para listas largas', () => {
    expect(staggerDelay(20)).toBe(245);
  });

  it('ignora índices inválidos', () => {
    expect(staggerDelay(-1)).toBe(0);
    expect(staggerDelay(Number.NaN)).toBe(0);
  });
});

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve false sin window (SSR)', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it('lee la preferencia del sistema', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true })
    });

    expect(prefersReducedMotion()).toBe(true);
  });

  it('tolera navegadores sin matchMedia', () => {
    vi.stubGlobal('window', {});

    expect(prefersReducedMotion()).toBe(false);
  });
});
