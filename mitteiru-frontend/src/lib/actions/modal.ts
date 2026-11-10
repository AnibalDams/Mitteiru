const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]'
].join(',');

// Varios diálogos pueden convivir durante una transición (uno cierra y otro
// abre). El contador evita desbloquear el scroll antes de tiempo.
let openModals = 0;
let savedOverflow = '';

/**
 * Comportamiento compartido de diálogos:
 * - bloquea el scroll del documento,
 * - mueve el foco al panel y lo atrapa con Tab,
 * - cierra con Escape,
 * - devuelve el foco al elemento que abrió el diálogo.
 */
export function modalBehavior(node: HTMLElement, onClose: () => void) {
  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  if (openModals === 0) savedOverflow = document.body.style.overflow;
  openModals += 1;
  document.body.style.overflow = 'hidden';

  const panel = node.querySelector<HTMLElement>('[data-modal-panel]') ?? node;
  panel.setAttribute('tabindex', '-1');

  // Un campo puede pedir el foco inicial (p. ej. el buscador de una hoja).
  const autofocusTarget = node.querySelector<HTMLElement>('[data-autofocus]');

  function getFocusable(): HTMLElement[] {
    return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        el.getAttribute('aria-hidden') !== 'true' &&
        (el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement)
    );
  }

  const focusFrame = requestAnimationFrame(() => {
    (autofocusTarget ?? panel).focus({ preventScroll: true });
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusables = getFocusable();

    if (focusables.length === 0) {
      event.preventDefault();
      panel.focus({ preventScroll: true });
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || active === panel || !node.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || active === panel || !node.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('keydown', handleKeydown, true);

  return {
    destroy() {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeydown, true);

      openModals = Math.max(0, openModals - 1);
      if (openModals === 0) {
        document.body.style.overflow = savedOverflow;
      }

      previousFocus?.focus({ preventScroll: true });
    }
  };
}
