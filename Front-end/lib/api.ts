/**
 * Returns the base URL for all API calls.
 * In Capacitor (mobile), this points directly to the privacy-proxy.
 * In web dev, Next.js rewrites handle /api/* automatically.
 */
export function getApiBase(): string {
  // Set this in your .env file:
  // NEXT_PUBLIC_API_URL=https://your-privacy-proxy.com
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

export function apiUrl(path: string): string {
  return `${getApiBase()}${path}`;
}
