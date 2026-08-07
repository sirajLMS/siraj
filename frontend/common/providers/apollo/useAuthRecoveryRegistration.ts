"use client";

import type { ApolloClient } from "@apollo/client";
import { useCallback, useEffect } from "react";
import { refreshTokenMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { dedupedRefreshToken } from "@/frontend/common/lib/dedupedRefreshToken";
import { logger } from "@/frontend/common/lib/logger";
import { registerAuthRecovery, unregisterAuthRecovery } from "@/frontend/common/providers/apollo/utils";

/**
 * Wires the auth recovery API into the shared errorLink.
 *
 * Registered once the Apollo client exists so the errorLink can fire a
 * refreshToken mutation BEFORE hard-redirecting to /login on a
 * UNAUTHENTICATED GraphQL response. This closes the production-only
 * logout-on-navigation bug where the 15-min access_token cookie expires
 * while the 7-day refresh_token cookie is still valid.
 */
export function useAuthRecoveryRegistration(
  apolloClient: ApolloClient | null,
  updateAuthToken: (token: string) => void
): void {
  const refresh = useCallback(async (): Promise<string | null> => {
    if (!apolloClient) return null;
    // Refresh can still rotate the access_token cookie via the httpOnly
    // refresh_token cookie even when no in-memory token exists (e.g. after
    // a hard F5 reload cleared React memory). No early-return.
    try {
      const result = await dedupedRefreshToken(() => apolloClient.mutate({ mutation: refreshTokenMutationDocument }));
      const newToken = result.data?.refreshToken?.token ?? null;
      if (newToken) {
        updateAuthToken(newToken);
      }
      return newToken;
    } catch {
      return null;
    }
  }, [apolloClient, updateAuthToken]);

  useEffect(() => {
    if (!apolloClient) return;

    const reFetch = (): void => {
      // `false` = do not force a network-only refetch — re-issue the
      // active observable queries with their existing fetch policies but
      // with the new Authorization header that authLink will now read
      // from the in-memory token. The caller (recoverFromUnauthenticated
      // in utils.ts) wraps this in try/catch, so sync throws propagate
      // there; async rejection is handled by .catch() below.
      apolloClient.refetchObservableQueries(false).catch(() => {
        // Swallow — the redirect/recovery logic must not throw if Apollo
        // refuses to re-issue (e.g. during teardown).
      });
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
  }, [apolloClient, refresh]);
}
