import { ObjectId } from "mongodb";
import dbClient from "./dbClient";
import { badRequest, forbidden, notFound } from "./errors";

export { isOwner } from "./ownershipRules";

export function toObjectId(value: string, label = "id"): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw badRequest(`${label} inválido`, "invalid_id");
  }
  return new ObjectId(value);
}

export interface OwnedProfile {
  _id: ObjectId;
  name?: string;
  photo?: string;
  userId: ObjectId;
  [key: string]: unknown;
}

/** Devuelve el perfil solo si pertenece al usuario autenticado. */
export async function requireOwnedProfile(
  profileId: string,
  userId: string,
): Promise<OwnedProfile> {
  const profile = await dbClient.collection("profiles").findOne({
    _id: toObjectId(profileId, "profileId"),
    userId: toObjectId(userId, "userId"),
  });

  if (!profile) {
    // No distinguimos entre "no existe" y "no es tuyo" para evitar enumeración.
    throw forbidden("No tienes acceso a este perfil");
  }

  return profile as unknown as OwnedProfile;
}

/** Devuelve la lista solo si pertenece a un perfil del usuario autenticado. */
export async function requireOwnedList(
  listId: string,
  userId: string,
): Promise<Record<string, unknown>> {
  const list = await dbClient
    .collection("lists")
    .findOne({ _id: toObjectId(listId, "listId") });

  if (!list) throw notFound("Lista no encontrada");

  await requireOwnedProfile(String(list.profileId), userId);
  return list;
}

/** Verifica que el userId de la ruta coincida con el de la sesión. */
export function requireSameUser(routeUserId: string, sessionUserId: string): void {
  if (String(routeUserId) !== String(sessionUserId)) {
    throw forbidden("No puedes operar sobre otro usuario");
  }
}
