"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: string;
  anonymousIdentifier: string;
  provider: string;
  name?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem("sawtak_token");
    if (storedToken) {
      verifyStoredToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyStoredToken = async (storedToken: string) => {
    try {
            const response = await fetch(
        apiUrl(`/api/auth/verify`),
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setToken(storedToken);
          setUser(data.data.user);
        } else {
          localStorage.removeItem("sawtak_token");
        }
      } else {
        localStorage.removeItem("sawtak_token");
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      localStorage.removeItem("sawtak_token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("sawtak_token", newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("sawtak_token");
    router.push("/");
  };

  const verifyToken = async (): Promise<boolean> => {
    if (!token) return false;

    try {
            const response = await fetch(
        apiUrl(`/api/auth/verify`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.success;
      }
      return false;
    } catch (error) {
      console.error("Token verification failed:", error);
      return false;
    }
  };

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isLoggedIn, login, logout, verifyToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
