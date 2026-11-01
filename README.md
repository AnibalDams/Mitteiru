# Mitteiru

**Plataforma de anime autoalojada: catálogo, perfiles, listas, historial, reseñas y panel de administración.**

[![CI](https://github.com/AnibalDams/Mitteiru/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/AnibalDams/Mitteiru/actions/workflows/frontend-ci.yml)
![Estado](https://img.shields.io/badge/estado-desarrollo%20activo-f59e0b)
![SvelteKit](https://img.shields.io/badge/SvelteKit-2-FF3E00?logo=svelte&logoColor=white)
![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.4-000000?logo=bun&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)

<p align="center">
  <img src="docs/screenshots/home.png" alt="Home de Mitteiru" width="100%" />
</p>

## Contenido

- [Qué es Mitteiru](#qué-es-mitteiru)
- [Características](#características)
- [Capturas](#capturas)
- [Arquitectura](#arquitectura)
- [API (resumen)](#api-resumen)
- [Stack](#stack)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos](#requisitos)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts](#scripts)
- [Testing y CI](#testing-y-ci)
- [Problemas comunes](#problemas-comunes)
- [Seguridad](#seguridad)
- [Motor de fuentes](#motor-de-fuentes)
- [Diseño y UX](#diseño-y-ux)
- [Documentación](#documentación)
- [Estado y limitaciones](#estado-y-limitaciones)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Qué es Mitteiru

Mitteiru es una aplicación full-stack para organizar y reproducir anime desde un catálogo propio. Combina un frontend SvelteKit con SSR y BFF, una API Express/Bun sobre MongoDB y un motor de fuentes externas que normaliza metadatos y enlaces de reproducción.

El navegador nunca habla directamente con el backend ni ve el JWT: SvelteKit actúa como único punto de entrada, guarda la sesión en cookies `HttpOnly` y reenvía las peticiones por un proxy same-origin.

> **Alcance:** Mitteiru no aloja video. Importa metadatos y enlaces de fuentes externas; el playback DASH de AnimeOnsen pasa por un proxy firmado para resolver CORS y cookies. El operador es responsable de cumplir los términos de cada sitio.

## Características

| Módulo | Qué incluye |
|---|---|
| **Catálogo** | Home con destacado, últimos lanzamientos, populares y más queridos. Directorio con filtros por género, estado, estudio y año, orden y paginación. Búsqueda por título. |
| **Ficha de anime** | Póster, metadatos, sinopsis Markdown, géneros, likes, reseñas y episodios en carrusel o grilla. |
| **Reproducción** | Video nativo, DASH con `dashjs` y embeds externos. Selección de servidores, anterior/siguiente, pantalla completa e historial automático. |
| **Cuenta y perfiles** | Registro e inicio de sesión, perfiles múltiples con avatar, listas públicas o privadas, alta/movimiento/baja de animes e historial filtrable por fecha. |
| **Comunidad** | Reseñas con editor Markdown y vista previa, comentarios por episodio y likes en animes. |
| **Administración** | Alta de animes y episodios, panel de fuentes externas con búsqueda, catálogo, salud e importación, y sesión de administrador separada. |
| **Experiencia** | Tema oscuro, i18n español/inglés, selector de idioma, toasts, skeletons, View Transitions, movimiento reducido, foco visible y modales accesibles. |

## Capturas

<p align="center">
  <img src="docs/screenshots/directory.png" alt="Directorio de anime con filtros" width="49%" />
  <img src="docs/screenshots/anime-detail.png" alt="Ficha de anime" width="49%" />
</p>

<p align="center">
  <sub>Directorio con filtros por género, estado, estudio y año. Ficha con sinopsis, géneros, acciones y episodios.</sub>
</p>

<p align="center">
  <img src="docs/screenshots/episode.png" alt="Reproductor de episodio" width="49%" />
  <img src="docs/screenshots/language-menu.png" alt="Selector de idioma" width="49%" />
</p>

<p align="center">
  <sub>Reproductor con selección de servidores y navegación entre episodios. Selector de idioma español/inglés.</sub>
</p>

<p align="center">
  <img src="docs/screenshots/mobile-home.png" alt="Home en móvil" width="31%" />
  <img src="docs/screenshots/mobile-directory.png" alt="Directorio en móvil" width="31%" />
  <img src="docs/screenshots/mobile-menu.png" alt="Menú móvil con selector de idioma" width="31%" />
</p>

<p align="center">
  <sub>Home, directorio y menú móvil con búsqueda y selector de idioma.</sub>
</p>

<p align="center">
  <sub>Capturas de la versión actual del frontend, tomadas a 1440×900 y 390×844.</sub>
</p>

## Arquitectura

```text
┌──────────────┐        HTTPS         ┌────────────────────────────┐
│  Navegador   │ ───────────────────► │ SvelteKit (SSR + BFF)      │
│              │ ◄─────────────────── │ cookies HttpOnly           │
└──────────────┘                      └──────────────┬─────────────┘
                                                     │ /api/* same-origin
                                                     ▼
                                      ┌────────────────────────────┐
                                      │ Express + Bun              │
                                      │ JWT · Zod · rate limits    │
                                      └───────┬────────────┬───────┘
                                              │            │
                                         MongoDB      Motor de fuentes
                                                      (fetch + caché)
                                                           │
                                              ┌────────────▼───────────┐
                                              │ Sidecar Patchright      │
                                              │ (Cloudflare, opcional)  │
                                              └────────────────────────┘
```

- **SvelteKit** renderiza en servidor, ejecuta los `load` con el token de la cookie y expone `/api/*` como proxy.
- **Express/Bun** valida, autoriza y persiste. El token de admin y el de usuario son cookies distintas.
- **MongoDB** guarda usuarios, perfiles, animes, episodios, listas, historial, reseñas y comentarios.
- **Motor de fuentes** traduce sitios externos a DTOs (`SourceAnime`, `SourceEpisode`, `SourceServer`); la UI no conoce el HTML de cada sitio.
- **Sidecar** resuelve challenges de Cloudflare cuando el `fetch` directo no alcanza. Es opcional y no debe exponerse a Internet.

## Despliegue

El repositorio es un monorepo. En Vercel el proyecto debe usar
`Root Directory = mitteiru-frontend`; en Render, `Mitteiru-backend` con Docker.
La guía completa está en [DEPLOY.md](DEPLOY.md).

## API (resumen)

El frontend consume el backend a través del BFF; el navegador nunca llama a estos endpoints directamente.

| Prefijo | Responsabilidad |
|---|---|
| `/anime` | Catálogo, fichas, filtros, episodios, reseñas, comentarios, likes, personajes y progreso de aprendizaje. |
| `/user` | Registro, login, perfiles, listas e historial. |
| `/sources` | Motor de fuentes: búsqueda, catálogo, salud, importación y playback DASH. |
| `/me` | Sesión actual y perfiles del usuario. |
| `/admin` | Login y gestión de administradores. |

Las rutas de administración del BFF (`/anime/new`, `/anime/:id/episode/new`, `/sources/:id/import`, etc.) exigen `adminToken`; el resto usa `session`.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4, TypeScript, Vite |
| Backend | Bun, Express 4, MongoDB Driver, Zod, JWT, bcrypt, Helmet |
| Fuentes externas | Adaptadores tipados, caché TTL, rate limit por host, Patchright |
| Tests | Vitest, Playwright, `bun test` + Supertest + `mongodb-memory-server` |
| Infraestructura | Docker para el sidecar, GitHub Actions para el frontend |

## Estructura del repositorio

```text
Mitteiru/
├── mitteiru-frontend/            # SvelteKit: UI, SSR y BFF
│   ├── src/routes/               # páginas, load functions y /api
│   ├── src/lib/components/       # layout, anime, ui, admin, comments
│   ├── src/lib/api/              # cliente HTTP tipado
│   ├── src/lib/server/           # API_URL y cliente server-side
│   ├── src/lib/stores/           # toasts
│   ├── src/lib/utils/            # movimiento, markdown, redirects
│   ├── e2e/                      # Playwright
│   └── static/
├── Mitteiru-backend/             # Express + Bun + MongoDB
│   ├── index.ts                  # entrada, middleware y arranque
│   ├── src/routes/               # endpoints REST
│   ├── src/sources/              # motor de fuentes y adaptadores
│   ├── src/libs/                 # auth, db, rate limit, validación
│   └── scripts/                  # admin, índices y reportes
├── Mitteiru-sources-browser/     # sidecar Patchright
├── design/                       # mockups HTML de referencia
├── docs/                         # fuentes, seguridad y capturas
├── .github/workflows/            # CI del frontend
└── docker-compose.sources.yml    # sidecar en Docker
```

## Requisitos

- **Node.js 22+** y npm 10+ para el frontend (el CI usa Node 22).
- **Bun 1.2+** para el backend.
- **MongoDB 7+** local o una base en MongoDB Atlas.
- **Docker** solo si vas a usar el sidecar de fuentes.
- Navegador Chromium para Playwright (`npx playwright install chromium`) y Patchright (`npx patchright install chromium`).

## Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/AnibalDams/Mitteiru.git
cd Mitteiru
```

### 2. Backend

```bash
cd Mitteiru-backend
cp .env.example .env
```

Editá `.env` como mínimo:

```env
PORT=8000
DATABASE=mongodb+srv://usuario:password@cluster.mongodb.net/mitteiru
SECRET_KEY=una-clave-aleatoria-de-48-bytes
```

Generá el secreto con `openssl rand -base64 48`. Instalá y levantá:

```bash
bun install
bun run dev
```

El backend queda en `http://127.0.0.1:8000`. Los índices de MongoDB se aseguran al arrancar.

### 3. Primer administrador (opcional)

```bash
ADMIN_EMAIL=admin@ejemplo.com ADMIN_PASSWORD='una-clave-de-12-o-mas' bun run create-admin
```

El script crea o actualiza el administrador. No hay registro público de admins.

### 4. Frontend

En otra terminal:

```bash
cd mitteiru-frontend
cp .env.example .env
```

Verificá que `API_URL` apunte al backend:

```env
API_URL=http://127.0.0.1:8000
```

Instalá y levantá:

```bash
npm ci
npm run dev
```

Abrí `http://localhost:5173`.

> En Windows, `cp` se reemplaza por `Copy-Item`; el resto de los comandos es igual.

### 5. Sidecar de fuentes (opcional)

Solo hace falta para fuentes que exigen resolver Cloudflare. En la raíz:

```bash
export SOURCES_BROWSER_TOKEN=dev-token
docker compose -f docker-compose.sources.yml up --build
```

Y en el `.env` del backend:

```env
SOURCES_BROWSER_URL=http://127.0.0.1:8787
SOURCES_BROWSER_TOKEN=dev-token
```

También podés correrlo sin Docker:

```bash
cd Mitteiru-sources-browser
npm install
npx patchright install chromium
SOURCES_BROWSER_TOKEN=dev-token ALLOWED_HOSTS=animeonsen.xyz,jkanime.net npm start
```

El sidecar escucha en `127.0.0.1:8787` y no debe exponerse a Internet.

> En PowerShell, definí las variables con `$env:SOURCES_BROWSER_TOKEN='dev-token'` antes de `npm start` o de `docker compose`.

## Variables de entorno

### Backend (`Mitteiru-backend/.env`)

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `PORT` | No | `8000` | Puerto HTTP de la API. Debe coincidir con `API_URL`. |
| `APP_ENV` | No | `production` | `local` habilita el motor de fuentes; `production` lo apaga. |
| `SOURCES_ENABLED` | No | `false` | Solo tiene efecto si `APP_ENV=local`. |
| `DATABASE` | **Sí** | — | URI de MongoDB. |
| `SECRET_KEY` | **Sí** | — | Firma de JWT. Usá al menos 48 bytes aleatorios. |
| `PLAYBACK_TOKEN_SECRET` | No | `SECRET_KEY` | Secreto para firmar URLs de playback. |
| `USER_TOKEN_TTL` | No | `12h` | Duración de la sesión de usuario. |
| `ADMIN_TOKEN_TTL` | No | `2h` | Duración de la sesión de admin. |
| `TRUST_PROXY` | No | vacío | Proxies de confianza para `req.ip` (`1` o CIDRs). |
| `CORS_ORIGINS` | No | vacío | Orígenes permitidos. Vacío = sin CORS (recomendado con el BFF). |
| `SOURCES_BROWSER_URL` | No | — | URL del sidecar Patchright. |
| `SOURCES_BROWSER_TOKEN` | No | — | Token compartido con el sidecar. |
| `SOURCES_ALLOW_PRIVATE` | No | `false` | Permite hosts privados en tests locales. |
| `FLARESOLVERR_URL` | No | — | Fallback compatible con FlareSolverr/Byparr. |
| `SOURCES_ALLOWED_HOSTS` | No | vacío | Hosts extra permitidos por el transporte de fuentes. |

### Frontend (`mitteiru-frontend/.env`)

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `API_URL` | No | `http://127.0.0.1:8000` | URL privada del backend; solo la usa el servidor de SvelteKit. |
| `PUBLIC_API_URL` | No | — | Compatibilidad legacy; el navegador ya no la usa. |
| `PUBLIC_SOURCES_ENABLED` | No | `false` | `true` solo en desarrollo; en producción la UI de fuentes queda apagada. |
| `PUBLIC_EMBED_HOSTS` | No | vacío | Allowlist de iframes separada por comas. Vacío = ningún host externo (deny by default). En producción JKAnime legacy se permite por código. |

### Sidecar (`Mitteiru-sources-browser`)

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `PORT` | No | `8787` | Puerto del sidecar. |
| `SOURCES_BROWSER_TOKEN` | **Sí** en Docker | — | Token que el backend envía en `x-source-token`. |
| `ALLOWED_HOSTS` | No | `animeonsen.xyz,jkanime.net` | Dominios permitidos (sufijos incluidos). |
| `NAV_TIMEOUT_MS` | No | `45000` | Timeout de navegación. |
| `CHALLENGE_TIMEOUT_MS` | No | `25000` | Espera máxima del challenge de Cloudflare. |

## Scripts

### Frontend

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `5173`. |
| `npm run build` | Build de producción. |
| `npm run preview` | Previsualiza el build. |
| `npm run check` | `svelte-check` + TypeScript. |
| `npm run check:watch` | Igual, en modo watch. |
| `npm run test:unit` | Tests unitarios con Vitest. |
| `npm run test:e2e` | Tests E2E con Playwright. |

### Backend

| Comando | Qué hace |
|---|---|
| `bun run dev` | API en modo watch. |
| `bun start` | API en modo normal. |
| `bun test` | Tests con Bun + Supertest. |
| `bun run typecheck` | `tsc --noEmit`. |
| `bun run create-admin` | Crea o actualiza un administrador. |
| `bun run indexes:ensure` | Asegura índices de MongoDB. |
| `bun run indexes:report` | Reporta duplicados. |
| `bun run format` | Formatea con Prettier. |

### Sidecar

| Comando | Qué hace |
|---|---|
| `npm start` | Levanta el servidor Patchright. |

## Testing y CI

```bash
# Frontend
cd mitteiru-frontend
npm run check
npm run test:unit
npm run test:e2e

# Backend
cd Mitteiru-backend
bun test
bun run typecheck
```

Los tests E2E de seguridad necesitan un backend sembrado y estas variables; si faltan, se marcan como *skipped*:

```env
E2E_USER_EMAIL=
E2E_USER_PASSWORD=
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
E2E_BASE_URL=http://127.0.0.1:4173
```

El workflow [Frontend CI](.github/workflows/frontend-ci.yml) ejecuta `check`, tests unitarios, build y `npm audit --audit-level=high` en cada push y pull request.

> Si Playwright no puede levantar el servidor en Windows, iniciá Vite con `npm run dev -- --host 127.0.0.1 --port 4173` y corré los tests con `E2E_BASE_URL=http://127.0.0.1:4173 npm run test:e2e`.

## Problemas comunes

| Síntoma | Causa probable / solución |
|---|---|
| `No se pudo contactar al backend` en la UI | El backend no está corriendo o `API_URL` no coincide con su `PORT`. |
| Timeout al conectar MongoDB | Revisá `DATABASE`, la red de Atlas y la allowlist de IP. |
| Playwright no levanta el servidor | Vite puede estar escuchando en `localhost`; usá `--host 127.0.0.1 --port 4173` y `E2E_BASE_URL`. |
| Una fuente externa falla o queda bloqueada | Revisá `SOURCES_BROWSER_URL`/`SOURCES_BROWSER_TOKEN` y el health check en el panel de admin. |
| Un embed no carga | Revisá la CSP, el protocolo `http/https` y `PUBLIC_EMBED_HOSTS`. |
| El login no persiste | En producción las cookies son `Secure`; el sitio debe servirse por HTTPS. |

## Seguridad

- **Sesiones:** JWT en cookies `HttpOnly`, `SameSite=Strict` y `Secure` en producción. El navegador nunca ve el token.
- **BFF:** `/api/*` valida prefijo permitido, origen y `Sec-Fetch-Site`; las rutas de admin exigen `adminToken`; limita el cuerpo a 2 MB y el timeout a 30 s.
- **CSP:** política estricta con nonce en `svelte.config.js`; `frame-src` e `img-src` limitados a `https:` y hashes para los handlers que Svelte emite en SSR.
- **API:** Helmet, CORS deshabilitado por defecto, rate limits para auth/signup/admin/fuentes/playback, validación con Zod y errores centralizados que no filtran detalles internos.
- **Contenido:** Markdown sanitizado con DOMPurify; embeds validados por protocolo y, opcionalmente, por allowlist de hosts.
- **Fuentes:** allowlist de dominios y token compartido en el sidecar; contenedor de solo lectura, sin capabilities y con límites de memoria.
- **Documentación:** [modelo de amenazas](docs/security/threat-model.md), [matriz de autorización](docs/security/authz-matrix.md) y [runbook](docs/security/runbook.md).

## Motor de fuentes

El motor convierte cada sitio externo en un adaptador tipado con `search`, `catalog`, `getAnime`, `getEpisodes`, `getServers` y `healthCheck`. Incluye caché TTL, rate limit por host, importación idempotente y un contrato de DTOs que la UI consume sin conocer el HTML.

- Guía completa: [docs/FUENTES.md](docs/FUENTES.md)
- Sidecar: [Mitteiru-sources-browser/README.md](Mitteiru-sources-browser/README.md)

## Diseño y UX

El frontend usa un sistema de tokens (superficies, acento, radios, sombras y movimiento) en `src/routes/layout.css`, un helper de movimiento en `src/lib/utils/motion.ts` y componentes compartidos para navbar, skeletons, toasts, modales y estados vacíos.

Incluye View Transitions con fallback, barra de progreso de navegación, feedback optimista con rollback, toasts accesibles, selección de idioma ES/EN, foco visible y soporte de `prefers-reduced-motion`.

Los mockups originales que guiaron la interfaz están en `design/` (HTML de referencia, no forman parte del build).

Más detalle: [mitteiru-frontend/README.md](mitteiru-frontend/README.md).

## Documentación

| Documento | Contenido |
|---|---|
| [docs/FUENTES.md](docs/FUENTES.md) | Arquitectura del motor de fuentes y cómo agregar un adaptador. |
| [docs/security/threat-model.md](docs/security/threat-model.md) | Modelo de amenazas. |
| [docs/security/authz-matrix.md](docs/security/authz-matrix.md) | Matriz de autorización por rol. |
| [docs/security/runbook.md](docs/security/runbook.md) | Operación y respuesta a incidentes. |
| [mitteiru-frontend/README.md](mitteiru-frontend/README.md) | Guía específica del frontend. |
| [Mitteiru-backend/README.md](Mitteiru-backend/README.md) | Guía rápida del backend. |
| [Mitteiru-sources-browser/README.md](Mitteiru-sources-browser/README.md) | Sidecar Patchright. |

## Estado y limitaciones

- Proyecto en **desarrollo activo**; la API y la UI pueden cambiar sin aviso.
- No se aloja video: se importan metadatos y enlaces; el playback DASH puede pasar por un proxy firmado. El scraping está sujeto a los términos de cada sitio.
- El bypass de Cloudflare del sidecar no está garantizado; depende de la reputación de la IP.
- El idioma elegido se mantiene en memoria y vuelve a español al recargar.
- El sidecar procesa una página a la vez para no saturar CPU/RAM.

## Contribuir

1. Creá una rama desde la rama por defecto del repositorio, con un nombre descriptivo.
2. Mantené un cambio lógico por commit y usá *Conventional Commits*.
3. Antes de abrir un PR, ejecutá las verificaciones que correspondan:

   ```bash
   # Frontend
   cd mitteiru-frontend
   npm run check
   npm run test:unit

   # Backend
   cd Mitteiru-backend
   bun test
   bun run typecheck
   ```

4. No commitees `.env`, tokens ni capturas con datos personales.
5. Describí en el PR el problema, el enfoque y cómo lo probaste.

## Licencia

Este repositorio no incluye un archivo `LICENSE`. No se concede una licencia de uso o redistribución salvo autorización expresa del autor.

## Créditos

Construido con [SvelteKit](https://kit.svelte.dev/), [Svelte](https://svelte.dev/), [Tailwind CSS](https://tailwindcss.com/), [Bun](https://bun.sh/), [Express](https://expressjs.com/), [MongoDB](https://www.mongodb.com/), [Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright), [dashjs](https://github.com/Dash-Industry-Forum/dash.js), [marked](https://marked.js.org/) y [DOMPurify](https://github.com/cure53/DOMPurify). Tipografía: [Inter](https://rsms.me/inter/).

Mitteiru no está afiliado a los estudios, distribuidoras o plataformas de streaming cuyos contenidos o marcas puedan aparecer en el catálogo. Las marcas pertenecen a sus respectivos dueños.
