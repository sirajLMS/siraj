"use client";

import { useMutation } from "@apollo/client/react";
import { ErrorOutlined as ErrorIcon } from "@mui/icons-material";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MutationLoginArgs, User } from "@/frontend/graphql/generated/gql/graphql-types";
import * as Document from "@/frontend/graphql/sharedDocuments";
import { AuthContext } from "../../context/AuthContext";
import { useAuthToken } from "../../hooks/useAuthToken";
import logger from "../../lib/logger";

// A simple UI for the initial loading state
const LoadingUI: React.FC<{
  onRetry: () => void;
  error?: string | null;
  t: ReturnType<typeof useTranslations<"auth.login">>;
}> = ({ onRetry, error, t }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: 2,
    }}
  >
    {error ? (
      <>
        <ErrorIcon
          sx={{
            fontSize: 48,
            color: theme => theme.palette.error.main,
          }}
        />
        <Typography
          gutterBottom
          sx={{
            color: theme => theme.palette.error.main,
          }}
        >
          {error}
        </Typography>
        <Button variant="contained" onClick={onRetry} sx={{ mt: 2 }}>
          {t("tryAgain")}
        </Button>
      </>
    ) : (
      <CircularProgress size={48} />
    )}
  </Box>
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTranslations("auth.login");
  const { updateAuthToken, clearAuthData } = useAuthToken();
  const [loginMutation] = useMutation(Document.loginMutationDocument);
  const [logoutMutation] = useMutation(Document.logoutMutationDocument);
  const [refreshTokenMutation] = useMutation(Document.refreshTokenMutationDocument);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await refreshTokenMutation();

      if (data?.refreshToken?.token && data.refreshToken.user) {
        updateAuthToken(data.refreshToken.token);
        setUser(data.refreshToken.user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        clearAuthData();
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      clearAuthData();
    }
  }, [refreshTokenMutation, updateAuthToken, clearAuthData]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation();
    } finally {
      clearAuthData();
      // Perform a hard redirect to ensure all state is cleared.
      globalThis.location.href = "/login";
    }
  }, [logoutMutation, clearAuthData]);

  const login = useCallback(
    async (credentials: MutationLoginArgs, redirectUrl: string | null = null): Promise<boolean> => {
      setError(null);
      try {
        const { data } = await loginMutation({
          variables: { input: credentials.input },
        });

        if (data?.login?.token && data.login.user) {
          updateAuthToken(data.login.token);

          // Access token is stored in React context state only (memory)
          // Refresh token and session ID are set via httpOnly cookies
          // by the server automatically. They are NOT in the response body
          // for security reasons (prevents XSS attacks).

          // Perform a hard redirect to break any race conditions and ensure a clean state.
          globalThis.location.href = redirectUrl || "/dashboard";
          return true;
        } else {
          logger.error({ caller: "AuthProvider.login" }, "Login failed: No token or user in response");
          setError(t("signinFailed"));
          return false;
        }
      } catch (mutationError) {
        logger.error({ caller: "AuthProvider.login" }, "Login mutation error", mutationError);
        // Log error for debugging without using console
        setError(t("invalidLoginResponse"));
        return false;
      }
    },
    [loginMutation, t, updateAuthToken]
  );

  useEffect(() => {
    const performInitialCheck = async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    };

    void performInitialCheck();
  }, [checkAuth]);

  const contextValue = useMemo(
    () => ({ user, isAuthenticated, isLoading, error, login, logout }),
    [user, isAuthenticated, isLoading, error, login, logout]
  );

  if (isLoading) {
    return <LoadingUI onRetry={checkAuth} error={error} t={t} />;
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
