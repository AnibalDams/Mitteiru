# Motor de fuentes externas

Mitteiru puede importar animes y episodios desde sitios externos mediante un motor de fuentes estandarizado, inspirado en el modelo de extensiones de Mihon/Tachiyomi pero implementado como adaptadores tipados en el backend.

> **Alcance:** se importan **metadatos** y **enlaces de reproducción externa** (embed o link). Mitteiru no rehostea ni proxya video. El scraping puede estar limitado por los ToS de cada sitio; el operador es responsable de su uso.
>
> **Solo local (importante):** el motor de fuentes se habilita únicamente con
> `APP_ENV=local` + `SOURCES_ENABLED=true` en el backend (no hay break-glass) y
> `PUBLIC_SOURCES_ENABLED=true` en el frontend. En producción queda apagado:
> todas las rutas `/sources/*`, el refresco de servidores y el playback de
> AnimeOnsen responden `404`, no se despliega el sidecar y la API pública
> redacta `link`/`servers` de AnimeOnsen y fuentes desconocidas. **Excepción de
> producto:** los episodios ya importados desde JKAnime se mantienen visibles y
> reproducibles en producción; el frontend debe configurar
> `PUBLIC_EMBED_HOSTS=jkanime.net`. Motivo: la carga de Chromium, scraping,
> reintentos y resolución de Cloudflare no es viable en producción y amplía la
> superficie de ataque.

## Arquitectura

```
Frontend (SvelteKit)
  └─ /admin → pestaña "Fuentes externas"
        │
        ▼
Backend (Express + Bun)
  └─ src/sources/
       ├─ types.ts          Contrato SourceAdapter + DTOs normalizados
       ├─ registry.ts       Registro de fuentes (agregar = 1 archivo + 1 línea)
       ├─ http.ts           Transporte: fetch → sidecar → FlareSolverr
       ├─ cache.ts          Caché TTL en memoria
       ├─ rateLimit.ts      Límite por host
       ├─ import.ts         Importación idempotente a MongoDB
       ├─ selection.ts      Filtro puro de episodios
       ├─ health.ts         Health checks normalizados
       └─ adapters/
            ├─ animeonsen.ts / animeonsen.parser.ts
            └─ jkanime.ts   / jkanime.parser.ts
        │
        ▼
Sidecar (opcional) Mitteiru-sources-browser
  └─ Patchright + Chromium → resuelve Cloudflare
```

La UI y las rutas **no conocen** el HTML de cada sitio: solo consumen DTOs (`SourceAnime`, `SourceEpisode`, `SourceServer`).

## Contrato de una fuente

Cada adaptador implementa:

| Método | Obligatorio | Descripción |
|---|---|---|
| `search(query, page)` | Sí | Búsqueda remota |
| `catalog(sort, page)` | No | Catálogo (`popular` / `latest`) |
| `getAnime(externalId)` | Sí | Ficha del anime |
| `getEpisodes(externalId)` | Sí | Lista de episodios |
| `getServers(animeId, episodeId)` | No | Embeds/servidores |
| `healthCheck()` | Sí | Estado de la fuente |

Los DTOs viven en `Mitteiru-backend/src/sources/types.ts`. Los parsers son funciones puras que reciben HTML/JSON y se prueban con fixtures, sin red.

## Cómo agregar una fuente nueva

1. Crea `src/sources/adapters/mifuente.parser.ts` con funciones puras:
   - `parseMifuenteCards(html, ctx, page)`
   - `parseMifuenteAnime(html, externalId, ctx)`
   - `parseMifuenteEpisodes(html, externalId, ctx)`
   - `parseMifuenteServers(html, ctx)`
2. Crea `src/sources/adapters/mifuente.ts` implementando `SourceAdapter`.
   - Normaliza y valida los `externalId` (nunca los uses crudos en una URL).
   - Usa `this.http.getText()` / `getJson()` (ya incluye caché, rate limit y Cloudflare).
   - Si la fuente usa un API en otro host, pásalo en `allowedHosts`; para sesiones usa `getCookie` y para POST JSON `postJsonBody`.
3. Regístrala en `src/sources/registry.ts`:
   ```ts
   const mifuente = new MiFuenteSource(
     createSourceHttp({ sourceId: "mifuente", baseUrl: "https://mifuente.net" }),
   );
   return [animeonsen, jkanime, mifuente];
   ```
4. Agrega fixtures y tests en `src/sources/__tests__/parsers.test.ts`.
5. Ejecuta:
   ```bash
   cd Mitteiru-backend
   bun test
   bun run typecheck
   ```
6. Verifica en vivo:
   ```bash
   curl "http://localhost:3000/sources?health=true"
   curl "http://localhost:3000/sources/mifuente/search?q=naruto"
   ```

