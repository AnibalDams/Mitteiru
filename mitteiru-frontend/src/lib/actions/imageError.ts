/**
 * Maneja imágenes que fallan antes o después de la hidratación.
 *
 * Svelte emite `onerror` inline en el SSR para capturar errores tempranos,
 * pero una CSP estricta bloquea los event handlers inline. Con esta acción
 * el listener se registra en el cliente y, si la imagen ya falló, se dispara
 * de inmediato.
 */
export function imageError(node: HTMLImageElement, onError: () => void) {
  let handler = onError;

  function handleError() {
    handler();
  }

  node.addEventListener('error', handleError);

  // La imagen pudo fallar antes de que Svelte hidratara.
  if (node.complete && node.naturalWidth === 0) {
    handler();
  }

  return {
    update(next: () => void) {
      handler = next;
    },
    destroy() {
      node.removeEventListener('error', handleError);
    }
  };
}
