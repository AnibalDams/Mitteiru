/**
 * Tokens de movimiento compartidos por JS y CSS.
 * Solo se animan `transform` y `opacity`; el resto de propiedades queda
 * reservado para transiciones de color o borde puntuales.
 */
export const DURATION = {
  instant: 100,
  fast: 160,
  base: 220,
  slow: 320,
  page: 260,
  reveal: 600
} as const;

export const EASING = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)'
} as const;

/** Retardo escalonado con tope para no retrasar listas largas. */
export function staggerDelay(index: number, step = 35, max = 8): number {
  if (!Number.isFinite(index) || index < 0) return 0;
  return Math.min(Math.floor(index), Math.max(max, 1) - 1) * step;
}

/** Detecta la preferencia del sistema sin romper en SSR. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface ViewTransitionLike {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransitionLike;
};

export function supportsViewTransitions(): boolean {
  if (typeof document === 'undefined') return false;
  return typeof (document as ViewTransitionDocument).startViewTransition === 'function';
}

/**
 * Arranca una transición de vista si el navegador la soporta y el usuario no
 * pidió movimiento reducido. Devuelve `null` cuando no corresponde.
 */
export function startViewTransition(
  callback: () => void | Promise<void>
): ViewTransitionLike | null {
  if (!supportsViewTransitions() || prefersReducedMotion()) return null;

  const doc = document as ViewTransitionDocument;
  try {
    return doc.startViewTransition!(callback);
  } catch {
    // Un callback que falla no debe romper la navegación.
    return null;
  }
}
