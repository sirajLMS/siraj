"use client";

import { useQuery } from "@apollo/client/react";
import { settingsAuditLogsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/settings-audit.documents";
import { SETTINGS_AUDIT_PAGE_SIZE, useSettingsAuditStore } from "@/frontend/common/stores/settingsAuditStore";
import {
  toAuditEndDateIso,
  toAuditStartDateIso,
} from "@/frontend/common/views/dashboard/settings/utils/settingsAuditDateUtils";

export function useSettingsAuditLogsQuery() {
  const entityType = useSettingsAuditStore(state => state.entityType);
  const action = useSettingsAuditStore(state => state.action);
  const fromDate = useSettingsAuditStore(state => state.fromDate);
  const toDate = useSettingsAuditStore(state => state.toDate);
  const page = useSettingsAuditStore(state => state.page);

  return useQuery(settingsAuditLogsQueryDocument, {
    variables: {
      filter: {
        entityType: entityType || null,
        action: action || null,
        actorUserId: null,
        startDate: toAuditStartDateIso(fromDate),
        endDate: toAuditEndDateIso(toDate),
        limit: SETTINGS_AUDIT_PAGE_SIZE,
        offset: page * SETTINGS_AUDIT_PAGE_SIZE,
      },
    },
    fetchPolicy: "cache-and-network",
  });
}
