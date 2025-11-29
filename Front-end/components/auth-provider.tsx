"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { GoogleOAuthProvider, useGoogleLogin, TokenResponse } from "@react-oauth/google";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

interface User {
    // Define your user properties here based on what the backend returns
    email: string;
    name?: string;
    picture?: string;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderContent({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                // Here you would typically check for a stored token or hit a 'me' endpoint
                // For now, we'll simulate a check or check localStorage
                const storedUser = localStorage.getItem("user_data");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error("Session check failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse: TokenResponse) => {
            setIsLoading(true);
            try {
                console.log("Google login success", tokenResponse);
                // Send the provider data to the backend
                const response = await fetch("http://localhost:8000/auth/google", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(tokenResponse),
                });
                if (!response.ok) {
                    throw new Error("Backend authentication failed");
                }
                const userData = await response.json();
                // Update state
                setUser(userData);
                localStorage.setItem("user_data", JSON.stringify(userData));
            } catch (error) {
                console.error("Failed to authenticate with backend:", error);
                // Handle error (e.g., show toast)
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => {
            console.error("Google Login Failed");
            setIsLoading(false);
        },
    });

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user_data");
        // Optionally call backend logout endpoint
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isLoggedIn: !!user,
                login: googleLogin,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <GoogleOAuthProvider clientId={CLIENT_ID}>
            <AuthProviderContent>{children}</AuthProviderContent>
        </GoogleOAuthProvider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
