import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Chip, IconButton, Stack, Switch } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { SiteContentRow } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import type { SettingsSiteContentTabLabels } from "@/shared/locale/types/dashboard/settings/siteContent";

type ColumnLabels = Pick<
  SettingsSiteContentTabLabels,
  | "slugColumn"
  | "titleColumn"
  | "contentTypeColumn"
  | "statusColumn"
  | "actionsColumn"
  | "editLabel"
  | "deleteLabel"
  | "published"
  | "draft"
  | "contentTypePage"
>;

export function buildSiteContentColumns(
  labels: ColumnLabels,
  handlers: {
    readonly onEdit: (row: SiteContentRow) => void;
    readonly onDelete: (row: SiteContentRow) => void;
    readonly onTogglePublish: (row: SiteContentRow, isPublished: boolean) => void;
  },
  canManage: boolean,
  togglingPublishId: string | null
): GridColDef<SiteContentRow>[] {
  const columns: GridColDef<SiteContentRow>[] = [
    { field: "slug", headerName: labels.slugColumn, flex: 1, minWidth: 140 },
    { field: "title", headerName: labels.titleColumn, flex: 1.2, minWidth: 160 },
    {
      field: "contentType",
      headerName: labels.contentTypeColumn,
      width: 120,
      valueGetter: (_value, row) => (row.contentType === "page" ? labels.contentTypePage : row.contentType),
    },
    {
      field: "isPublished",
      headerName: labels.statusColumn,
      width: 140,
      sortable: false,
      renderCell: ({ row }) => {
        if (canManage) {
          return (
            <Switch
              size="small"
              checked={row.isPublished}
              disabled={togglingPublishId === row.id}
              onChange={event => {
                handlers.onTogglePublish(row, event.target.checked);
              }}
              slotProps={{
                input: {
                  "aria-label": row.isPublished ? labels.published : labels.draft,
                },
              }}
            />
          );
        }

        return (
          <Chip
            size="small"
            color={row.isPublished ? "success" : "default"}
            label={row.isPublished ? labels.published : labels.draft}
          />
        );
      },
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
