"use client";

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { PersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { ApolloProvider } from "@apollo/client/react";
import { Box, CircularProgress } from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NetworkConnectivityContext } from "@/frontend/context/NetworkConnectivityContext";
import { useApolloConnectivity } from "@/frontend/hooks/useApolloConnectivity";
import { InitializingUI } from "@/frontend/providers/apollo/AppApolloProviderHelpers";
import {
  createAuthLink,
  createConnectivityLink,
  createErrorLinkHandler,
  sha256,
} from "@/frontend/providers/apollo/utils";

export function AppApolloProvider({ children }: { readonly children: React.ReactNode }) {
  const t = useTranslations("common");
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
          cache: new InMemoryCache(),
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
