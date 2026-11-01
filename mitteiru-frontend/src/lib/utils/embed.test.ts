import { describe, expect, it } from 'vitest';
import { isLocalPlaybackSrc, sanitizeEmbedSrc, sanitizeMediaSrc } from './embed';

const localOnly = { allowExternal: false, allowedHosts: [] as string[] };
const external = { allowExternal: true, allowedHosts: ['jkanime.net', 'animeonsen.xyz'] };

describe('sanitizeEmbedSrc', () => {
  it('acepta rutas locales', () => {
    expect(sanitizeEmbedSrc('/api/playback/manifest.mpd', localOnly)).toBe(
      '/api/playback/manifest.mpd'
    );
  });

  it('rechaza URLs protocol-relative', () => {
    expect(sanitizeEmbedSrc('//evil.example/x', localOnly)).toBe('');
    expect(sanitizeEmbedSrc('/\\evil.example/x', localOnly)).toBe('');
  });

  it('rechaza javascript/data en embeds', () => {
    expect(sanitizeEmbedSrc('javascript:alert(1)', external)).toBe('');
    expect(sanitizeEmbedSrc('data:text/html,<script>alert(1)</script>', external)).toBe('');
  });

  it('rechaza externos si allowExternal es false', () => {
    expect(sanitizeEmbedSrc('https://jkanime.net/x', localOnly)).toBe('');
  });

  it('acepta externos solo si el host está en la allowlist', () => {
    expect(sanitizeEmbedSrc('https://jkanime.net/x', external)).toBe('https://jkanime.net/x');
    expect(sanitizeEmbedSrc('https://sub.jkanime.net/x', external)).toBe(
      'https://sub.jkanime.net/x'
    );
    expect(sanitizeEmbedSrc('https://evil.example/x', external)).toBe('');
  });

  it('deny by default si la allowlist está vacía', () => {
    expect(
      sanitizeEmbedSrc('https://jkanime.net/x', { allowExternal: true, allowedHosts: [] })
    ).toBe('');
  });
});

describe('sanitizeMediaSrc', () => {
  it('acepta rutas locales y http(s) con allowExternal', () => {
    expect(sanitizeMediaSrc('/static/video.mp4', false)).toBe('/static/video.mp4');
    expect(sanitizeMediaSrc('https://cdn.example/video.mp4', true)).toBe(
      'https://cdn.example/video.mp4'
    );
  });

  it('rechaza externos sin allowExternal y esquemas peligrosos', () => {
    expect(sanitizeMediaSrc('https://cdn.example/video.mp4', false)).toBe('');
    expect(sanitizeMediaSrc('javascript:alert(1)', true)).toBe('');
    expect(sanitizeMediaSrc('//evil.example/video.mp4', true)).toBe('');
  });
});

describe('isLocalPlaybackSrc', () => {
  it('acepta solo rutas locales seguras', () => {
    expect(isLocalPlaybackSrc('/api/sources/animeonsen/playback/x/manifest.mpd')).toBe(true);
    expect(isLocalPlaybackSrc('//evil.example/x')).toBe(false);
    expect(isLocalPlaybackSrc('/\\evil.example/x')).toBe(false);
    expect(isLocalPlaybackSrc('https://evil.example/x')).toBe(false);
  });
});
