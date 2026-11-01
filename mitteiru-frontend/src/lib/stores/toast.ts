import { get, writable } from 'svelte/store';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** 0 mantiene el toast hasta que el usuario lo cierre. */
  duration?: number;
}

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 4200;

const store = writable<Toast[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();
let nextId = 1;

/** Solo la suscripción es pública; las mutaciones pasan por las funciones. */
export const toasts = { subscribe: store.subscribe };

function clearTimer(id: number) {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

function schedule(id: number, duration: number) {
  if (duration <= 0) return;
  clearTimer(id);
  timers.set(
    id,
    setTimeout(() => dismissToast(id), duration)
  );
}

export function pushToast({
  title,
  description,
  variant = 'info',
  duration = DEFAULT_DURATION
}: ToastInput): number {
  const id = nextId++;
  const toast: Toast = { id, title, description, variant, duration };

  store.update((items) => {
    const next = [...items, toast];
    while (next.length > MAX_TOASTS) {
      const removed = next.shift();
      if (removed) clearTimer(removed.id);
    }
    return next;
  });

  schedule(id, duration);
  return id;
}

export function dismissToast(id: number) {
  clearTimer(id);
  store.update((items) => items.filter((item) => item.id !== id));
}

/** Pausa el auto-cierre mientras el puntero está sobre el toast. */
export function pauseToast(id: number) {
  clearTimer(id);
}

export function resumeToast(id: number) {
  const toast = get(store).find((item) => item.id === id);
  if (toast) schedule(id, toast.duration);
}

export function clearToasts() {
  for (const id of timers.keys()) clearTimeout(timers.get(id));
  timers.clear();
  store.set([]);
}

export function toastSuccess(title: string, description?: string, duration?: number) {
  return pushToast({ title, description, variant: 'success', duration });
}

export function toastError(title: string, description?: string, duration?: number) {
  return pushToast({ title, description, variant: 'error', duration });
}

export function toastInfo(title: string, description?: string, duration?: number) {
  return pushToast({ title, description, variant: 'info', duration });
}
