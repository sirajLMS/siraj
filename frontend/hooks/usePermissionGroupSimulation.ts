"use client";

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { useCallback } from "react";
import {
  endPermissionGroupSimulationMutationDocument,
  meQueryDocument,
  permissionGroupSimulationStatusQueryDocument,
  startPermissionGroupSimulationMutationDocument,
} from "@/frontend/graphql/sharedDocuments/auth.documents";
import { useAuthToken } from "@/frontend/hooks/useAuthToken";
import logger from "@/frontend/lib/logger";
import { useUserStore } from "@/frontend/stores/userStore";

export function usePermissionGroupSimulation() {
  const client = useApolloClient();
  const { updateAuthToken } = useAuthToken();
  const setUser = useUserStore(state => state.setUser);

  const { data, loading, refetch } = useQuery(permissionGroupSimulationStatusQueryDocument, {
    fetchPolicy: "network-only",
  });

  const [startMutation, { loading: starting }] = useMutation(startPermissionGroupSimulationMutationDocument);
  const [endMutation, { loading: ending }] = useMutation(endPermissionGroupSimulationMutationDocument);

  const status = data?.permissionGroupSimulationStatus;
  const isSimulatingGroup = status?.isActive === true;

  const reloadSession = useCallback(async () => {
    await client.resetStore();
    const meResult = await client.query({ query: meQueryDocument, fetchPolicy: "network-only" });
    if (meResult.data?.me) {
      setUser(meResult.data.me);
    }
    await refetch();
  }, [client, refetch, setUser]);

  const startSimulation = useCallback(
    async (groupSlug: string) => {
      try {
        const result = await startMutation({
          variables: { groupSlug },
        });

        const payload = result.data?.startPermissionGroupSimulation;
        if (!payload?.token) {
          logger.warn(
            { caller: "usePermissionGroupSimulation.startSimulation" },
            `Start role simulation returned no token for group ${groupSlug}`
          );
          return false;
        }

        updateAuthToken(payload.token);
        logger.info(
          { caller: "usePermissionGroupSimulation.startSimulation" },
          `Role simulation started for ${groupSlug}, reloading session`
        );
        await reloadSession();
        globalThis.location.reload();
        return true;
      } catch (error) {
        logger.error(
          { caller: "usePermissionGroupSimulation.startSimulation" },
          "Failed to start permission group simulation",
          error
        );
        return false;
      }
    },
    [startMutation, updateAuthToken, reloadSession]
  );

  const endSimulation = useCallback(async () => {
    try {
      const result = await endMutation();
      const token = result.data?.endPermissionGroupSimulation?.token;
      if (!token) {
        return false;
      }

      updateAuthToken(token);
      await reloadSession();
      globalThis.location.reload();
      return true;
    } catch (error) {
      logger.error(
        { caller: "usePermissionGroupSimulation.endSimulation" },
        "Failed to end permission group simulation",
        error
      );
      return false;
    }
  }, [endMutation, updateAuthToken, reloadSession]);

  return {
    status,
    isSimulatingGroup,
    loading: loading || starting || ending,
    startSimulation,
    endSimulation,
    refetchStatus: refetch,
  };
}
