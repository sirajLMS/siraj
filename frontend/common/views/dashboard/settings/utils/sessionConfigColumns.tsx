import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { SessionConfigRow } from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";
import type { SettingsSessionTabLabels } from "@/shared/locale/types/dashboard/settings/session";

type ColumnLabels = Pick<
  SettingsSessionTabLabels,
  "roleNameColumn" | "ttlSecondsColumn" | "maxConcurrentSessionsColumn" | "actionsColumn" | "editLabel" | "deleteLabel"
>;

export function buildSessionConfigColumns(
  labels: ColumnLabels,
  handlers: {
    readonly onEdit: (row: SessionConfigRow) => void;
    readonly onDelete: (row: SessionConfigRow) => void;
  },
  canManage: boolean
): GridColDef<SessionConfigRow>[] {
  const columns: GridColDef<SessionConfigRow>[] = [
    { field: "roleName", headerName: labels.roleNameColumn, flex: 1.2, minWidth: 160 },
    { field: "ttlSeconds", headerName: labels.ttlSecondsColumn, width: 160, type: "number" },
    {
      field: "maxConcurrentSessions",
      headerName: labels.maxConcurrentSessionsColumn,
      width: 180,
      type: "number",
    },
  ];

  if (canManage) {
    columns.push({
      field: "actions",
      headerName: labels.actionsColumn,
      width: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" aria-label={labels.editLabel} onClick={() => handlers.onEdit(row)}>
            <EditOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={labels.deleteLabel} onClick={() => handlers.onDelete(row)}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Stack>
      ),
    });
  }

  return columns;
}
