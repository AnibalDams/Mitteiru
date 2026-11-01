import { env } from '$env/dynamic/private';
import { createApiClient } from '$lib/api/client';

/**
 * URL privada del backend. El navegador nunca la ve: solo el servidor de
 * SvelteKit y el proxy same-origin.
 */
export const API_URL =
  env.API_URL ||
  env.PUBLIC_API_URL ||
  'http://127.0.0.1:8000';

/** Crea un cliente con el token de la sesión actual y la IP del cliente. */
export function serverApi(token?: string | null, clientIp?: string) {
  return createApiClient({ baseUrl: API_URL, token, clientIp });
}
