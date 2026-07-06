"use client";

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { useCallback } from "react";
import {
  endImpersonationMutationDocument,
  impersonationStatusQueryDocument,
  meQueryDocument,
  startImpersonationMutationDocument,
} from "@/frontend/graphql/sharedDocuments/auth.documents";
import { useAuthToken } from "@/frontend/hooks/useAuthToken";
import { useUserStore } from "@/frontend/stores/userStore";
import logger from "@/frontend/lib/logger";

export function useImpersonation() {
  const client = useApolloClient();
  const { updateAuthToken } = useAuthToken();
  const setUser = useUserStore(state => state.setUser);

  const { data, loading, refetch } = useQuery(impersonationStatusQueryDocument, {
    fetchPolicy: "network-only",
  });

  const [startMutation, { loading: starting }] = useMutation(startImpersonationMutationDocument);
  const [endMutation, { loading: ending }] = useMutation(endImpersonationMutationDocument);

  const status = data?.impersonationStatus;
  const isImpersonating = status?.isActive === true;

  const reloadSession = useCallback(async () => {
    await client.resetStore();
    const meResult = await client.query({ query: meQueryDocument, fetchPolicy: "network-only" });
    if (meResult.data?.me) {
      setUser(meResult.data.me);
    }
    await refetch();
  }, [client, refetch, setUser]);

  const startImpersonation = useCallback(
    async (targetUserId: string, reason?: string) => {
      try {
        const result = await startMutation({
          variables: { targetUserId, reason: reason || null },
        });

        const payload = result.data?.startImpersonation;
        if (!payload?.token) {
          return false;
        }

        updateAuthToken(payload.token);
        await reloadSession();
        globalThis.location.reload();
        return true;
      } catch (error) {
        logger.error({ caller: "useImpersonation.startImpersonation" }, "Failed to start impersonation", error);
        return false;
      }
    },
    [startMutation, updateAuthToken, reloadSession]
  );

  const endImpersonation = useCallback(async () => {
    try {
      const result = await endMutation();
      const token = result.data?.endImpersonation?.token;
      if (!token) {
        return false;
      }

      updateAuthToken(token);
      await reloadSession();
      globalThis.location.reload();
      return true;
    } catch (error) {
      logger.error({ caller: "useImpersonation.endImpersonation" }, "Failed to end impersonation", error);
      return false;
    }
  }, [endMutation, updateAuthToken, reloadSession]);

  return {
    status,
    isImpersonating,
    loading: loading || starting || ending,
    startImpersonation,
    endImpersonation,
    refetchStatus: refetch,
  };
}
