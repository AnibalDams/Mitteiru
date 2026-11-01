# Mitteiru Sources Browser

Sidecar de navegador stealth que usa [Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright) para resolver challenges de Cloudflare cuando el `fetch` directo del backend no alcanza.

## Qué hace

- `POST /fetch` con `{ url, cookies?, userAgent? }` → `{ status, body, cookies, userAgent, finalUrl }`.
- Espera a que el challenge de Cloudflare se resuelva (hasta 25 s por defecto).
- Reutiliza cookies (`cf_clearance`) y las devuelve al backend.
- Allowlist de dominios y token compartido para que no sea un proxy abierto.

## Ejecutar en local

```bash
cd Mitteiru-sources-browser
npm install
npx patchright install chromium
APP_ENV=local SOURCES_BROWSER_TOKEN=dev-token ALLOWED_HOSTS=animeonsen.xyz,jkanime.net npm start
```

> **Solo local:** el sidecar se niega a arrancar si `APP_ENV` no es `local`.
> No lo desplegues en producción.

Luego, en el `.env` del backend:

```env
SOURCES_BROWSER_URL=http://localhost:8787
SOURCES_BROWSER_TOKEN=dev-token
```

## Docker

```bash
docker compose -f docker-compose.sources.yml up --build
```

## Variables

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `8787` | Puerto del sidecar |
| `APP_ENV` | `production` | Debe ser `local` para arrancar |
| `SOURCES_BROWSER_TOKEN` | vacío | **Obligatorio**; exige header `x-source-token` |
| `ALLOWED_HOSTS` | `animeonsen.xyz,jkanime.net` | Dominios permitidos (sufijos incluidos) |
| `NAV_TIMEOUT_MS` | `45000` | Timeout de navegación |
| `CHALLENGE_TIMEOUT_MS` | `25000` | Espera máxima del challenge |

## Límites y seguridad

- Procesa **una página a la vez** (cola interna) para no saturar CPU/RAM.
- Rechaza URLs que no sean `http/https` o que no estén en la allowlist (anti-SSRF).
- No expongas este servicio a Internet: úsalo en local o en red privada.
- No lo despliegues en producción; el backend de producción no debe tener
  `SOURCES_BROWSER_URL` ni `SOURCES_ENABLED=true`.
- El bypass de Cloudflare no está garantizado: si el WAF bloquea por reputación de IP, necesitarás proxy residencial.
