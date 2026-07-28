import type { GridColDef } from "@mui/x-data-grid";
import type { SettingsAuditRow } from "@/frontend/common/views/dashboard/settings/types/settingsAudit.types";
import type { SettingsAuditLabels as SettingsAuditTranslationLabels } from "@/shared/locale/types/dashboard/settings/main";

export function buildSettingsAuditColumns(
  columnLabels: SettingsAuditTranslationLabels["columns"]
): readonly GridColDef<SettingsAuditRow>[] {
  return [
    { field: "createdAt", headerName: columnLabels.createdAt, flex: 1.2, minWidth: 160 },
    { field: "entityType", headerName: columnLabels.entityType, flex: 1, minWidth: 140 },
    { field: "action", headerName: columnLabels.action, flex: 0.8, minWidth: 120 },
    { field: "description", headerName: columnLabels.description, flex: 1.5, minWidth: 200 },
    { field: "actorUserId", headerName: columnLabels.actor, flex: 1, minWidth: 140 },
    { field: "entityId", headerName: columnLabels.entityId, flex: 1, minWidth: 140 },
  ];
}
