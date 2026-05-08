import { Capacitor } from "@capacitor/core";

export function isMobileApp(): boolean {
  return Capacitor.isNativePlatform();
}
