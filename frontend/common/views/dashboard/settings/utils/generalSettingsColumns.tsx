import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { SystemSettingValueField } from "@/frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingValueField";
import type { SystemSettingRow } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import type { SettingsGeneralTabLabels } from "@/shared/locale/types/dashboard/settings/general";

type ColumnLabels = Pick<
  SettingsGeneralTabLabels,
  | "keyColumn"
  | "valueColumn"
  | "dataTypeColumn"
  | "descriptionColumn"
  | "categoryColumn"
  | "dataTypeLabels"
  | "categories"
>;

export function buildGeneralSettingsColumns(
  labels: ColumnLabels,
  handlers: {
    readonly onValueChange: (code: string, value: string) => void | Promise<void>;
    readonly savingCode: string | null;
  },
  canManage: boolean
): GridColDef<SystemSettingRow>[] {
  return [
    {
      field: "slug",
      headerName: labels.keyColumn,
      flex: 1.2,
      minWidth: 180,
      renderCell: ({ row }) => (
        <Box>
          <Typography sx={{ typography: "bodySm", fontWeight: 600 }}>{row.slug}</Typography>
          <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
            {row.label}
          </Typography>
        </Box>
      ),
    },
    {
      field: "dataType",
      headerName: labels.dataTypeColumn,
      width: 120,
      valueGetter: (_value, row) => labels.dataTypeLabels[row.dataType],
    },
    {
      field: "category",
      headerName: labels.categoryColumn,
      flex: 1,
      minWidth: 120,
      renderCell: ({ row }) => <Typography sx={{ typography: "bodySm" }}>{labels.categories[row.category]}</Typography>,
    },
    {
      field: "value",
      headerName: labels.valueColumn,
      flex: 1.4,
      minWidth: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <SystemSettingValueField
          row={row}
          canEdit={canManage}
          disabled={handlers.savingCode === row.code}
          onValueChange={handlers.onValueChange}
        />
      ),
    },
    {
      field: "description",
      headerName: labels.descriptionColumn,
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary, whiteSpace: "normal" }}>
          {row.description}
        </Typography>
      ),
    },
  ];
}
