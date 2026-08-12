import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton, Stack } from "@mui/material";
import type { GridColDef, GridValidRowModel } from "@mui/x-data-grid";

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
        <IconButton size="small" aria-label={editLabel} onClick={() => handlers.onEdit(row)}>
          <EditOutlined fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label={deleteLabel} onClick={() => handlers.onDelete(row)}>
          <DeleteOutlined fontSize="small" />
        </IconButton>
      </Stack>
    ),
  };
}
