"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";

interface HaweyaSignInButtonProps {
  className?: string;
}

export function HaweyaSignInButton({ className }: HaweyaSignInButtonProps) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleHaweyaLogin = async () => {
    const haweyaUrl = process.env.NEXT_PUBLIC_HAWEYA_URL;
    const clientId = process.env.NEXT_PUBLIC_HAWEYA_CLIENT_ID;
    
    if (!haweyaUrl || !clientId) {
      toast.error("Haweya Sign-In is not configured");
      console.error("Missing NEXT_PUBLIC_HAWEYA_URL or NEXT_PUBLIC_HAWEYA_CLIENT_ID");
      return;
    }

    setIsLoading(true);

    try {
      // Build the Haweya OAuth URL
      const redirectUri = `${window.location.origin}/auth/haweya/callback`;
      const scope = "openid profile email";
      const state = crypto.randomUUID(); // CSRF protection
      
      // Store state for verification after redirect
      sessionStorage.setItem("haweya_oauth_state", state);

      const haweyaAuthUrl = new URL(`${haweyaUrl}/oauth/authorize`);
      haweyaAuthUrl.searchParams.set("client_id", clientId);
      haweyaAuthUrl.searchParams.set("redirect_uri", redirectUri);
      haweyaAuthUrl.searchParams.set("response_type", "code");
      haweyaAuthUrl.searchParams.set("scope", scope);
      haweyaAuthUrl.searchParams.set("state", state);

      // Open popup window
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
        toast.error("Popup blocked. Please allow popups for this site.");
        setIsLoading(false);
        return;
      }

      // Listen for the OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        // Verify origin
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === "haweya-oauth-success") {
          window.removeEventListener("message", handleMessage);
          
          const { token, user } = event.data;
          login(token, user);
          toast.success(`Welcome, ${user.name || user.email}!`);
          setIsLoading(false);
        } else if (event.data.type === "haweya-oauth-error") {
          window.removeEventListener("message", handleMessage);
          toast.error(event.data.error || "Haweya sign-in failed");
          setIsLoading(false);
        }
      };

      window.addEventListener("message", handleMessage);

      // Check if popup was closed without completing auth
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          setIsLoading(false);
        }
      }, 500);

    } catch (error) {
      console.error("Haweya sign-in error:", error);
      toast.error("An error occurred during sign-in");
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
          width={20} 
          height={20} 
          className="w-5 h-5"
        />
      )}
      {isLoading ? "Signing in..." : "Continue with Haweya"}
    </Button>
  );
}
