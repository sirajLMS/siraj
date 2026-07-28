"use client";

import { useMemo } from "react";
import { useSettingsAuditLogsQuery } from "@/frontend/common/hooks/settings";
import { SETTINGS_AUDIT_PAGE_SIZE, useSettingsAuditStore } from "@/frontend/common/stores/settingsAuditStore";
import {
  SETTINGS_AUDIT_ACTION_OPTIONS,
  SETTINGS_AUDIT_ENTITY_TYPE_OPTIONS,
} from "@/frontend/common/views/dashboard/settings/config/settingsAuditFilter.config";
import type { SettingsAuditViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsAuditViewModel.types";
import {
  buildSettingsAuditLabels,
  mapSettingsAuditRows,
} from "@/frontend/common/views/dashboard/settings/utils/settingsAudit.utils";
import { buildSettingsAuditColumns } from "@/frontend/common/views/dashboard/settings/utils/settingsAuditColumns";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

export function useSettingsAuditViewModel(): SettingsAuditViewModel {
  const locale = useAppLocale();
  const t = useAppTranslation(Translation.Dashboard.Settings).audit;

  const entityType = useSettingsAuditStore(state => state.entityType);
  const action = useSettingsAuditStore(state => state.action);
  const fromDate = useSettingsAuditStore(state => state.fromDate);
  const toDate = useSettingsAuditStore(state => state.toDate);
  const page = useSettingsAuditStore(state => state.page);
  const setEntityType = useSettingsAuditStore(state => state.setEntityType);
  const setAction = useSettingsAuditStore(state => state.setAction);
  const setDateRange = useSettingsAuditStore(state => state.setDateRange);
  const setPage = useSettingsAuditStore(state => state.setPage);

  const { data, loading } = useSettingsAuditLogsQuery();

  const rows = useMemo(
    () => mapSettingsAuditRows(data?.settingsAuditLogs?.logs, locale, t.entityTypes, t.actions),
    [data?.settingsAuditLogs?.logs, locale, t.actions, t.entityTypes]
  );

  const columns = useMemo(() => buildSettingsAuditColumns(t.columns), [t.columns]);
  const labels = useMemo(() => buildSettingsAuditLabels(t), [t]);

  return {
    labels,
    rows,
    columns,
    page,
    pageSize: SETTINGS_AUDIT_PAGE_SIZE,
    totalCount: data?.settingsAuditLogs?.total ?? 0,
    loading,
    entityType,
    action,
    fromDate,
    toDate,
    entityTypeOptions: SETTINGS_AUDIT_ENTITY_TYPE_OPTIONS,
    actionOptions: SETTINGS_AUDIT_ACTION_OPTIONS,
    onEntityTypeChange: setEntityType,
    onActionChange: setAction,
    onDateRangeChange: setDateRange,
    onPageChange: setPage,
  };
}
