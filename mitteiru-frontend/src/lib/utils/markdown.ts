import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true
});

let hooksRegistered = false;

function registerHooks(): void {
  if (hooksRegistered) return;
  hooksRegistered = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('rel', 'noopener noreferrer nofollow');
      node.setAttribute('target', '_blank');
    }
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convierte Markdown a HTML seguro. Se sanea SIEMPRE en el punto de salida:
 * los datos vienen de usuarios y de fuentes externas.
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';

  try {
    registerHooks();
    const raw = marked.parse(content) as string;
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'del', 'code', 'pre', 'blockquote',
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span'
      ],
      ALLOWED_ATTR: ['href', 'title', 'src', 'alt', 'class', 'target', 'rel'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta'],
      FORBID_ATTR: ['style', 'srcset', 'onerror', 'onload', 'onclick'],
      ALLOW_DATA_ATTR: false
    });
  } catch {
    return escapeHtml(content);
  }
}
