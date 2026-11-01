import { prefersReducedMotion } from '$lib/utils/motion';

interface RevealOptions {
  /** Retardo en ms para escalonar secciones. */
  delay?: number;
  /** Desplazamiento inicial en px. */
  y?: number;
}

/**
 * Revela un bloque cuando entra en viewport. El estado inicial se aplica
 * recién en el cliente, así que sin JS el contenido sigue visible.
 */
export function reveal(node: HTMLElement, options: RevealOptions = {}) {
  if (prefersReducedMotion()) return;

  const { delay = 0, y = 14 } = options;
  const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';

  node.style.opacity = '0';
  node.style.transform = `translateY(${y}px)`;
  node.style.transition = `opacity 600ms ${easing} ${delay}ms, transform 600ms ${easing} ${delay}ms`;
  node.style.willChange = 'opacity, transform';

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        node.style.opacity = '1';
        node.style.transform = 'none';
        observer.disconnect();

        window.setTimeout(() => {
          node.style.willChange = '';
        }, 600 + delay);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}
