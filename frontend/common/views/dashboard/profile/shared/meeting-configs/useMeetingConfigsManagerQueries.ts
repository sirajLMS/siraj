"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  meetingProvidersQueryDocument,
  myConnectedMeetingProvidersQueryDocument,
  userMeetingConfigsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

/** Owns the manager's read queries: the user's meeting configs, the active
 *  provider catalog, and the connected-provider token list. Exposes the raw
 *  query results plus derived lookup maps used by the other manager hooks. */
export function useMeetingConfigsManagerQueries(targetUserId: string) {
  const { data, loading, error, refetch } = useQuery(userMeetingConfigsQueryDocument, {
    variables: { userId: targetUserId },
  });

  const { data: providersData } = useQuery(meetingProvidersQueryDocument, {
    variables: { activeOnly: true },
  });

  const { data: connectedProvidersData, refetch: connectedProvidersQueryRefetch } = useQuery(
    myConnectedMeetingProvidersQueryDocument,
    { fetchPolicy: "network-only" }
  );

  const configs = useMemo(() => data?.userMeetingConfigs ?? [], [data?.userMeetingConfigs]);

  const configById = useMemo(() => {
    const map = new Map<string, UserMeetingConfigFieldsFragment>();
    for (const config of configs) {
      if (config.id) map.set(config.id, config);
    }
    return map;
  }, [configs]);

  return {
    view: { configs, loading, error, refetch },
    configById,
    providersData,
    connectedProvidersData,
    connectedProvidersQueryRefetch,
  };
}
