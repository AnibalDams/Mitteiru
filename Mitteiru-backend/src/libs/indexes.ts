import dbClient from "./dbClient";
import { log } from "./logger";

let attempted = false;

interface IndexSpec {
  collection: string;
  keys: Record<string, 1 | -1>;
  options?: Record<string, unknown>;
}

/**
 * Índices declarativos. Son aditivos: si ya existen, MongoDB no hace nada.
 * Si un índice único falla por datos duplicados se registra el problema y se
 * continúa; el script `scripts/report-duplicates.ts` ayuda a revisarlos.
 */
const INDEXES: IndexSpec[] = [
  { collection: "user", keys: { email: 1 }, options: { unique: true, name: "uniq_user_email" } },
  { collection: "user", keys: { username: 1 }, options: { unique: true, name: "uniq_user_username" } },
  { collection: "adminUser", keys: { email: 1 }, options: { unique: true, name: "uniq_admin_email" } },
  { collection: "likes", keys: { animeId: 1, profileId: 1 }, options: { unique: true, name: "uniq_like" } },
  { collection: "commentLikes", keys: { commentId: 1, profileId: 1 }, options: { unique: true, name: "uniq_comment_like" } },
  { collection: "episodes", keys: { animeId: 1, episodeNumber: 1 }, options: { unique: true, name: "uniq_episode_number" } },
  { collection: "profiles", keys: { userId: 1 }, options: { name: "idx_profiles_user" } },
  { collection: "lists", keys: { profileId: 1 }, options: { name: "idx_lists_profile" } },
  { collection: "history", keys: { profileId: 1, date: -1 }, options: { name: "idx_history_profile_date" } },
  { collection: "reviews", keys: { animeId: 1, createdAt: -1 }, options: { name: "idx_reviews_anime" } },
  { collection: "comments", keys: { episodeId: 1, date: -1 }, options: { name: "idx_comments_episode" } },
  { collection: "sourceMappings", keys: { sourceId: 1, externalId: 1 }, options: { unique: true, name: "uniq_source_mapping" } },
];

export async function ensureIndexes(): Promise<void> {
  if (attempted) return;
  attempted = true;

  for (const spec of INDEXES) {
    try {
      await dbClient.collection(spec.collection).createIndex(spec.keys, spec.options);
    } catch (error) {
      log("warn", "index_creation_failed", {
        collection: spec.collection,
        index: spec.options?.name ?? spec.keys,
        message: error instanceof Error ? error.message : String(error),
        hint: "Revisa duplicados con scripts/report-duplicates.ts antes de reintentar.",
      });
    }
  }
}
