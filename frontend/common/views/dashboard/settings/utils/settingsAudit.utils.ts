import { formatDateTime } from "@/frontend/common/components/intl/dateFormat";
import type { SettingsAuditLogsQuery_settingsAuditLogs_SettingsAuditLogsResult_logs_AuditLog } from "@/frontend/common/graphql/generated/gql/operations";
import type {
  SettingsAuditLabels,
  SettingsAuditRow,
} from "@/frontend/common/views/dashboard/settings/types/settingsAudit.types";
import type { SettingsAuditLabels as SettingsAuditTranslationLabels } from "@/shared/locale/types/dashboard/settings/main";

function resolveOptionLabel(options: Record<string, string>, value: string): string {
  return options[value] ?? value;
}

export function buildSettingsAuditLabels(t: SettingsAuditTranslationLabels): SettingsAuditLabels {
  return {
    emptyMessage: t.emptyMessage,
    filters: t.filters,
    columns: t.columns,
    entityTypes: t.entityTypes,
    actions: t.actions,
  };
}

export function mapSettingsAuditRows(
  logs: Array<SettingsAuditLogsQuery_settingsAuditLogs_SettingsAuditLogsResult_logs_AuditLog> | null | undefined,
  locale: string,
  entityTypeLabels: Record<string, string>,
  actionLabels: Record<string, string>
): readonly SettingsAuditRow[] {
  return (logs ?? []).map(log => ({
    id: log.id ?? "",
    createdAt: log.createdAt ? formatDateTime(log.createdAt, locale) : "",
    entityType: resolveOptionLabel(entityTypeLabels, log.entityType ?? ""),
    action: resolveOptionLabel(actionLabels, log.action ?? ""),
    description: log.description ?? "",
    actorUserId: log.actorUserId ?? "",
    entityId: log.entityId ?? "",
  }));
}
