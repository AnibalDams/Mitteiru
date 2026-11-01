# Runbook de seguridad

## Variables de entorno

### Backend (`Mitteiru-backend/.env`)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE` | Sí | URI de MongoDB |
| `SECRET_KEY` | Sí | 48 bytes aleatorios (`openssl rand -base64 48`) |
| `PORT` | No | 8000 por defecto |
| `USER_TOKEN_TTL` | No | 12h por defecto |
| `ADMIN_TOKEN_TTL` | No | 2h por defecto |
| `TRUST_PROXY` | Recomendada en producción | `1` en Render/Heroku; lista de CIDRs si hay varios proxies |
| `CORS_ORIGINS` | No | Vacío = sin CORS (recomendado con el BFF) |
| `SOURCES_BROWSER_URL` | No | `http://127.0.0.1:8787` |
| `SOURCES_BROWSER_TOKEN` | Si se usa sidecar | Secreto compartido, mínimo 32 caracteres |
| `SOURCES_ALLOWED_HOSTS` | No | Hosts extra para el transporte |

### Frontend (`mitteiru-frontend/.env`)

| Variable | Descripción |
|---|---|
| `API_URL` | URL privada del backend, solo servidor |
| `PUBLIC_API_URL` | Compatibilidad; el navegador ya no la usa |
| `PUBLIC_EMBED_HOSTS` | Allowlist de hosts para el iframe (coma) |

## Operaciones

### Crear el primer administrador

```bash
cd Mitteiru-backend
ADMIN_EMAIL=admin@ejemplo.com ADMIN_PASSWORD='frase-larga-y-unica' bun run create-admin
```

No existe endpoint público para crear administradores.

### Índices y duplicados

```bash
bun run indexes:report   # solo lectura
bun run indexes:ensure   # crea índices aditivos
```

Si `indexes:report` encuentra duplicados, **no** ejecutes deduplicación
automática: revisa los grupos y decide manualmente. Haz backup/snapshot antes.

### Rotación de secretos

1. Genera un nuevo `SECRET_KEY` y actualiza el entorno del backend.
2. Reinicia el backend (todas las sesiones quedan invalidadas).
3. Rota la contraseña de MongoDB Atlas y actualiza `DATABASE`.
4. Rota `SOURCES_BROWSER_TOKEN` en backend y sidecar a la vez.
5. Nunca imprimas los valores en logs ni en el chat.

### Motor de fuentes y sidecar (solo local)

- En producción: `APP_ENV=production`, `SOURCES_ENABLED=false`,
  `SOURCES_BROWSER_URL` vacío, `SOURCES_BROWSER_TOKEN` vacío y
  `FLARESOLVERR_URL` vacío. No hay break-glass: fuera de `APP_ENV=local` el
  motor queda apagado aunque `SOURCES_ENABLED=true`.
- En el frontend de producción: `PUBLIC_SOURCES_ENABLED=false`. La CSP permite
  `jkanime.net` para los episodios legacy ya importados; AnimeOnsen se redacta y
  no se reproduce.
- **No despliegues** `Mitteiru-sources-browser` ni `docker-compose.sources.yml`
  en producción. El sidecar se niega a arrancar fuera de `APP_ENV=local`.
- Bloquea el egreso del backend de producción hacia `jkanime.net`,
  `animeonsen.xyz`, `api.animeonsen.xyz` y `search.animeonsen.xyz`.
- No publicar el puerto del sidecar en `0.0.0.0`; el compose lo ata a `127.0.0.1`.
- `SOURCES_BROWSER_TOKEN` es obligatorio: el contenedor no arranca sin él.
- Si no se usa el motor de fuentes en local, deja `SOURCES_BROWSER_URL` vacío y
  no levantes el contenedor.

### Orden de despliegue

1. Backend (con `SECRET_KEY` nuevo y variables de proxy).
2. Frontend (cookies HttpOnly y proxy `/api`).
3. Verificar login, selección de perfil, listas, historial, comentarios y admin.
4. Las sesiones antiguas dejan de ser válidas: los usuarios deben re-loguearse.

## Respuesta a incidentes

1. Rota `SECRET_KEY` y `SOURCES_BROWSER_TOKEN`; invalida sesiones.
2. Rota la contraseña de la base de datos y revisa accesos.
3. Revisa logs `audit.*` y `requestId` de las peticiones sospechosas.
4. Si hay XSS: identifica el contenido, elimínalo y revisa reseñas/sinopsis.
5. Si hay abuso del scraper: baja el rate limit o desactiva `/sources` y el sidecar.
6. Si hay SSRF: revisa `sourceMappings`, logs del sidecar y reglas de red.

### Rate limiting detrás del BFF

- El frontend reenvía `X-Forwarded-For` con la IP del cliente en el proxy `/api`
  y en login/signup/admin login.
- Configura `TRUST_PROXY=1` **solo** si el backend recibe tráfico únicamente del
  BFF y no es accesible directamente desde Internet. Con varios proxies, usa la
  lista de CIDRs.
- Si el backend es público, no confíes en `X-Forwarded-For`: un cliente podría
  falsificarlo y saltarse el rate limit.
- El store de `express-rate-limit` es en memoria: con varias instancias, usa
  Redis o un limitador compartido.
