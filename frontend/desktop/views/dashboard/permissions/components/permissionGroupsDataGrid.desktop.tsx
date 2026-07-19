"use client";

import { DeleteOutlined, EditOutlined, MoreVertOutlined, PersonAddOutlined } from "@mui/icons-material";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { RowMenuAnchor } from "@/frontend/common/views/dashboard/permissions/components/useRowMenuAnchor";
import type { BasePermissionGroupListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopAppDataGrid, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { DesktopLocalizedStringDisplay } from "@/frontend/desktop/components/ui/display/localizedStringDisplay";
import { useAppTranslation } from "@/shared/locale";

export interface PermissionGroupsDataGridDesktopProps extends BasePermissionGroupListProps {
  // VARIANT JUSTIFICATION: extra field loading — desktop data-grid supports async row-loading state; mobile card list renders synchronously
  readonly loading?: boolean;
}

interface RowActionsProps {
  readonly group: PermissionGroup;
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly rowMenuAnchor: RowMenuAnchor;
}

function RowActionsDesktop({
  group,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
  rowMenuAnchor,
}: Readonly<RowActionsProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;
  const { anchorEl, openMenu, closeMenu } = rowMenuAnchor;
  const open = Boolean(anchorEl);

  const handleAction = (callback: (id: string) => void) => {
    closeMenu();
    if (group.id) {
      callback(group.id);
    }
  };

  return (
    <>
      <IconButton id={`group-actions-btn-${group.id}`} onClick={openMenu} size="small">
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={closeMenu}>
        <MenuItem onClick={() => handleAction(onAssignGroup)} id={`group-action-assign-${group.id}`}>
          <PersonAddOutlined fontSize="small" sx={{ mr: 1 }} />
          {t.actionAssign}
        </MenuItem>
        <MenuItem
          onClick={() => handleAction(onEditGroup)}
          disabled={group.isSystem ?? false}
          id={`group-action-edit-${group.id}`}
        >
          <EditOutlined fontSize="small" sx={{ mr: 1 }} />
          {t.actionEdit}
        </MenuItem>
        <MenuItem
          onClick={() => handleAction(onDeleteGroup)}
          disabled={group.isSystem ?? false}
          id={`group-action-delete-${group.id}`}
          sx={theme => ({
            color: group.isSystem ? theme.palette.text.disabled : theme.palette.error.main,
          })}
        >
          <DeleteOutlined fontSize="small" sx={{ mr: 1 }} />
          {t.actionDelete}
        </MenuItem>
      </Menu>
    </>
  );
}

export function PermissionGroupsDataGridDesktop({
  groups,
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
  groupRowMenuAnchor,
  loading = false,
}: Readonly<PermissionGroupsDataGridDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — memoizing `columns` keeps
  // the MUI DataGrid column-identity stable across re-renders so the grid does
  // not remount/re-sort on each props change.
  const columns = useMemo<GridColDef<PermissionGroup>[]>(() => {
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
              fontFamily: "JetBrains Mono, monospace",
              color: theme.palette.text.secondary,
            })}
          >
            {params.value as string}
          </Typography>
        ),
      },
      {
        field: "isSystem",
        headerName: t.columnType,
        width: 130,
        renderCell: params => (
          <DesktopStatusBadge
            category="session"
            status={params.value ? "active" : "pending"}
            label={params.value ? t.systemBadge : t.customBadge}
          />
        ),
      },
      {
        field: "permissionIds",
        headerName: t.columnPermissionsCount,
        width: 150,
        renderCell: params => {
          const count = (params.value as string[] | null)?.length ?? 0;
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
            group={params.row}
            onEditGroup={onEditGroup}
            onDeleteGroup={onDeleteGroup}
            onAssignGroup={onAssignGroup}
            rowMenuAnchor={groupRowMenuAnchor}
          />
        ),
      },
    ];
  }, [t, onEditGroup, onDeleteGroup, onAssignGroup, onViewGroup, groupRowMenuAnchor]);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <DesktopAppDataGrid<PermissionGroup>
        rows={groups}
        columns={columns}
        getRowId={row => row.id ?? row.slug ?? ""}
        emptyMessage={t.noPermissionsFound}
        loading={loading}
        autoHeight
        paginationOptions={{ mode: "client" }}
      />
    </Box>
  );
}