No hace falta tocar rutas ni frontend: la UI lista las fuentes desde el registro.

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/sources` | — | Fuentes registradas (`?health=true` ejecuta checks) |
| GET | `/sources/:id/health` | — | Estado de una fuente |
| GET | `/sources/:id/search?q=&page=` | — | Búsqueda remota |
| GET | `/sources/:id/catalog?sort=&page=` | — | Catálogo remoto |
| GET | `/sources/:id/anime/:externalId` | — | Ficha remota |
| GET | `/sources/:id/anime/:externalId/episodes` | — | Episodios remotos |
| GET | `/sources/:id/anime/:externalId/episode/:episodeExternalId/servers` | — | Servidores/embeds |
| POST | `/sources/:id/import` | Admin | Importa anime + episodios |
| GET | `/anime/:animeId/sources` | — | Mapeos del anime local |
| POST | `/anime/episode/:episodeId/servers/refresh` | Admin | Refresca servidores |

Las rutas `GET` de fuentes son públicas **solo en local** (con rate limit de
60 req/min por IP) para que la página de un episodio pueda resolver servidores
durante el desarrollo. En producción el middleware `requireSourcesEnabled`
responde `404` antes de tocar la red. La importación y el refresco exigen
`Authorization: Bearer <token admin>` con `aud: admin`. El token se firma en
`/admin/login` y el frontend lo guarda en una cookie HttpOnly a través de
`/api/admin/login`; nunca en `localStorage`.

El import usa `Authorization: Bearer <token de admin>` (`POST /admin/login`). La pestaña de fuentes del panel admin incluye el login.

### Ejemplo de import

```bash
curl -X POST http://localhost:3000/sources/jkanime/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "externalId": "naruto",
    "importEpisodes": true,
    "episodeNumbers": [1, 2, 3]
  }'
```

Respuesta:

```json
{
  "message": "Anime importado correctamente",
  "animeId": "65f...",
  "createdAnime": true,
  "episodesImported": 3,
  "episodesUpdated": 0,
  "episodesSkipped": 0,
  "sourceId": "jkanime",
  "externalId": "naruto",
  "warnings": []
}
```

## Modelo de datos

Se agregaron campos **opcionales** (no rompen datos existentes):

- `anime.sourceId`, `anime.sourceUrl`, `anime.externalIds[]`, `anime.lastSyncedAt`
- `episodes.sourceId`, `episodes.externalId`, `episodes.animeExternalId`, `episodes.servers[]`, `episodes.updatedAt`
- Colección `sourceMappings`: `{ sourceId, externalId, localAnimeId, sourceUrl, createdAt, updatedAt }` con índice único `(sourceId, externalId)`.

La importación es idempotente:

1. Busca mapeo `(sourceId, externalId)`.
2. Si no hay, busca por nombre exacto (case-insensitive).
3. Si no existe, crea el anime con `Anime.new()` (géneros incluidos).
4. Los episodios se hacen upsert por `(animeId, episodeNumber)`.
5. No pisa campos manuales no vacíos; solo completa vacíos.

## Notas por fuente (validadas en vivo)

### JKAnime (`jkanime.net`)

- **Búsqueda:** `/buscar/{query}/{page}/` con tarjetas server-rendered.
- **Catálogo:** `/directorio/?p={page}` embebe el JSON `var animes = { current_page, data[], next_page_url, per_page, total }`. El parser lo extrae con un contador de llaves (no con regex frágil).
- **Ficha:** título en `.anime__details__content h3`, sinopsis en `p.scroll`, metadatos en `.anime_data li` (`Tipo`, `Generos`, `Studios`, `Temporada`, `Episodios`, `Estado`).
- **Episodios:** `POST /ajax/episodes/{internalId}/{page}` con `_token` (CSRF del `<meta name="csrf-token">`). Devuelve `{ total, data: [{ number, id, image }] }`.
  - Para series largas se consultan 3 páginas (miniaturas) y el resto se completa con el contador `Episodios: N`, evitando 20+ peticiones.
  - Fallback: enlaces `/{slug}/{n}/` del HTML y, por último, el contador de la ficha.
- **Servidores:** la página inyecta `video[0] = '<iframe src="https://jkanime.net/jkplayer/um?e=...">'`. Se emparejan con los nombres de `.servers[data-id]` (`Desu`, `Magi`, etc.). Se descartan plantillas JS sin resolver (`?u='+val.remote+'`).
- **On-demand:** si un episodio importado no tiene servidores guardados, la página del episodio los resuelve al abrirse (una petición por episodio) en lugar de bloquear la importación de series largas.
- **Salud:** puede devolver `521` si el origen cae; el health check lo reporta como `down`.

### AnimeOnsen (`animeonsen.xyz`)

- **Acceso:** sitio accesible desde esta red; Cloudflare delante pero sin challenge para el HTML/API.
- **Sesión/API:** la API v4 exige `Authorization: Bearer <JWT>`. El JWT se deriva de la cookie `ao.session`:
  `base64(cookie) → string → +1 a cada carácter → JWT`. El adaptador la obtiene del homepage, la cachea hasta `exp` y la renueva ante `401`.
- **Catálogo:** `GET /v4/content/index?start=&limit=` → `{ cursor: { next: [bool, ...] }, content: [...] }`. El índice está ordenado por fecha de alta; la API no expone un orden por popularidad, así que `popular` y `latest` comparten el mismo listado.
- **Búsqueda:** Meilisearch en `search.animeonsen.xyz`, índice `content`; el token público se lee de `<meta name="ao-search-token">` en `/search/{query}`.
- **Ficha:** `GET /v4/content/{id}/extensive` → título, sinopsis, géneros, estudio, score, estado y total de episodios.
- **Episodios:** `GET /v4/content/{id}/episodes` → objeto `{ "1": { contentTitle_episode_en, ... } }`.
- **Reproducción:** `GET /v4/content/{id}/video/{n}` (con JWT, server-side) devuelve el MPD y subtítulos. El CDN exige `Referer` del sitio y bloquea orígenes desconocidos, así que el backend firma una URL de playback HMAC (`PLAYBACK_TOKEN_SECRET`, 6 horas) y expone `/api/sources/animeonsen/playback/{token}/manifest.mpd`. El frontend reproduce con `dash.js`; el backend proxya el MPD y los segmentos al CDN con el `Referer` correcto y soporte de `Range`. El JWT nunca llega al navegador.
- **Fallback:** si la API de video falla, se devuelve la página `/watch/{id}?episode={n}` con `kind: "link"` y la UI ofrece abrirla en pestaña nueva.
- **Imágenes:** `https://api.animeonsen.xyz/v4/image/210x300/{id}` y `1200x360`.

