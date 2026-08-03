"use client";

import { useQuery } from "@apollo/client/react";
import { meetingIntegrationProvidersQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/meeting-integrations.documents";

type UseMeetingIntegrationProvidersQueryOptions = {
  readonly skip?: boolean;
};

export function useMeetingIntegrationProvidersQuery(options?: UseMeetingIntegrationProvidersQueryOptions) {
  return useQuery(meetingIntegrationProvidersQueryDocument, {
    fetchPolicy: "cache-and-network",
    skip: options?.skip ?? false,
  });
}
