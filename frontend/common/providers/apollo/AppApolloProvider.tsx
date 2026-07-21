"use client";

import { ApolloClient, ApolloLink, HttpLink } from "@apollo/client";
import { PersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { ApolloProvider } from "@apollo/client/react";
import { Box, CircularProgress } from "@mui/material";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NetworkConnectivityContext } from "@/frontend/common/context/NetworkConnectivityContext";
import { refreshTokenMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useApolloConnectivity } from "@/frontend/common/hooks/useApolloConnectivity";
import { dedupedRefreshToken } from "@/frontend/common/lib/dedupedRefreshToken";
import logger from "@/frontend/common/lib/logger";
import { InitializingUI } from "@/frontend/common/providers/apollo/AppApolloProviderHelpers";
import { createApolloCache } from "@/frontend/common/providers/apollo/apolloCache";
import {
  createAuthLink,
  createConnectivityLink,
  createErrorLinkHandler,
  registerAuthRecovery,
  sha256,
  unregisterAuthRecovery,
} from "@/frontend/common/providers/apollo/utils";
import { useAppTranslation } from "@/shared/locale";

export function AppApolloProvider({ children }: { readonly children: React.ReactNode }) {
  const t = useAppTranslation().commonTranslations;
  const {
    isConnected,
    isChecking,
    lastChecked,
    initialCheckDone,
    checkConnectivity,
    setConnected,
    notifyIfDisconnected,
  } = useApolloConnectivity();

  const [authToken, setAuthToken] = useState<string | null>(null);
  const authTokenRef = useRef<string | null>(null);

  // Stable callback refs for Apollo Links
  const getIsConnectedRef = useRef(() => isConnected);
  const checkConnectivityRef = useRef(checkConnectivity);
  const notifyIfDisconnectedRef = useRef(notifyIfDisconnected);
  const setConnectedWithRefRef = useRef((v: boolean) => {
    setConnected(v);
  });

  // Update refs when values change
  useEffect(() => {
    getIsConnectedRef.current = () => isConnected;
  }, [isConnected]);

  useEffect(() => {
    checkConnectivityRef.current = checkConnectivity;
  }, [checkConnectivity]);

  useEffect(() => {
    notifyIfDisconnectedRef.current = notifyIfDisconnected;
  }, [notifyIfDisconnected]);

  // Auth token management functions
  const updateAuthToken = useCallback((token: string) => {
    setAuthToken(token);
    authTokenRef.current = token;
  }, []);

  const clearAuthData = useCallback(() => {
    setAuthToken(null);
    authTokenRef.current = null;
  }, []);

  // Create Apollo client
  const [apolloClient, setApolloClient] = useState<ApolloClient | null>(null);

  useEffect(() => {
    if (apolloClient != null) {
      // Register the recovery API that the errorLink callbacks into when a
      // GraphQL query returns UNAUTHENTICATED. This lets the errorLink run a
      // refreshToken mutation BEFORE hard-redirecting to /login, so prod
      // users whose 15-min access_token cookie has expired (but whose 7-day
      // refresh_token cookie is still valid) stay logged in on navigation
      // — closing the production-only logout-on-navigation bug.
      const refresh = async (): Promise<string | null> => {
        // Refresh can still rotate the access_token cookie via the httpOnly
        // refresh_token cookie even when authTokenRef.current is null (e.g.
        // after a hard F5 reload cleared React memory). No early-return.
        try {
          const result = await dedupedRefreshToken(() =>
            apolloClient.mutate({ mutation: refreshTokenMutationDocument })
          );
          const newToken = result.data?.refreshToken?.token ?? null;
          if (newToken) {
            updateAuthToken(newToken);
          }
          return newToken;
        } catch {
          return null;
        }
      };

      const reFetch = (): void => {
        // `false` = do not force a network-only refetch — re-issue the
        // active observable queries with their existing fetch policies but
        // with the new Authorization header that authLink will now read
        // from authTokenRef.current.
        try {
          apolloClient.reFetchObservableQueries(false).catch(() => {
            // Swallow — the redirect/recovery logic must not throw if Apollo
            // refuses to re-issue (e.g. during teardown).
          });
        } catch {
          // Swallow — same reason as above, for synchronous throws.
        }
      };

      registerAuthRecovery({ refresh, reFetch });
      try {
        logger.info({ caller: "apollo.AppApolloProvider", force: true }, "[AuthRedirect] authRecovery registered", {
          hasClient: true,
        });
      } catch {
        // defensive: never let a logging failure swallow the recovery wiring
      }
      return () => {
        unregisterAuthRecovery();
      };
    }
  }, [apolloClient, updateAuthToken]);

  useEffect(() => {
    if (apolloClient == null) {
      const httpLink = new HttpLink({
        uri: "/api/graphql",
        credentials: "include",
      });

      const authLink = createAuthLink(() => authTokenRef.current);

      const connectivityCheckLink = createConnectivityLink(
        () => getIsConnectedRef.current(),
        setConnectedWithRefRef.current,
        checkConnectivityRef.current,
        notifyIfDisconnectedRef.current
      );

      const errorLink = createErrorLinkHandler(
        () => getIsConnectedRef.current(),
        setConnectedWithRefRef.current,
        notifyIfDisconnectedRef.current
      );

      const persistedQueryLink = new PersistedQueryLink({ sha256 });

      setApolloClient(
        new ApolloClient({
          link: ApolloLink.from([errorLink, connectivityCheckLink, authLink, persistedQueryLink, httpLink]),
          cache: createApolloCache(),
          defaultOptions: {
            watchQuery: {
              errorPolicy: "none",
              notifyOnNetworkStatusChange: true,
            },
            query: {
              errorPolicy: "none",
            },
            mutate: {
              errorPolicy: "none",
            },
          },
        })
      );
    }
  }, [apolloClient]);

  const contextValue = useMemo(
    () => ({
      isConnected,
      isChecking,
      lastChecked,
      checkConnectivity,
      setConnected,
      notifyIfDisconnected,
      authToken,
      updateAuthToken,
      clearAuthData,
    }),
    [
      isConnected,
      isChecking,
      lastChecked,
      checkConnectivity,
      setConnected,
      notifyIfDisconnected,
      authToken,
      updateAuthToken,
      clearAuthData,
    ]
  );

  if (!apolloClient) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!initialCheckDone || !isConnected) {
    const hasError = initialCheckDone && !isConnected;
    return <InitializingUI error={hasError} onRetry={() => checkConnectivity()} t={t} />;
  }

  return (
    <NetworkConnectivityContext.Provider value={contextValue}>
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </NetworkConnectivityContext.Provider>
  );
}
