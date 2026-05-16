"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { isMobileApp } from "@/lib/is-mobile";
import { getSiteBase } from "@/lib/api";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";

interface HaweyaSignInButtonProps {
  className?: string;
}

export function HaweyaSignInButton({ className }: HaweyaSignInButtonProps) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("Auth");

  useEffect(() => {
    if (!isMobileApp()) return;

    let processing = false;

    const listener = App.addListener("appUrlOpen", async ({ url }) => {
      if (!url.includes("/auth/haweya/callback")) return;
      if (processing) return;
      processing = true;

      await Browser.close();

      const urlObj = new URL(url);
      const code = urlObj.searchParams.get("code");
      const error = urlObj.searchParams.get("error");

      if (error) {
        toast.error(`Haweya error: ${error}`);
        setIsLoading(false);
        processing = false;
        return;
      }

      if (!code) {
        toast.error("No code received");
        setIsLoading(false);
        processing = false;
        return;
      }

      try {
        const redirectUri = "https://sawtak.wearemasons.com/auth/haweya/callback";
        const response = await fetch(
          "https://privacy-proxy-layer-production.up.railway.app/api/auth/haweya/callback",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, redirect_uri: redirectUri }),
          }
        );

        const data = await response.json();

        if (data.success) {
          const token = data.data?.token;
          const user = data.data?.user;
          if (!token) {
            toast.error("No token received from server");
            return;
          }
          login(token, user);
          const name = user?.name ?? user?.email ?? "User";
          toast.success(`Welcome, ${name}`);
          // Force reload so auth context picks up the token
          setTimeout(() => window.location.href = "/en", 500);
        } else {
          toast.error(data.error || "Authentication failed");
        }
      } catch (err) {
        toast.error(`Auth failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      setIsLoading(false);
      processing = false;
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [login]);

  const handleHaweyaLogin = async () => {
    const haweyaUrl = process.env.NEXT_PUBLIC_HAWEYA_URL;
    const clientId = process.env.NEXT_PUBLIC_HAWEYA_CLIENT_ID;

    if (!haweyaUrl || !clientId) {
      toast.error(t("notConfigured", { provider: "Haweya" }));
      return;
    }

    setIsLoading(true);

    try {
      const state = crypto.randomUUID();
      localStorage.setItem("haweya_oauth_state", state);

      const haweyaAuthUrl = new URL(`${haweyaUrl}/oauth/authorize`);
      haweyaAuthUrl.searchParams.set("client_id", clientId);
      haweyaAuthUrl.searchParams.set("response_type", "code");
      haweyaAuthUrl.searchParams.set("scope", "openid profile email");
      haweyaAuthUrl.searchParams.set("state", state);

      if (isMobileApp()) {
        const redirectUri = "https://sawtak.wearemasons.com/auth/haweya/callback";
        haweyaAuthUrl.searchParams.set("redirect_uri", redirectUri);
        await Browser.open({ url: haweyaAuthUrl.toString() });
      } else {
        const siteBase = getSiteBase();
        const redirectUri = `${siteBase}/auth/haweya/callback`;
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
          const allowedOrigins = [window.location.origin, getSiteBase()].filter(Boolean);
          if (!allowedOrigins.includes(event.origin)) return;
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
