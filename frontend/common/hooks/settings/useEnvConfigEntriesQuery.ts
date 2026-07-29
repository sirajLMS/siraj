"use client";

import { useQuery } from "@apollo/client/react";
import { envConfigEntriesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/environment-config.documents";

type UseEnvConfigEntriesQueryOptions = {
  readonly skip?: boolean;
};

export function useEnvConfigEntriesQuery(options?: UseEnvConfigEntriesQueryOptions) {
  return useQuery(envConfigEntriesQueryDocument, {
    fetchPolicy: "cache-and-network",
    skip: options?.skip ?? false,
  });
}
