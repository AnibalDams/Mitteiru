import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { badRequest } from "./errors";

/**
 * Comprueba si una IP es privada, loopback, link-local, multicast o reservada.
 * Se aplica tanto a la URL inicial como a cada redirección.
 */
export function isPrivateAddress(address: string): boolean {
  const value = address.trim().toLowerCase();
  const version = isIP(value);

  if (version === 4) {
    const [a, b] = value.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 169 && b === 254) return true; // link-local / metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 198 && b === 51) return true;
    if (a === 203 && b === 0) return true;
    if (a >= 224) return true; // multicast + reserved
    return false;
  }

  if (version === 6) {
    if (value === "::" || value === "::1") return true;
    if (value.startsWith("::ffff:")) return isPrivateAddress(value.slice(7));
    if (value.startsWith("fc") || value.startsWith("fd")) return true; // fc00::/7
    if (/^fe[89ab]/.test(value)) return true; // fe80::/10
    if (value.startsWith("ff")) return true; // multicast
    if (value.startsWith("2001:db8")) return true; // documentación
    return false;
  }

  return false;
}

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
}

export function assertAllowedHost(url: URL, allowedHosts: string[]): void {  const host = url.hostname.toLowerCase();
  const allowed = allowedHosts.some(
    (candidate) => host === candidate || host.endsWith(`.${candidate}`),
  );
  if (!allowed) {
    throw badRequest(
      `Dominio no permitido: ${normalizeHostname(url.hostname)}`,
      "host_not_allowed",
    );
  }
}

/**
 * Valida protocolo, host permitido y que el DNS no apunte a una red interna.
 * Es la barrera principal contra SSRF en el motor de fuentes.
 */
const dnsCache = new Map<string, { expiresAt: number; private: boolean }>();

export async function assertSafeUrl(
  raw: string,
  allowedHosts: string[],
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw badRequest("URL inválida", "invalid_url");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw badRequest("Solo se permiten URLs http/https", "invalid_protocol");
  }

  if (url.username || url.password) {
    throw badRequest("La URL no puede contener credenciales", "invalid_url");
  }

  assertAllowedHost(url, allowedHosts);

  const host = normalizeHostname(url.hostname);
  if (host === "localhost" || host.endsWith(".localhost")) {
    throw badRequest("Host no permitido", "host_not_allowed");
  }

  const cached = dnsCache.get(host);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.private) {
      throw badRequest("La URL apunta a una red privada", "private_address");
    }
    return url;
  }

  const addresses = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true, verbatim: true }).catch(() => []);

  if (addresses.length === 0) {
    throw badRequest("No se pudo resolver el dominio", "dns_error");
  }

  const isPrivate = addresses.some((entry) => isPrivateAddress(entry.address));
  dnsCache.set(host, { expiresAt: Date.now() + 60_000, private: isPrivate });

  if (isPrivate) {
    throw badRequest("La URL apunta a una red privada", "private_address");
  }

  return url;
}
