// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			/** JWT de usuario (cookie HttpOnly). */
			token: string | null;
			/** JWT de administrador (cookie HttpOnly). */
			adminToken: string | null;
			/** Perfil seleccionado (cookie HttpOnly). */
			profileId: string | null;
			user: {
				_id: string;
				username?: string;
				email?: string;
			} | null;
			profile: {
				_id: string;
				name: string;
				photo?: string;
			} | null;
		}
	}
}

export {};
