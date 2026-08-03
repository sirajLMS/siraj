"use client";

import { useQuery } from "@apollo/client/react";
import { meetingIntegrationConnectedAccountsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/meeting-integrations.documents";
import type { MeetingIntegrationProviderSlug } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

type UseMeetingIntegrationConnectedAccountsQueryOptions = {
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly skip?: boolean;
};

export function useMeetingIntegrationConnectedAccountsQuery(
  options: UseMeetingIntegrationConnectedAccountsQueryOptions
) {
  return useQuery(meetingIntegrationConnectedAccountsQueryDocument, {
    fetchPolicy: "cache-and-network",
    skip: options?.skip ?? false,
    variables: { providerSlug: options.providerSlug },
  });
}
