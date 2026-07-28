"use client";

import { useQuery } from "@apollo/client/react";
import { systemSettingsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/general-settings.documents";

export function useSystemSettingsQuery() {
  return useQuery(systemSettingsQueryDocument, {
    fetchPolicy: "cache-and-network",
  });
}