## Cloudflare y anti-bot

Cadena de transporte (`src/sources/http.ts`):

1. `fetch` directo con headers de navegador, cookies y reintentos.
2. Si detecta challenge (`403/503`, `cf-mitigated`, "Just a moment"): llama al sidecar Patchright.
3. Si no hay sidecar: FlareSolverr/Byparr (`FLARESOLVERR_URL`).
4. Si tampoco: error `blocked` con hint accionable.

Recomendaciones:

- **Usa el sidecar** (`docker-compose.sources.yml`) solo si una fuente devuelve un challenge de Cloudflare. FlareSolverr es un fallback útil pero menos mantenido.
- `cf_clearance` está atado a **IP + User-Agent**. El cliente conserva cookies por fuente, pero si cambias de IP necesitas un proxy residencial.
- **animeonsen** no requiere sidecar: el adaptador obtiene su propia sesión y usa la API v4 directamente.
- **jkanime** puede devolver `521` si su origen está caído; el health check lo reporta y la UI no se rompe.
- No hay bypass garantizado: Cloudflare cambia reglas. El sistema degrada con errores claros.

## Variables de entorno

| Variable | Local | Producción | Uso |
|---|---|---|---|
| `APP_ENV` | `local` | `production` | Política fail-closed del motor |
| `SOURCES_ENABLED` | `true` | `false` | Habilita rutas/import/playback |
| `SOURCES_BROWSER_URL` | `http://127.0.0.1:8787` | vacío | Sidecar (Cloudflare) |
| `SOURCES_BROWSER_TOKEN` | token aleatorio | vacío | Token compartido con el sidecar |
| `FLARESOLVERR_URL` | opcional | vacío | Alternativa compatible con `/v1` |
| `SOURCES_ALLOWED_HOSTS` | vacío | vacío | Hosts extra permitidos (coma) |
| `SOURCES_ALLOW_PRIVATE` | `false` | `false` | Solo tests locales |
| `PLAYBACK_TOKEN_SECRET` | aleatorio | aleatorio o vacío | HMAC para playback |
| `PUBLIC_SOURCES_ENABLED` (frontend) | `true` | `false` | UI y CSP de embeds |
| `PUBLIC_EMBED_HOSTS` (frontend) | hosts de prueba | vacío | Allowlist de iframes |

Ver `Mitteiru-backend/.env.example` y `mitteiru-frontend/.env.example`.
**No despliegues `docker-compose.sources.yml` ni `Mitteiru-sources-browser` en producción.**

## Pruebas

```bash
cd Mitteiru-backend
bun test          # parsers, registro, health, selección
bun run typecheck # tsc --noEmit
```

```bash
cd mitteiru-frontend
npm run check
npm run build
```

Los tests de parsers usan fixtures locales, así que pasan aunque los sitios estén bloqueados o caídos. La validación en vivo es manual y depende del acceso a cada fuente.
