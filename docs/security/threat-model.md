# Modelo de amenazas (resumen)

## Activos

- Cuentas de usuario y perfiles (historial, listas, progreso).
- Sesiones (JWT de usuario y de administrador).
- Catálogo y contenido (animes, episodios, reseñas, comentarios).
- Credenciales de infraestructura (MongoDB Atlas, `SECRET_KEY`, token del sidecar).
- Reputación de la IP del backend frente a las fuentes externas.

## Actores y límites de confianza

- **Visitante anónimo:** puede leer catálogo y comentarios; no puede escribir.
- **Usuario autenticado:** opera solo sobre sus perfiles, listas, historial y progreso.
- **Administrador:** gestiona catálogo, importaciones y usuarios.
- **Backend:** única autoridad de autorización; no confía en el frontend ni en cookies manipulables.
- **Sidecar de navegador:** servicio privilegiado de red; no debe exponerse a Internet.
- **Fuentes externas:** contenido no confiable (HTML/JSON, URLs y embeds).

## Amenazas principales y mitigaciones

| Amenaza | Vector | Mitigación |
|---|---|---|
| XSS almacenado | Reseñas/sinopsis con HTML | DOMPurify en render + CSP con nonce + iframe con `sandbox` |
| Robo de sesión | XSS, cookies legibles | Cookies HttpOnly/Secure/SameSite=Strict; token fuera de JS |
| IDOR/BOLA | `profileId`/`listId` manipulados | Ownership en el backend; identidad desde JWT; proyecciones |
| Escritura anónima de contenido | Endpoints sin auth | `requireAdmin` en todo CRUD de contenido |
| Fuerza bruta | Login/registro/admin | `express-rate-limit`, mensajes genéricos, contraseñas mínimas |
| SSRF | URLs de fuentes/redirecciones | Allowlist de hosts, resolución DNS, bloqueo de IPs privadas, redirects manuales |
| Abuso del scraper | `/sources/*` público | Rate limit, caché TTL, health cacheado, import admin-only, cola |
| Fuga de secretos | `.env` en imagen | `.dockerignore`, secretos en runtime, rotación |
| Inyección NoSQL | Filtros/strings | Driver oficial, `ObjectId` validado, regex escapada |
| Mass assignment | `$set` con body | Esquemas zod con allowlist de campos |
| DoS por payload | JSON/queries grandes | Límite 1 MB, paginación acotada, límites de importación |
| Clickjacking | Iframes externos | `X-Frame-Options: DENY`, `frame-ancestors 'none'` |

## Riesgos residuales aceptados

1. **`/sources/*` de lectura es público** para no romper la reproducción de
   episodios de visitantes anónimos. Mitigado con rate limit, caché y cola; se
   recomienda cuota firmada por usuario en una fase futura.
2. **Contenido de fuentes externas:** un sitio comprometido puede devolver datos
   falsos. Se validan URLs y se sanea el HTML, pero no se verifica la veracidad.
3. **DNS rebinding:** la comprobación de IP se hace antes de `fetch`; una
   resolución maliciosa entre la comprobación y la conexión sigue siendo posible.
   Mitigación adicional: proxy de salida con IP fija o `undici` con lookup fijo.
4. **`--no-sandbox` en Chromium** dentro del sidecar: se mantiene por
   compatibilidad; se compensa con red privada, `cap_drop`, `no-new-privileges`,
   límites de recursos y token obligatorio.
5. **`json.json`** contiene datos con forma de PII y no pertenece a la app.
   No se eliminó para no destruir datos del usuario; debe revisarse y retirarse.
