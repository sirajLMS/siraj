"use client";

import type React from "react";
import { useEffect, useMemo } from "react";
import { AuthContext } from "@/frontend/common/context/AuthContext";
import { useAuthSession } from "@/frontend/common/providers/apollo/AuthProvider.hooks";

interface AuthProviderProps {
  readonly children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isAuthenticated, isLoading, error, login, logout, checkAuth } = useAuthSession();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [checkAuth]);

  const contextValue = useMemo(
    () => ({ user, isAuthenticated, isLoading, error, login, logout }),
    [user, isAuthenticated, isLoading, error, login, logout]
  );

  /**
   * Render `children` immediately — the auth check (`refreshToken`) runs in a
   * background effect. Consumers of `useAuth()` see `isLoading: true` until
   * the check resolves, but the app shell is not gated on it. The full-viewport
   * blocking UI is reserved for refresh-failure cases (not a normal load path),
   * surfaced via the `error` state when applicable.
   */
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
