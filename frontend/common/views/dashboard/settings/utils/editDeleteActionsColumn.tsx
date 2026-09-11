import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Stack } from "@mui/material";
import type { GridColDef, GridValidRowModel } from "@mui/x-data-grid";
import { TooltipIconButton } from "@/frontend/common/components/ui";

export function buildEditDeleteActionsColumn<TRow extends GridValidRowModel>(
  headerName: string,
  editLabel: string,
  deleteLabel: string,
  handlers: {
    readonly onEdit: (row: TRow) => void;
    readonly onDelete: (row: TRow) => void;
  }
): GridColDef<TRow> {
  return {
    field: "actions",
    headerName,
    width: 120,
    sortable: false,
    renderCell: ({ row }) => (
      <Stack direction="row" spacing={0.5}>
        <TooltipIconButton
          label={editLabel}
          icon={<EditOutlined fontSize="small" />}
          onClick={() => handlers.onEdit(row)}
        />
        <TooltipIconButton
          label={deleteLabel}
          icon={<DeleteOutlined fontSize="small" />}
          onClick={() => handlers.onDelete(row)}
        />
      </Stack>
    ),
  };
}
