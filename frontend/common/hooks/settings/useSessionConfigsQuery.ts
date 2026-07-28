"use client";

import { useQuery } from "@apollo/client/react";
import { sessionConfigsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/session-config.documents";

export function useSessionConfigsQuery() {
  return useQuery(sessionConfigsQueryDocument, {
    fetchPolicy: "cache-and-network",
  });
}
