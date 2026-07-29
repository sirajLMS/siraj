import { Box, Switch, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { formatDateTime } from "@/frontend/common/components/intl/dateFormat";
import { SystemSettingDataType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { SystemSettingRowActions } from "@/frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingRowActions";
import type { SystemSettingRow } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import type { SettingsGeneralTabLabels } from "@/shared/locale/types/dashboard/settings/general";

type ColumnLabels = Pick<
  SettingsGeneralTabLabels,
  | "keyColumn"
  | "valueColumn"
  | "dataTypeColumn"
  | "descriptionColumn"
  | "categoryColumn"
  | "updatedAtColumn"
  | "actionsColumn"
  | "editLabel"
  | "deleteLabel"
  | "dataTypeLabels"
  | "categories"
>;

function renderValueCell(row: SystemSettingRow): React.ReactNode {
  const value = row.value;
  switch (row.dataType) {
    case SystemSettingDataType.Integer:
      return value;
    case SystemSettingDataType.Boolean:
      return <Switch checked={value === "true"} readOnly size="small" />;
    case SystemSettingDataType.Json: {
      try {
        const pretty = JSON.stringify(JSON.parse(value), null, 2);
        return (
          <Box component="code" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
            {pretty}
          </Box>
        );
      } catch {
        return (
          <Box component="code" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
            {value}
          </Box>
        );
      }
    }
    default:
      return value;
  }
}

export function buildGeneralSettingsColumns(
  labels: ColumnLabels,
  handlers: {
    readonly onEdit: (row: SystemSettingRow) => void;
    readonly onDelete: (row: SystemSettingRow) => void;
  },
  canManage: boolean,
  locale: string
): GridColDef<SystemSettingRow>[] {
  const columns: GridColDef<SystemSettingRow>[] = [
    { field: "key", headerName: labels.keyColumn, flex: 1.2, minWidth: 160 },
    {
      field: "value",
      headerName: labels.valueColumn,
      flex: 1.2,
      minWidth: 140,
      renderCell: ({ row }) => renderValueCell(row),
    },
    {
      field: "dataType",
      headerName: labels.dataTypeColumn,
      width: 120,
      valueGetter: (_value, row) => labels.dataTypeLabels[row.dataType],
    },
    { field: "description", headerName: labels.descriptionColumn, flex: 1.5, minWidth: 180 },
    {
      field: "category",
      headerName: labels.categoryColumn,
      flex: 1,
      minWidth: 120,
      renderCell: ({ row }) => <Typography sx={{ typography: "bodySm" }}>{labels.categories[row.category]}</Typography>,
    },
    {
      field: "updatedAt",
      headerName: labels.updatedAtColumn,
      flex: 1,
      minWidth: 160,
      valueGetter: (_value, row) => (row.updatedAt ? formatDateTime(row.updatedAt, locale) : ""),
    },
  ];

  if (canManage) {
    columns.push({
      field: "actions",
      headerName: labels.actionsColumn,
      width: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <SystemSettingRowActions
          editLabel={labels.editLabel}
          deleteLabel={labels.deleteLabel}
          onEdit={() => handlers.onEdit(row)}
          onDelete={() => handlers.onDelete(row)}
        />
      ),
    });
  }

  return columns;
}
