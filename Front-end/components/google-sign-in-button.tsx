"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { isMobileApp } from "@/lib/is-mobile";
import { apiUrl, getSiteBase } from "@/lib/api";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";

interface GoogleSignInButtonProps {
  className?: string;
}

export function GoogleSignInButton({ className }: GoogleSignInButtonProps) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("Auth");

  const handleGoogleLogin = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error(t("notConfigured", { provider: "Google" }));
      console.error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

    setIsLoading(true);

    try {
      const state = crypto.randomUUID(); // CSRF protection
      sessionStorage.setItem("google_oauth_state", state);

      const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      googleAuthUrl.searchParams.set("client_id", clientId);
      googleAuthUrl.searchParams.set("response_type", "code");
      googleAuthUrl.searchParams.set("scope", "email profile openid");
      googleAuthUrl.searchParams.set("state", state);
      googleAuthUrl.searchParams.set("access_type", "offline");
      googleAuthUrl.searchParams.set("prompt", "select_account");

      if (isMobileApp()) {
        const siteBase = process.env.NEXT_PUBLIC_SITE_URL || "https://sawtak.wearemasons.com";
        const redirectUri = `${siteBase}/auth/google/callback`;
        googleAuthUrl.searchParams.set("redirect_uri", redirectUri);

        await Browser.open({ url: googleAuthUrl.toString() });

        // Handle redirect back to app via App Link
        const listener = await App.addListener("appUrlOpen", async ({ url }) => {
          if (url.includes("/auth/google/callback")) {
            await Browser.close();
            listener.remove();
            
            const params = new URL(url).searchParams;
            const code = params.get("code");
            const returnedState = params.get("state");

            if (returnedState !== state) {
              toast.error(t("signInFailed", { provider: "Google" }));
              setIsLoading(false);
              return;
            }

            // Call backend callback
            const response = await fetch(apiUrl("/api/auth/google/callback"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code, state: returnedState }),
            });

            const data = await response.json();
            if (data.success) {
              login(data.token, data.user);
              toast.success(t("welcome", { name: data.user.name || data.user.email }));
            } else {
              toast.error(data.error || t("signInFailed", { provider: "Google" }));
            }
            setIsLoading(false);
          }
        });
      } else {
        // Web flow: use existing popup logic
        const siteBase = getSiteBase();
        const redirectUri = `${siteBase}/auth/google/callback`;
        googleAuthUrl.searchParams.set("redirect_uri", redirectUri);

        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          googleAuthUrl.toString(),
          "google-signin",
          `width=${width},height=${height},left=${left},top=${top},popup=yes`
        );

        if (!popup) {
          toast.error(t("popupBlocked"));
          setIsLoading(false);
          return;
        }

        const handleMessage = async (event: MessageEvent) => {
          const allowedOrigins = [window.location.origin, getSiteBase()].filter(Boolean);
          if (!allowedOrigins.includes(event.origin)) return;
          if (event.data.type === "google-oauth-success") {
            window.removeEventListener("message", handleMessage);
            const { token, user } = event.data;
            login(token, user);
            toast.success(t("welcome", { name: user.name || user.email }));
            setIsLoading(false);
          } else if (event.data.type === "google-oauth-error") {
            window.removeEventListener("message", handleMessage);
            toast.error(event.data.error || t("signInFailed", { provider: "Google" }));
            setIsLoading(false);
          }
        };

        window.addEventListener("message", handleMessage);
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener("message", handleMessage);
            setIsLoading(false);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error(t("errorDuringSignIn"));
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full h-11 justify-center gap-3 font-medium ${className || ''}`}
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {isLoading ? t("signingIn") : t("continueWithGoogle")}
    </Button>
  );
}
