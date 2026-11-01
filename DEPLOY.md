# Despliegue del monorepo

Repositorio objetivo: **`AnibalDams/Mitteiru`** (rama `main`).

```text
Mitteiru/
├── mitteiru-frontend/        # Vercel: Root Directory = mitteiru-frontend
├── Mitteiru-backend/         # Render: Docker context = Mitteiru-backend
├── Mitteiru-sources-browser/ # Solo local; NO desplegar
├── docs/
└── docker-compose.sources.yml
```

## Orden de despliegue

1. Mergear la rama del monorepo en `main`.
2. Configurar Vercel.
3. Configurar Render.
4. Verificar frontend → backend.
5. Verificar JKAnime legacy y el bloqueo de AnimeOnsen.

## Vercel (frontend)

Proyecto existente: **`mitteiru`** (`prj_jbHIIvvJnCiyqWLLKBUfdK8zhqii`).

- **Repository:** `AnibalDams/Mitteiru`
- **Production Branch:** `main`
- **Root Directory:** `mitteiru-frontend`
- **Framework Preset:** SvelteKit
- **Install Command:** `npm ci`
- **Build Command:** `npm run build`
- **Node.js Version:** `22.x`
- **Output Directory:** dejar vacío (SvelteKit con adapter-auto)

Variables de entorno (Production, Preview y Development):

```env
API_URL=https://mitteiru-backend.onrender.com
PUBLIC_API_URL=https://mitteiru-backend.onrender.com
PUBLIC_SOURCES_ENABLED=false
PUBLIC_EMBED_HOSTS=
```

> `API_URL` es privada (solo la usa el servidor SvelteKit). `PUBLIC_*` se
> incluyen en el bundle, pero no son secretos.

## Render (backend)

Servicio existente: **`mitteiru-backend`**
(`https://mitteiru-backend.onrender.com`).

- **Repository:** `AnibalDams/Mitteiru`
- **Branch:** `main`
- **Runtime:** Docker
- **Docker Context:** `Mitteiru-backend`
- **Dockerfile Path:** `Mitteiru-backend/Dockerfile`
- **Health Check Path:** `/`
- **Auto-Deploy:** On Commit

Variables de entorno:

```env
APP_ENV=production
SOURCES_ENABLED=false
SOURCES_ALLOW_PRIVATE=false
TRUST_PROXY=1
CORS_ORIGINS=

DATABASE=<MongoDB Atlas URI>
SECRET_KEY=<secreto de al menos 32 caracteres>
PLAYBACK_TOKEN_SECRET=<secreto distinto de SECRET_KEY>
```

- No definir `SOURCES_BROWSER_URL`, `SOURCES_BROWSER_TOKEN` ni
  `FLARESOLVERR_URL`.
- No desplegar `Mitteiru-sources-browser` ni `docker-compose.sources.yml`.
- Bloquear el egress de Render hacia `animeonsen.xyz` y sus subdominios.
- Si Render está detrás de su proxy y el backend no es público, `TRUST_PROXY=1`
  permite que el BFF reenvíe la IP real del cliente.

## Verificación

```bash
# Backend vivo
curl -i https://mitteiru-backend.onrender.com/

# Frontend
curl -I https://mitteiru.vercel.app/

# AnimeOnsen apagado en producción
curl -i https://mitteiru-backend.onrender.com/sources
# → 404

# JKAnime legacy: debe conservar link/servers en la API de episodios
curl -i https://mitteiru-backend.onrender.com/anime/<id>/episode/all
```

En la UI:

1. Login y selección de perfil.
2. Abrir un anime importado desde JKAnime: el episodio debe reproducirse o
   mostrar “Abrir en JKAnime”.
3. Abrir un anime importado desde AnimeOnsen: debe mostrar “no disponible”.
4. `/admin` no debe mostrar la pestaña “Fuentes externas”.

## Rollback

- Vercel: promover el deployment anterior desde el dashboard.
- Render: redeploy del commit anterior.
- Si el monorepo falla, el repositorio anterior `Mitteiru-backend` sigue
  disponible como referencia; no se borra.
