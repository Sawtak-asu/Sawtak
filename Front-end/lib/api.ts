/**
 * Returns the base URL for all API calls.
 * In Capacitor (mobile), this points directly to the privacy-proxy.
 * In web, Next.js rewrites handle /api/* automatically.
 */
export function getApiBase(): string {
  // Check if we are running inside Capacitor
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
  
  if (isCapacitor) {
    // Mobile must use the absolute URL from environment
    return process.env.NEXT_PUBLIC_API_URL || "";
  }
  
  // Web should use relative path to leverage Next.js rewrites
  return ""; 
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  // Ensure the path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
