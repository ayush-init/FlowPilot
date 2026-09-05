"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "../lib/types";
import { fetchCurrentUser, loginWithEmail, fetchGoogleAuthUrl, logoutUser } from "../lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  loginWithEmail: (email: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initAuth = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      console.error("Auth initialization error", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Check URL params for oauth errors or success messages
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const authError = urlParams.get("auth_error");
      const authSuccess = urlParams.get("auth_success");

      if (authError) {
        setError(`Google Sign-In failed: ${authError}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (authSuccess) {
        window.history.replaceState({}, document.title, window.location.pathname);
        initAuth();
      }
    }
  }, [initAuth]);

  const handleLoginWithEmail = async (email: string, name?: string) => {
    setError(null);
    try {
      const res = await loginWithEmail(email, name);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
      throw err;
    }
  };

  const handleLoginWithGoogle = async () => {
    setError(null);
    try {
      const res = await fetchGoogleAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error(
          "Google OAuth is not configured yet on this server. Please use Email Sign-In for the POC."
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google authentication.");
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error("Logout error", err);
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithEmail: handleLoginWithEmail,
        loginWithGoogle: handleLoginWithGoogle,
        logout: handleLogout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
