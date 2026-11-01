import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

/**
 * Flag de UI para el motor de fuentes externas.
 *
 * Solo se habilita en desarrollo (`vite dev`) y con la variable explícita.
 * Un build de producción queda siempre en false, aunque el `.env` local tenga
 * la variable en true. El backend es la autoridad final.
 */
export function sourcesUiEnabled(): boolean {
  return dev && env.PUBLIC_SOURCES_ENABLED === 'true';
}
