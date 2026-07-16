"use client";

import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppTranslation } from "@/shared/locale";

export interface PermissionCatalogDataGridProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly loading?: boolean;
}

interface PermissionKeyCellProps {
  readonly value: string | null;
}

function PermissionKeyCell({ value }: Readonly<PermissionKeyCellProps>) {
  if (!value) return null;
  return (
    <Box
      sx={theme => ({
        fontFamily: "JetBrains Mono, monospace",
        typography: "labelMd",
        backgroundColor: theme.palette.surfaceVariant,
        color: theme.palette.onSurfaceVariant,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        display: "inline-block",
      })}
    >
      {value}
    </Box>
  );
}

interface UsedInCellProps {
  readonly permission: Permission;
  readonly groups: readonly PermissionGroup[];
}

function UsedInCell({ permission, groups }: Readonly<UsedInCellProps>) {
  const usedGroups = groups.filter(g => {
    const ids = g.permissionIds ?? [];
    return (permission.id && ids.includes(permission.id)) || (permission.key && ids.includes(permission.key));
  });

  if (usedGroups.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
      {usedGroups.map(g => {
        if (!g.id || !g.name) return null;
        return (
          <LocalizedStringDisplay
            key={g.id}
            value={g.name}
            typographyVariant="labelMd"
            sx={theme => ({
              fontWeight: 500,
              backgroundColor: theme.palette.secondaryContainer,
              color: theme.palette.onSecondaryContainer,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
              display: "inline-block",
            })}
          />
        );
      })}
    </Box>
  );
}

export function PermissionCatalogDataGrid({
  permissions,
  groups,
  loading = false,
}: Readonly<PermissionCatalogDataGridProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  const columns = useMemo<GridColDef<Permission>[]>(() => {
    return [
      {
        field: "key",
        headerName: t.columnKey,
        flex: 1,
        minWidth: 200,
        renderCell: params => <PermissionKeyCell value={params.value as string | null} />,
      },
      {
        field: "category",
        headerName: t.columnCategory,
        width: 180,
        renderCell: params => {
          const val = params.value as string | null;
          return (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {val ?? ""}
            </Typography>
          );
        },
      },
      {
        field: "description",
        headerName: t.columnDescription,
        flex: 2,
        minWidth: 300,
        renderCell: params => {
          const val = params.value as string | null;
          return (
            <Typography variant="bodyMd" sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
              {val ?? ""}
            </Typography>
          );
        },
      },
      {
        field: "usedIn",
        headerName: t.columnUsedIn,
        flex: 1.5,
        minWidth: 220,
        renderCell: params => <UsedInCell permission={params.row} groups={groups} />,
      },
    ];
  }, [t, groups]);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <AppDataGrid<Permission>
        rows={permissions}
        columns={columns}
        getRowId={row => row.id ?? row.key ?? ""}
        emptyMessage={t.noPermissionsFound}
        loading={loading}
        autoHeight
      />
    </Box>
  );
}
