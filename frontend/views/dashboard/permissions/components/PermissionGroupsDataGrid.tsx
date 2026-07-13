"use client";

import { DeleteOutlined, EditOutlined, MoreVertOutlined, PersonAddOutlined } from "@mui/icons-material";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import { LocalizedStringDisplay } from "@/frontend/components/ui/display";
import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface PermissionGroupsDataGridProps {
  readonly groups: readonly PermissionGroup[];
  readonly onViewGroup: (id: string) => void;
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly loading?: boolean;
}

interface RowActionsProps {
  readonly group: PermissionGroup;
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
}

function RowActions({ group, onEditGroup, onDeleteGroup, onAssignGroup }: Readonly<RowActionsProps>) {
  const t = useTranslations("dashboard.permissions");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (callback: (id: string) => void) => {
    handleClose();
    if (group.id) {
      callback(group.id);
    }
  };

  return (
    <>
      <IconButton id={`group-actions-btn-${group.id}`} onClick={handleClick} size="small">
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => handleAction(onAssignGroup)} id={`group-action-assign-${group.id}`}>
          <PersonAddOutlined fontSize="small" sx={{ mr: 1 }} />
          {t("actionAssign")}
        </MenuItem>
        <MenuItem
          onClick={() => handleAction(onEditGroup)}
          disabled={group.isSystem ?? false}
          id={`group-action-edit-${group.id}`}
        >
          <EditOutlined fontSize="small" sx={{ mr: 1 }} />
          {t("actionEdit")}
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
          {t("actionDelete")}
        </MenuItem>
      </Menu>
    </>
  );
}

export function PermissionGroupsDataGrid({
  groups,
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
  loading = false,
}: Readonly<PermissionGroupsDataGridProps>) {
  const t = useTranslations("dashboard.permissions");

  const columns = useMemo<GridColDef<PermissionGroup>[]>(() => {
    return [
      {
        field: "name",
        headerName: t("columnName"),
        flex: 1.5,
        minWidth: 200,
        renderCell: params => (
          <LocalizedStringDisplay
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
        headerName: t("columnSlug"),
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
        headerName: t("columnType"),
        width: 130,
        renderCell: params => (
          <StatusBadge
            category="session"
            status={params.value ? "active" : "pending"}
            label={params.value ? t("systemBadge") : t("customBadge")}
          />
        ),
      },
      {
        field: "permissionIds",
        headerName: t("columnPermissionsCount"),
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
          <RowActions
            group={params.row}
            onEditGroup={onEditGroup}
            onDeleteGroup={onDeleteGroup}
            onAssignGroup={onAssignGroup}
          />
        ),
      },
    ];
  }, [t, onEditGroup, onDeleteGroup, onAssignGroup, onViewGroup]);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <AppDataGrid<PermissionGroup>
        rows={groups}
        columns={columns}
        getRowId={row => row.id ?? row.slug ?? ""}
        emptyMessage={t("noPermissionsFound")}
        loading={loading}
        autoHeight
      />
    </Box>
  );
}
