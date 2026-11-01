# mitteiru-backend

API REST de Mitteiru: **Express + Bun + MongoDB**.

> Guía completa del monorepo, arquitectura, variables de entorno y puesta en marcha: **[README raíz](../README.md)**.

## Desarrollo

```bash
cp .env.example .env
# Configurá DATABASE, SECRET_KEY y PORT=8000
bun install
bun run dev
```

La API queda en `http://127.0.0.1:8000`. Los índices de MongoDB se aseguran al arrancar.

### Primer administrador

```bash
ADMIN_EMAIL=admin@ejemplo.com ADMIN_PASSWORD='una-clave-de-12-o-mas' bun run create-admin
```

## Scripts

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

## Estructura

```text
index.ts                 # entrada, middleware y arranque
src/routes/              # endpoints REST
src/sources/             # motor de fuentes y adaptadores
src/libs/                # auth, db, rate limit, validación
scripts/                 # admin, índices y reportes
```

Las rutas de fuentes y la integración con el sidecar Patchright están documentadas en [docs/FUENTES.md](../docs/FUENTES.md).
