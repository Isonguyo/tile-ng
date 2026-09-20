// Canonical public origin for Tile. Sharing links and auth redirects must never
// point at a preview/staging host, so anything that is not local development
// resolves to the production domain.
export const PRODUCTION_SITE_URL = "https://tile-ng.vercel.app";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

export function siteOrigin(): string {
  if (typeof window === "undefined") return PRODUCTION_SITE_URL;

  const host = window.location.hostname;
  if (LOCAL_HOSTS.has(host) || host.endsWith(".local")) {
    return window.location.origin;
  }

  return PRODUCTION_SITE_URL;
}

export function siteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin()}${clean}`;
}
