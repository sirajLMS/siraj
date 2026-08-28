"use client";

import { ApolloClient, ApolloLink } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { PersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { ApolloProvider } from "@apollo/client/react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NetworkConnectivityContext } from "@/frontend/common/context/NetworkConnectivityContext";
import { useApolloConnectivity } from "@/frontend/common/hooks/useApolloConnectivity";
import { InitializingUI } from "@/frontend/common/providers/apollo/AppApolloProviderHelpers";
import { createApolloCache } from "@/frontend/common/providers/apollo/apolloCache";
import { useAuthRecoveryRegistration } from "@/frontend/common/providers/apollo/useAuthRecoveryRegistration";
import {
  createAuthLink,
  createConnectivityLink,
  createErrorLinkHandler,
  sha256,
} from "@/frontend/common/providers/apollo/utils";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * Module-level mutable state object shared between the Apollo links and the
 * component. The links read from this object at call-time (during a request,
 * never during render), so we never access a React ref during render — we only
 * mutate this object in useEffect (after render). This satisfies the React
 * compiler's "no ref access during render" rule while still allowing synchronous
 * client creation at module scope.
 */
const apolloLinkState = {
  authToken: null as string | null,
  isConnected: false,
  checkConnectivity: (): Promise<boolean> => Promise.resolve(true),
  notifyIfDisconnected: (): void => undefined,
  setConnected: (_v: boolean): void => undefined,
  serverNotAvailableMessage: "Server not available",
};

/**
 * Apollo client is created once at module scope — available synchronously on
 * the very first render of any provider instance, with zero useEffect cycles.
 */
const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    createErrorLinkHandler(
      () => apolloLinkState.isConnected,
      v => apolloLinkState.setConnected(v),
      () => apolloLinkState.notifyIfDisconnected()
    ),
    createConnectivityLink(
      () => apolloLinkState.isConnected,
      v => apolloLinkState.setConnected(v),
      () => apolloLinkState.checkConnectivity(),
      () => apolloLinkState.notifyIfDisconnected(),
      () => apolloLinkState.serverNotAvailableMessage
    ),
    createAuthLink(() => apolloLinkState.authToken),
    new PersistedQueryLink({ sha256 }),
    // BatchHttpLink groups concurrent operations into a single POST (JSON
    // array body) — one serverless invocation per navigation burst instead
    // of one per query. Batching is enabled server-side in ALL environments,
    // including production: app/api/graphql/route.ts caps batches at
    // MAX_BATCHED_OPERATIONS and charges one rate-limit unit per operation,
    // so both sides' behavior is identical in every environment. Do NOT gate
    // this link on NODE_ENV — the client and server batching contract must
    // never diverge (a one-sided gate once caused every production GraphQL
    // call to fail with HTTP 400 "Operation batching disabled").
    // PersistedQueryLink must chain BEFORE BatchHttpLink so APQ hashes are
    // resolved before the batch is assembled.
    new BatchHttpLink({ uri: "/api/graphql", credentials: "include" }),
  ]),
  cache: createApolloCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: "none", notifyOnNetworkStatusChange: true },
    query: { errorPolicy: "none" },
    mutate: { errorPolicy: "none" },
  },
});

export function AppApolloProvider({ children }: { readonly children: React.ReactNode }) {
  const t = useAppTranslation(Translation.Common);
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

  // Sync component state into the module-level link state (in effects, not during render)
  useEffect(() => {
    apolloLinkState.isConnected = isConnected;
  }, [isConnected]);

  useEffect(() => {
    apolloLinkState.checkConnectivity = checkConnectivity;
  }, [checkConnectivity]);

  useEffect(() => {
    apolloLinkState.notifyIfDisconnected = notifyIfDisconnected;
  }, [notifyIfDisconnected]);

  useEffect(() => {
    apolloLinkState.setConnected = setConnected;
  }, [setConnected]);

  useEffect(() => {
    apolloLinkState.serverNotAvailableMessage = t.serverNotAvailable;
  }, [t.serverNotAvailable]);

  const updateAuthToken = useCallback((token: string) => {
    setAuthToken(token);
    apolloLinkState.authToken = token;
  }, []);

  const clearAuthData = useCallback(() => {
    setAuthToken(null);
    apolloLinkState.authToken = null;
  }, []);

  useAuthRecoveryRegistration(apolloClient, updateAuthToken);

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

  /**
   * Only block rendering when a disconnection is actually confirmed.
   * `initialCheckDone` starts as `false` and flips to `true` after the first
   * HEAD check (which runs in a background useEffect). By gating on
   * `initialCheckDone && !isConnected` the app renders immediately on startup —
   * the offline UI appears only when a real disconnection is detected.
   */
  if (initialCheckDone && !isConnected) {
    return <InitializingUI error={true} onRetry={() => checkConnectivity()} t={t} />;
  }

  return (
    <NetworkConnectivityContext.Provider value={contextValue}>
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </NetworkConnectivityContext.Provider>
  );
}
