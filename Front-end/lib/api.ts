/**
 * Returns the base URL for all API calls.
 * In Capacitor (mobile), this points directly to the privacy-proxy.
 * In web, Next.js rewrites handle /api/* automatically.
 */
export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "";
}

export function getSiteBase(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return siteUrl;
  if (typeof window === 'undefined') return "";
  return window.location.origin;
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  // Ensure the path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
