"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { GoogleOAuthProvider, useGoogleLogin, TokenResponse } from "@react-oauth/google";
import Cookies from "js-cookie";

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
                // Check for auth token in cookies
                const token = Cookies.get("auth_token");
                const storedUser = localStorage.getItem("user_data");

                if (token && storedUser) {
                    setUser(JSON.parse(storedUser));
                } else {
                    // If no token, clear any stale user data
                    setUser(null);
                    localStorage.removeItem("user_data");
                    Cookies.remove("auth_token");
                }
            } catch (error) {
                console.error("Session check failed", error);
                setUser(null);
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

                // Store the token in a cookie
                // Assuming the backend returns an 'access_token' or similar field
                // Adjust 'access_token' to match your actual backend response structure
                if (userData.access_token) {
                    Cookies.set("auth_token", userData.access_token, { expires: 7, secure: true, sameSite: 'strict' });
                } else if (userData.token) {
                    Cookies.set("auth_token", userData.token, { expires: 7, secure: true, sameSite: 'strict' });
                }
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
        Cookies.remove("auth_token");
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
