/**
 * Crea los índices declarativos sin arrancar el servidor HTTP.
 * Uso: bun run indexes:ensure
 */
import dbClient from "../src/libs/dbClient";
import { ensureIndexes } from "../src/libs/indexes";

await ensureIndexes();
await dbClient.client.close();
console.log("Índices procesados. Revisa los warnings de arriba si hubo errores.");
process.exit(0);
