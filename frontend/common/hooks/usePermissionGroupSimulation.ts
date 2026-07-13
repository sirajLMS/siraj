"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback } from "react";
import {
  endPermissionGroupSimulationMutationDocument,
  permissionGroupSimulationStatusQueryDocument,
  startPermissionGroupSimulationMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useAuthToken } from "@/frontend/common/hooks/useAuthToken";
import logger from "@/frontend/common/lib/logger";

export function usePermissionGroupSimulation() {
  const { updateAuthToken } = useAuthToken();

  const { data, loading, refetch } = useQuery(permissionGroupSimulationStatusQueryDocument, {
    fetchPolicy: "network-only",
  });

  const [startMutation, { loading: starting }] = useMutation(startPermissionGroupSimulationMutationDocument);
  const [endMutation, { loading: ending }] = useMutation(endPermissionGroupSimulationMutationDocument);

  const status = data?.permissionGroupSimulationStatus;
  const isSimulatingGroup = status?.isActive === true;

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
          `Role simulation started for ${groupSlug}, reloading page`
        );
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
    [startMutation, updateAuthToken]
  );

  const endSimulation = useCallback(async () => {
    try {
      const result = await endMutation();
      const token = result.data?.endPermissionGroupSimulation?.token;
      if (!token) {
        return false;
      }

      updateAuthToken(token);
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
  }, [endMutation, updateAuthToken]);

  return {
    status,
    isSimulatingGroup,
    loading: loading || starting || ending,
    startSimulation,
    endSimulation,
    refetchStatus: refetch,
  };
}
