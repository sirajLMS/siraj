"use client";

import { useQuery } from "@apollo/client/react";
import { settingsTimezonesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/timezones-settings.documents";
import { useSettingsTimezonesStore } from "@/frontend/common/stores/settingsTimezonesStore";
import { buildSettingsTimezonesPaginationArgs } from "@/frontend/common/views/dashboard/settings/utils/settingsTimezones.utils";

export function useSettingsTimezonesQuery(isSearchActive: boolean) {
  const page = useSettingsTimezonesStore(state => state.page);

  return useQuery(settingsTimezonesQueryDocument, {
    variables: {
      paginationArgs: buildSettingsTimezonesPaginationArgs(page, isSearchActive),
    },
    fetchPolicy: "cache-and-network",
  });
}
