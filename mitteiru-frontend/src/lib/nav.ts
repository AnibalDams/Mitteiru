import { translations, type Language } from '$lib/i18n';

export interface NavItem {
  id: 'home' | 'directory';
  href: string;
  label: Record<Language, string>;
}

/**
 * Fuente única de la navegación primaria: navbar de escritorio y tab bar móvil
 * comparten los mismos destinos y etiquetas.
 */
export const primaryNav: NavItem[] = [
  { id: 'home', href: '/', label: translations.nav.home },
  { id: 'directory', href: '/directory', label: translations.nav.directory }
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isPendingPath(target: string | undefined, href: string): boolean {
  if (!target) return false;
  return target === href || (href !== '/' && target.startsWith(`${href}/`));
}
