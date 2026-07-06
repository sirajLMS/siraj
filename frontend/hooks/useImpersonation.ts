"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback } from "react";
import {
  endImpersonationMutationDocument,
  impersonationStatusQueryDocument,
  startImpersonationMutationDocument,
} from "@/frontend/graphql/sharedDocuments/auth.documents";
import { useAuthToken } from "@/frontend/hooks/useAuthToken";
import logger from "@/frontend/lib/logger";

export function useImpersonation() {
  const { updateAuthToken } = useAuthToken();

  const { data, loading, refetch } = useQuery(impersonationStatusQueryDocument, {
    fetchPolicy: "network-only",
  });

  const [startMutation, { loading: starting }] = useMutation(startImpersonationMutationDocument);
  const [endMutation, { loading: ending }] = useMutation(endImpersonationMutationDocument);

  const status = data?.impersonationStatus;
  const isImpersonating = status?.isActive === true;

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
        globalThis.location.reload();
        return true;
      } catch (error) {
        logger.error({ caller: "useImpersonation.startImpersonation" }, "Failed to start impersonation", error);
        return false;
      }
    },
    [startMutation, updateAuthToken]
  );

  const endImpersonation = useCallback(async () => {
    try {
      const result = await endMutation();
      const token = result.data?.endImpersonation?.token;
      if (!token) {
        return false;
      }

      updateAuthToken(token);
      globalThis.location.reload();
      return true;
    } catch (error) {
      logger.error({ caller: "useImpersonation.endImpersonation" }, "Failed to end impersonation", error);
      return false;
    }
  }, [endMutation, updateAuthToken]);

  return {
    status,
    isImpersonating,
    loading: loading || starting || ending,
    startImpersonation,
    endImpersonation,
    refetchStatus: refetch,
  };
};
