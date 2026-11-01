/**
 * Crea (o actualiza) el primer administrador.
 *
 * Uso:
 *   ADMIN_EMAIL=admin@ejemplo.com ADMIN_PASSWORD='...' bun run create-admin
 *
 * No se expone por HTTP: evita que cualquiera pueda registrarse como admin.
 */
import bcrypt from "bcrypt";
import dbClient from "../src/libs/dbClient";
import { ensureIndexes } from "../src/libs/indexes";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Define ADMIN_EMAIL y ADMIN_PASSWORD en el entorno.");
  process.exit(1);
}

if (password.length < 12) {
  console.error("La contraseña de administrador debe tener al menos 12 caracteres.");
  process.exit(1);
}

const collection = dbClient.collection("adminUser");
const passwordHash = await bcrypt.hash(password, 12);

const existing = await collection.findOne({ email });
if (existing) {
  await collection.updateOne(
    { _id: existing._id },
    {
      $set: { password: passwordHash, accepted: true },
      // Invalida sesiones emitidas con la contraseña anterior.
      $inc: { tokenVersion: 1 },
    },
  );
  console.log(`Administrador actualizado: ${email}`);
} else {
  await collection.insertOne({ email, password: passwordHash, accepted: true });
  console.log(`Administrador creado: ${email}`);
}

await ensureIndexes();
await dbClient.client.close();
process.exit(0);
