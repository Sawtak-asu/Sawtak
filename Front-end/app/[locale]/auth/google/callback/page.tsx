"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing sign-in...");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      // Check for errors from Google
      if (error) {
        setStatus("error");
        setMessage(`Authentication failed: ${error}`);
        window.opener?.postMessage({ type: "google-oauth-error", error }, window.location.origin);
        setTimeout(() => window.close(), 2000);
        return;
      }

      // Verify state matches (CSRF protection)
      const savedState = sessionStorage.getItem("google_oauth_state");
      if (state && state !== savedState) {
        setStatus("error");
        setMessage("Invalid state parameter. Please try again.");
        window.opener?.postMessage({ type: "google-oauth-error", error: "Invalid state" }, window.location.origin);
        setTimeout(() => window.close(), 2000);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("No authorization code received.");
        window.opener?.postMessage({ type: "google-oauth-error", error: "No code" }, window.location.origin);
        setTimeout(() => window.close(), 2000);
        return;
      }

      try {
        // Exchange code for tokens via our backend
                const redirectUri = `${window.location.origin}/auth/google/callback`;

        const response = await fetch(`/api/auth/google/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage("Sign-in successful! Closing...");
          
          // Send success message to parent window
          window.opener?.postMessage(
            { 
              type: "google-oauth-success", 
              token: data.data.token, 
              user: data.data.user 
            }, 
            window.location.origin
          );
          
          // Close popup after short delay
          setTimeout(() => window.close(), 1000);
        } else {
          setStatus("error");
          setMessage(data.error || "Authentication failed");
          window.opener?.postMessage({ type: "google-oauth-error", error: data.error }, window.location.origin);
          setTimeout(() => window.close(), 2000);
        }
      } catch (err) {
        console.error("Callback error:", err);
        setStatus("error");
        setMessage("An error occurred during authentication.");
        window.opener?.postMessage({ type: "google-oauth-error", error: "Network error" }, window.location.origin);
        setTimeout(() => window.close(), 2000);
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">{message}</p>
          </div>
        )}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">{message}</p>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
