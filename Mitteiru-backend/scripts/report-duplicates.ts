/**
 * Reporte READ-ONLY de duplicados que impedirían crear índices únicos.
 * No modifica ningún documento.
 *
 * Uso: bun run indexes:report
 */
import dbClient from "../src/libs/dbClient";

interface Check {
  collection: string;
  field: string;
  hint: string;
}

const checks: Check[] = [
  { collection: "user", field: "email", hint: "Emails duplicados" },
  { collection: "user", field: "username", hint: "Usernames duplicados" },
  { collection: "adminUser", field: "email", hint: "Emails de admin duplicados" },
  { collection: "episodes", field: "animeId+episodeNumber", hint: "Episodios repetidos por anime" },
  { collection: "likes", field: "animeId+profileId", hint: "Likes duplicados" },
  { collection: "commentLikes", field: "commentId+profileId", hint: "Likes de comentario duplicados" },
  { collection: "sourceMappings", field: "sourceId+externalId", hint: "Mapeos de fuente duplicados" },
];

function groupFor(field: string): Record<string, unknown> {
  if (field === "animeId+episodeNumber") {
    return { _id: { animeId: "$animeId", episodeNumber: "$episodeNumber" } };
  }
  if (field === "animeId+profileId") {
    return { _id: { animeId: "$animeId", profileId: "$profileId" } };
  }
  if (field === "commentId+profileId") {
    return { _id: { commentId: "$commentId", profileId: "$profileId" } };
  }
  if (field === "sourceId+externalId") {
    return { _id: { sourceId: "$sourceId", externalId: "$externalId" } };
  }
  return { _id: `$${field}` };
}

let problems = 0;

for (const check of checks) {
  const duplicates = await dbClient
    .collection(check.collection)
    .aggregate([
      groupFor(check.field),
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
      { $project: { _id: 1, count: 1 } },
    ])
    .toArray();

  if (duplicates.length === 0) {
    console.log(`OK   ${check.collection}.${check.field}`);
    continue;
  }

  problems += duplicates.length;
  console.log(`DUP  ${check.collection}.${check.field} — ${check.hint}`);
  for (const duplicate of duplicates) {
    console.log(`     ${JSON.stringify(duplicate._id)} x${duplicate.count}`);
  }
}

await dbClient.client.close();
console.log(
  problems === 0
    ? "Sin duplicados: se pueden crear los índices únicos."
    : `Se encontraron ${problems} grupos duplicados. Revisa manualmente antes de deduplicar.`,
);
process.exit(problems === 0 ? 0 : 2);
