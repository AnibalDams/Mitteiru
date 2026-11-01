import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  clearToasts,
  dismissToast,
  pushToast,
  resumeToast,
  toasts
} from './toast';

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearToasts();
  });

  afterEach(() => {
    clearToasts();
    vi.useRealTimers();
  });

  it('agrega un toast y lo cierra automáticamente', () => {
    pushToast({ title: 'Guardado', duration: 1000 });

    expect(get(toasts)).toHaveLength(1);
    expect(get(toasts)[0].title).toBe('Guardado');

    vi.advanceTimersByTime(1000);

    expect(get(toasts)).toHaveLength(0);
  });

  it('conserva como máximo tres toasts y descarta el más viejo', () => {
    pushToast({ title: 'Uno', duration: 0 });
    pushToast({ title: 'Dos', duration: 0 });
    pushToast({ title: 'Tres', duration: 0 });
    pushToast({ title: 'Cuatro', duration: 0 });

    const items = get(toasts);
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.title)).toEqual(['Dos', 'Tres', 'Cuatro']);
  });

  it('permite descartar un toast por id', () => {
    const id = pushToast({ title: 'Temporal', duration: 0 });
    pushToast({ title: 'Permanente', duration: 0 });

    dismissToast(id);

    expect(get(toasts).map((item) => item.title)).toEqual(['Permanente']);
  });

  it('reprograma el cierre al reanudar', () => {
    const id = pushToast({ title: 'Pausado', duration: 1000 });

    vi.advanceTimersByTime(600);
    // Simula el pause del hover limpiando el timer.
    const paused = get(toasts).find((item) => item.id === id);
    expect(paused).toBeTruthy();

    resumeToast(id);
    vi.advanceTimersByTime(999);
    expect(get(toasts)).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(get(toasts)).toHaveLength(0);
  });

  it('no programa cierre cuando duration es 0', () => {
    pushToast({ title: 'Persistente', duration: 0 });
    vi.advanceTimersByTime(60_000);

    expect(get(toasts)).toHaveLength(1);
  });
});
