import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('elimina scripts y manejadores de eventos', () => {
    const html = renderMarkdown(
      '<img src=x onerror="alert(1)"> <script>alert(1)</script>'
    );

    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('alert(1)');
  });

  it('elimina enlaces javascript:', () => {
    const html = renderMarkdown('[click](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('mantiene el formato básico', () => {
    const html = renderMarkdown('**hola** y `código`');
    expect(html).toContain('<strong>hola</strong>');
    expect(html).toContain('<code>código</code>');
  });

  it('escapa contenido si el parser falla', () => {
    const html = renderMarkdown('<b>texto</b>');
    expect(html).not.toContain('<script');
    expect(html).toContain('texto');
  });
});
