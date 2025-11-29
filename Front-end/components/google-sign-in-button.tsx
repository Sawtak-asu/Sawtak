"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleSignInButton() {
  const { user, login, logout } = useAuth();
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("Google Sign-In script loaded");
      setIsGoogleLoaded(true);
      initializeGoogleSignIn();
    };
    script.onerror = () => {
      console.error("Failed to load Google Sign-In script");
      toast.error("Failed to load Google Sign-In. Please check your connection or ad blocker.");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      toast.error("Configuration error: Missing Google Client ID");
      return;
    }
    
    console.log("Initializing Google Sign-In with Client ID:", clientId.substring(0, 10) + "...");
    console.log("Current Origin:", window.location.origin);

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });
    }
  };

  const handleGoogleResponse = async (response: any) => {
    try {
      const idToken = response.credential;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(
        `${apiUrl}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            provider: "google",
            token: idToken 
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        login(data.data.token, data.data.user);
      } else {
        console.error("Login failed:", data.error);
        alert("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("An error occurred during sign-in. Please try again.");
    }
  };

  const handleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <UserIcon className="h-4 w-4" />
            {user.email}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.email}</span>
              <span className="text-xs text-muted-foreground">
                Role: {user.role}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={!isGoogleLoaded}
      className="gap-2"
      variant="default"
    >
      <LogIn className="h-4 w-4" />
      Sign in with Google
    </Button>
  );
}
