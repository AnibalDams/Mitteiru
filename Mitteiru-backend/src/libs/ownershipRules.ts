/** Reglas puras de propiedad (sin acceso a base de datos). */
export function isOwner(ownerId: unknown, userId: string): boolean {
  return String(ownerId) === String(userId);
}
