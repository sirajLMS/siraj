import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { PermissionGroupsQuery_permissionGroups as PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql";
import type { RowMenuAnchor } from "@/frontend/common/views/dashboard/permissions/components/useRowMenuAnchor";
import type { BasePermissionGroupListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { DesktopLocalizedStringDisplay } from "@/frontend/desktop/components/ui/display/localizedStringDisplay";
import { RowActionsDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionGroupsDataGrid.parts";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

interface BuildPermissionGroupsColumnsParams {
  readonly labels: BasePermissionGroupListProps["labels"];
  readonly onViewGroup: (id: string) => void;
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly rowMenuAnchor: RowMenuAnchor;
}

export function buildPermissionGroupsColumns({
  labels,
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
  rowMenuAnchor,
}: Readonly<BuildPermissionGroupsColumnsParams>): GridColDef<PermissionGroup>[] {
  const t = labels;
  return [
    {
      field: "name",
      headerName: t.columnName,
      flex: 1.5,
      minWidth: 200,
      renderCell: params => (
        <DesktopLocalizedStringDisplay
          value={params.value}
          typographyVariant="bodyMd"
          onClick={() => params.row.id && onViewGroup(params.row.id)}
          sx={theme => ({
            fontWeight: 500,
            cursor: "pointer",
            "&:hover": {
              color: theme.palette.primary.main,
              textDecoration: "underline",
            },
          })}
        />
      ),
    },
    {
      field: "slug",
      headerName: t.columnSlug,
      flex: 1.2,
      minWidth: 150,
      renderCell: params => (
        <Typography
          variant="labelMd"
          sx={theme => ({
            fontFamily: "var(--font-jetbrains-mono), monospace",
            color: theme.palette.text.secondary,
          })}
        >
          {isString(params.value) ? params.value : ""}
        </Typography>
      ),
    },
    {
      field: "isSystem",
      headerName: t.columnType,
      width: 130,
      renderCell: params => (
        <DesktopStatusBadge
          category="groupType"
          status={params.value ? "system" : "custom"}
          label={params.value ? t.systemBadge : t.customBadge}
        />
      ),
    },
    {
      field: "permissionIds",
      headerName: t.columnPermissionsCount,
      width: 150,
      renderCell: params => {
        const count = isStringArray(params.value) ? params.value.length : 0;
        return <Typography variant="bodyMd">{count}</Typography>;
      },
    },
    {
      field: "actions",
      headerName: "",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: params => (
        <RowActionsDesktop
          labels={labels}
          group={params.row}
          onEditGroup={onEditGroup}
          onDeleteGroup={onDeleteGroup}
          onAssignGroup={onAssignGroup}
          rowMenuAnchor={rowMenuAnchor}
        />
      ),
    },
  ];
}
