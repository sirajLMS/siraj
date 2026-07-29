"use client";

import { useQuery } from "@apollo/client/react";
import { siteContentEntriesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/site-content-settings.documents";

export function useSiteContentEntriesQuery() {
  return useQuery(siteContentEntriesQueryDocument, {
    fetchPolicy: "cache-and-network",
  });
}
