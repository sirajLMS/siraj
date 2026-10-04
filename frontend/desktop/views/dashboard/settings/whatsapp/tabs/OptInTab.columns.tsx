import type { GridColDef } from "@mui/x-data-grid";
import { StatusBadge } from "@/frontend/common/components/ui";
import type {
  WhatsappOptInAuditEntry,
  WhatsappOptInUserState,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function buildHistoryColumns(t: WhatsappLabels): GridColDef<WhatsappOptInAuditEntry>[] {
  return [
    {
      field: "date",
      headerName: t.optInHistoryDate,
      flex: 0.5,
      minWidth: 120,
    },
    {
      field: "action",
      headerName: t.optInHistoryAction,
      flex: 0.4,
      minWidth: 100,
      renderCell: ({ value }) => (
        <StatusBadge
          category="syncStatus"
          status={value === "optIn" ? "success" : "cancelled"}
          label={value === "optIn" ? t.optInActionOptedIn : t.optInActionOptedOut}
        />
      ),
    },
    {
      field: "changedBy",
      headerName: t.optInHistoryChangedBy,
      flex: 1,
      minWidth: 150,
    },
  ];
}

export function buildAdminColumns(t: WhatsappLabels): GridColDef<WhatsappOptInUserState>[] {
  return [
    {
      field: "userName",
      headerName: t.optInAdminUserName,
      flex: 1,
      minWidth: 150,
    },
    {
      field: "optedIn",
      headerName: t.optInAdminOptedIn,
      flex: 0.4,
      minWidth: 100,
      renderCell: ({ value }) => (
        <StatusBadge
          category="syncStatus"
          status={value ? "success" : "cancelled"}
          label={value ? t.optInAdminYes : t.optInAdminNo}
        />
      ),
    },
    {
      field: "optedInAt",
      headerName: t.optInAdminOptedInAt,
      flex: 0.5,
      minWidth: 140,
      renderCell: ({ value }) => value ?? "—",
    },
  ];
}
