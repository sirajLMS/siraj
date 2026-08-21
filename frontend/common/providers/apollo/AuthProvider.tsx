"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/frontend/common/context/AuthContext";
import type { LoginMutationVariables, MeQuery_me } from "@/frontend/common/graphql/generated/gql/graphql";
import * as Document from "@/frontend/common/graphql/sharedDocuments";
import { useAuthToken } from "@/frontend/common/hooks/useAuthToken";
import { dedupedRefreshToken } from "@/frontend/common/lib/dedupedRefreshToken";
import { logger } from "@/frontend/common/lib/logger";
import { isSafeRedirect } from "@/frontend/common/lib/safeRedirect";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";
import { Translation, useAppTranslation } from "@/shared/locale";

interface AuthProviderProps {
  readonly children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const t = useAppTranslation(Translation.Auth.Login);
  const { updateAuthToken, clearAuthData } = useAuthToken();
  const client = useApolloClient();
  const [loginMutation] = useMutation(Document.loginMutationDocument);

  const [user, setUser] = useState<MeQuery_me | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    const currentUrl = `${globalThis.location.pathname}${globalThis.location.search}`;
    try {
      const { data } = await dedupedRefreshToken(() =>
        client.mutate({
          mutation: Document.refreshTokenMutationDocument,
        })
      );

      if (data?.refreshToken?.token && data.refreshToken.user) {
        updateAuthToken(data.refreshToken.token);
        setUser(data.refreshToken.user);
        setIsAuthenticated(true);
        logger.info({ caller: "AuthProvider.checkAuth" }, "[AuthRedirect] Session restored via refreshToken", {
          reason: "refreshToken returned token and user",
          currentUrl,
          userId: data.refreshToken.user.id,
        });
      } else {
        setIsAuthenticated(false);
        setUser(null);
        clearAuthData();
        logger.info({ caller: "AuthProvider.checkAuth" }, "[AuthRedirect] No active session after refreshToken", {
          reason: "refreshToken response missing token or user",
          currentUrl,
          hasRefreshTokenPayload: Boolean(data?.refreshToken),
          hasToken: Boolean(data?.refreshToken?.token),
          hasUser: Boolean(data?.refreshToken?.user),
        });
      }
    } catch (caughtError) {
      setIsAuthenticated(false);
      setUser(null);
      clearAuthData();
      logger.info({ caller: "AuthProvider.checkAuth" }, "[AuthRedirect] refreshToken mutation failed", {
        reason: "refreshToken threw an error",
        currentUrl,
        errorName: caughtError instanceof Error ? caughtError.name : "unknown",
        errorMessage: caughtError instanceof Error ? caughtError.message : String(caughtError),
      });
    } finally {
      setIsLoading(false);
    }
  }, [client, updateAuthToken, clearAuthData]);

  const logout = useCallback(() => {
    logger.info({ caller: "AuthProvider.logout" }, "[AuthRedirect] Redirecting to /logout", {
      reason: "user initiated logout",
      from: `${globalThis.location.pathname}${globalThis.location.search}`,
      to: "/logout",
    });
    // Hard navigate to the server logout route — clears httpOnly cookies +
    // DB sessions, then redirects to /login (in-memory auth drops on unload).
    window.location.replace("/logout");
  }, []);

  const login = useCallback(
    async (credentials: LoginMutationVariables, redirectUrl: string | null = null): Promise<boolean> => {
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

          const targetUrl = isSafeRedirect(redirectUrl);
          logger.info({ caller: "AuthProvider.login" }, "[AuthRedirect] Redirecting after successful login", {
            reason: "login mutation returned token and user",
            from: `${globalThis.location.pathname}${globalThis.location.search}`,
            redirectParam: redirectUrl,
            to: targetUrl,
          });
          // Perform a hard redirect to break any race conditions and ensure a clean state.
          globalThis.location.href = targetUrl;
          return true;
        } else {
          logger.error({ caller: "AuthProvider.login" }, "Login failed: No token or user in response");
          setError(t.signinFailed);
          return false;
        }
      } catch (mutationError) {
        logger.error({ caller: "AuthProvider.login" }, "Login mutation error", mutationError);
        setError(getGraphQLErrorMessage(mutationError, t.invalidLoginResponse));
        return false;
      }
    },
    [loginMutation, t, updateAuthToken]
  );

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
