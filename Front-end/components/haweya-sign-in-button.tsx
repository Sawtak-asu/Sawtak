"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { isMobileApp } from "@/lib/is-mobile";
import { apiUrl } from "@/lib/api";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";

interface HaweyaSignInButtonProps {
  className?: string;
}

export function HaweyaSignInButton({ className }: HaweyaSignInButtonProps) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("Auth");

  const handleHaweyaLogin = async () => {
    const haweyaUrl = process.env.NEXT_PUBLIC_HAWEYA_URL;
    const clientId = process.env.NEXT_PUBLIC_HAWEYA_CLIENT_ID;

    if (!haweyaUrl || !clientId) {
      toast.error(t("notConfigured", { provider: "Haweya" }));
      console.error("Missing NEXT_PUBLIC_HAWEYA_URL or NEXT_PUBLIC_HAWEYA_CLIENT_ID");
      return;
    }

    setIsLoading(true);

    try {
      const state = crypto.randomUUID(); // CSRF protection
      sessionStorage.setItem("haweya_oauth_state", state);

      const haweyaAuthUrl = new URL(`${haweyaUrl}/oauth/authorize`);
      haweyaAuthUrl.searchParams.set("client_id", clientId);
      haweyaAuthUrl.searchParams.set("response_type", "code");
      haweyaAuthUrl.searchParams.set("scope", "openid profile email");
      haweyaAuthUrl.searchParams.set("state", state);

      if (isMobileApp()) {
        // Mobile flow: use custom scheme and native browser
        const redirectUri = "sawtak://auth/haweya/callback";
        haweyaAuthUrl.searchParams.set("redirect_uri", redirectUri);

        await Browser.open({ url: haweyaAuthUrl.toString() });

        // Handle redirect back to app
        const listener = await App.addListener("appUrlOpen", async ({ url }) => {
          if (url.includes("sawtak://auth/haweya/callback")) {
            await Browser.close();
            listener.remove();
            
            const params = new URL(url).searchParams;
            const code = params.get("code");
            const returnedState = params.get("state");

            if (returnedState !== state) {
              toast.error(t("signInFailed", { provider: "Haweya" }));
              setIsLoading(false);
              return;
            }

            // Call backend callback
            const response = await fetch(apiUrl("/api/auth/haweya/callback"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code, state: returnedState }),
            });

            const data = await response.json();
            if (data.success) {
              login(data.token, data.user);
              toast.success(t("welcome", { name: data.user.name || data.user.email }));
            } else {
              toast.error(data.error || t("signInFailed", { provider: "Haweya" }));
            }
            setIsLoading(false);
          }
        });
      } else {
        // Web flow: use existing popup logic
        const redirectUri = `${window.location.origin}/auth/haweya/callback`;
        haweyaAuthUrl.searchParams.set("redirect_uri", redirectUri);

        const width = 500;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          haweyaAuthUrl.toString(),
          "haweya-signin",
          `width=${width},height=${height},left=${left},top=${top},popup=yes`
        );

        if (!popup) {
          toast.error(t("popupBlocked"));
          setIsLoading(false);
          return;
        }

        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data.type === "haweya-oauth-success") {
            window.removeEventListener("message", handleMessage);
            const { token, user } = event.data;
            login(token, user);
            toast.success(t("welcome", { name: user.name || user.email }));
            setIsLoading(false);
          } else if (event.data.type === "haweya-oauth-error") {
            window.removeEventListener("message", handleMessage);
            toast.error(event.data.error || t("signInFailed", { provider: "Haweya" }));
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
      console.error("Haweya sign-in error:", error);
      toast.error(t("errorDuringSignIn"));
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full h-11 justify-center gap-3 font-medium ${className || ''}`}
      onClick={handleHaweyaLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Image
          src="/haweya.webp"
          alt="Haweya"
          width={100}
          height={100}
          className="w-5 h-5"
        />
      )}
      {isLoading ? t("signingIn") : t("continueWithHaweya")}
    </Button>
  );
}
