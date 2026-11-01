import { describe, expect, it } from 'vitest';
import { sanitizeNext } from './redirect';

describe('sanitizeNext', () => {
  it('acepta rutas internas', () => {
    expect(sanitizeNext('/anime/6adff8af916a2f0048f7ef5d')).toBe(
      '/anime/6adff8af916a2f0048f7ef5d'
    );
    expect(sanitizeNext('/anime/123?tab=episodes')).toBe('/anime/123?tab=episodes');
    expect(sanitizeNext('  /directorio  ')).toBe('/directorio');
  });

  it('descarta valores vacíos o ausentes', () => {
    expect(sanitizeNext(null)).toBeNull();
    expect(sanitizeNext(undefined)).toBeNull();
    expect(sanitizeNext('')).toBeNull();
    expect(sanitizeNext('   ')).toBeNull();
  });

  it('descarta URLs absolutas y otros esquemas', () => {
    expect(sanitizeNext('https://evil.com')).toBeNull();
    expect(sanitizeNext('http://evil.com/anime/1')).toBeNull();
    expect(sanitizeNext('javascript:alert(1)')).toBeNull();
    expect(sanitizeNext('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('descarta rutas protocol-relative', () => {
    expect(sanitizeNext('//evil.com')).toBeNull();
    expect(sanitizeNext('/\\evil.com')).toBeNull();
    expect(sanitizeNext('///evil.com')).toBeNull();
  });

  it('descarta caracteres de control y saltos de línea', () => {
    expect(sanitizeNext('/anime/1\nSet-Cookie: x=1')).toBeNull();
    expect(sanitizeNext('/anime/\u0000')).toBeNull();
  });

  it('descarta rutas de autenticación para no crear bucles', () => {
    expect(sanitizeNext('/login')).toBeNull();
    expect(sanitizeNext('/login?next=/anime/1')).toBeNull();
    expect(sanitizeNext('/signup')).toBeNull();
  });

  it('descarta valores desmesurados', () => {
    expect(sanitizeNext('/' + 'a'.repeat(600))).toBeNull();
  });
});
