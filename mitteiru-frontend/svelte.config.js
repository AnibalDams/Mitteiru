import adapter from '@sveltejs/adapter-auto';
import { loadEnv } from 'vite';

// El motor de fuentes solo debe estar activo en local. Si esta variable falta,
// el build queda en modo estricto (sin iframes externos). `loadEnv` permite
// leer `.env` también en `vite dev`, donde el proceso aún no lo tiene cargado.
const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production';
const fileEnv = loadEnv(mode, process.cwd(), '');
const sourcesEnabled =
  mode === 'development' &&
  (process.env.PUBLIC_SOURCES_ENABLED ?? fileEnv.PUBLIC_SOURCES_ENABLED) === 'true';
const embedHosts = (process.env.PUBLIC_EMBED_HOSTS ?? fileEnv.PUBLIC_EMBED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);
// En producción el motor está apagado, pero JKAnime legacy sigue visible.
// Cuando las fuentes están apagadas, solo se permite el host de JKAnime.
// JKAnime legacy se permite siempre en producción, aunque el `.env` no
// declare hosts (el requisito de producto es que esos episodios se vean).
const legacyHosts = ['jkanime.net'];
const frameHosts = sourcesEnabled ? embedHosts : legacyHosts;
const frameSources = [
  "'self'",
  ...frameHosts.flatMap((host) => [`https://${host}`, `https://*.${host}`])
];
const mediaSources = [
  "'self'",
  'blob:',
  ...(sourcesEnabled || frameHosts.length > 0 ? ['https:'] : [])
];

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // Force runes mode for the project, except for libraries.
    runes: ({ filename }) =>
      filename.split(/[/\\]/).includes('node_modules') ? undefined : true
  },
  kit: {
    adapter: adapter(),
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ["'self'"],
        // Svelte emite `onload`/`onerror` inline en el SSR para reproducir
        // eventos ocurridos antes de la hidratación. El hash habilita solo
        // ese handler exacto (this.__e=event), sin abrir la CSP.
        'script-src': [
          "'self'",
          "'unsafe-hashes'",
          "'sha256-7dQwUgLau1NFCCGjfn9FsYptB6ZtWxJin6VohGIu20I='"
        ],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
        'connect-src': ["'self'"],
        'media-src': mediaSources,
        'frame-src': frameSources,
        'worker-src': ["'self'", 'blob:'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"]
      }
    }
  }
};

export default config;
