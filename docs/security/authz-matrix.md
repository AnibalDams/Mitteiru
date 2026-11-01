# Matriz de autorización

## Modelo de sesión

| Cookie | Contenido | Flags | Uso |
|---|---|---|---|
| `session` | JWT de usuario (`aud: user`) | HttpOnly, Secure (prod), SameSite=Strict | Lo lee el servidor de SvelteKit y lo inyecta en el proxy |
| `profileId` | ObjectId del perfil activo | HttpOnly, Secure (prod), SameSite=Strict | Se valida contra `/me` y contra el backend en cada operación |
| `adminToken` | JWT de administrador (`aud: admin`) | HttpOnly, Secure (prod), SameSite=Strict, 2 h | Solo el proxy lo adjunta a rutas de admin |

El navegador **nunca** recibe un token en JavaScript ni llama directamente al backend:
todo pasa por `/api/[...path]` (same-origin) o por `+page.server.ts`.

## Reglas

1. Toda escritura exige token y, si aplica, propiedad del recurso.
2. `profileId`, `profileName` y `profileImage` nunca se confían del cliente: se
   derivan del JWT y se validan contra la colección `profiles`.
3. Los endpoints de administración exigen `aud: admin` **y** que el `_id`
   exista en `adminUser` con `accepted: true`.
4. El backend responde 401/403/404 genéricos para no filtrar existencia de
   recursos ajenos.

## Matriz

| Método | Ruta | Anónimo | Usuario | Admin | Notas |
|---|---|---|---|---|---|
| GET | `/` | ✅ | ✅ | ✅ | HTML informativo |
| GET | `/me` | ❌ | ✅ | ❌ | Usuario + perfiles propios |
| GET | `/user/decode` | ❌ | ✅ | ❌ | Devuelve el usuario del token |
| GET | `/user/d/all` | ❌ | ❌ | ✅ | Sin `password` (proyección) |
| GET | `/user/:userId/profile/d/all` | ❌ | solo `userId == sub` | ❌ | Evita enumeración |
| GET | `/user/profile/:profileId/history` | ❌ | solo propietario | ❌ | Historial privado |
| GET | `/user/profile/:profileId/list/all` | ❌ | solo propietario | ❌ | |
| GET | `/user/profile/:profileId/list/anime/all` | ❌ | solo propietario | ❌ | |
| POST | `/user/new` | ✅ (rate limit) | — | — | Registro |
| POST | `/user/login` | ✅ (rate limit) | — | — | Mensaje genérico |
| POST | `/admin/login` | ✅ (rate limit) | — | — | Mensaje genérico |
| POST | `/admin/new` | ❌ | ❌ | ✅ | Bootstrap por CLI |
| GET | `/admin/me` | ❌ | ❌ | ✅ | Identidad del admin |
| POST | `/user/:userId/profile/d/new` | ❌ | solo `userId == sub` | ❌ | |
| PUT/DELETE | `/user/profile/:profileId` | ❌ | solo propietario | ❌ | |
| POST | `/user/profile/:profileId/list/new` | ❌ | solo propietario | ❌ | |
| POST | `/anime/:animeId/list/:listId/add` | ❌ | dueño de la lista | ❌ | |
| DELETE | `/user/profile/list/:listId/anime/:animeId` | ❌ | dueño de la lista | ❌ | |
| POST | `/user/profile/:profileId/history/.../add` | ❌ | solo propietario | ❌ | |
| POST | `/anime/:animeId/like/:profileId` | ❌ | perfil propio | ❌ | |
| POST | `/anime/:animeId/review/new` | ❌ | perfil propio | ❌ | Identidad desde BD |
| POST | `/anime/episode/:episodeId/comment/new` | ❌ | perfil propio | ❌ | Identidad desde BD |
| POST | `/anime/episode/:episodeId/comment/:commentId/like/:profileId` | ❌ | perfil propio | ❌ | |
| GET/POST | `/anime/:animeId/learningProgress/:profileId` | ❌ | perfil propio | ❌ | Notas privadas |
| GET | `/anime/...`, `/anime/d/*`, `/anime/genre/*` | ✅ | ✅ | ✅ | Catálogo público |
| GET | `/anime/episode/:id/comment/*` | ✅ | ✅ | ✅ | Comentarios públicos |
| POST | `/anime/new` | ❌ | ❌ | ✅ | |
| POST | `/anime/:animeId/episode/new` | ❌ | ❌ | ✅ | |
| PUT/DELETE | `/anime/:animeId` | ❌ | ❌ | ✅ | |
| PUT/DELETE | `/anime/episode/:episodeId` | ❌ | ❌ | ✅ | |
| POST | `/anime/:animeId/character/new` | ❌ | ❌ | ✅ | |
| GET | `/sources/*` (lectura) | ✅ (rate limit) | ✅ | ✅ | Necesario para reproducir episodios anónimos |
| POST | `/sources/:id/import` | ❌ | ❌ | ✅ | |
| POST | `/anime/episode/:id/servers/refresh` | ❌ | ❌ | ✅ | |
| GET | `/anime/:animeId/sources` | ✅ | ✅ | ✅ | Solo mapeos |
| DELETE | `/user/:userId` | ❌ | ❌ | ✅ | Borra usuario y perfiles |
