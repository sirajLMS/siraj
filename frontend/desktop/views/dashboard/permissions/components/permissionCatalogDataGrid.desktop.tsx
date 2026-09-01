"use client";

import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type {
  PermissionGroupDetailFieldsFragment,
  PermissionsQuery_permissions,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { PermissionGroupChipShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupChipShared";
import { PermissionKeyChipShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionKeyChipShared";
import type { BasePermissionCatalogListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

export interface PermissionCatalogDataGridDesktopProps extends BasePermissionCatalogListProps {
  // VARIANT JUSTIFICATION: extra field loading — desktop data-grid renders an async-loaded table; mobile card list is always synchronous
  readonly loading?: boolean;
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

interface UsedInCellProps {
  readonly permission: PermissionsQuery_permissions;
  readonly groups: readonly PermissionGroupDetailFieldsFragment[];
}

function UsedInCell({ permission, groups }: Readonly<UsedInCellProps>) {
  const locale = useAppLocale();
  const usedGroups = groups.filter(g => {
    const ids = g.permissionIds ?? [];
    return (permission.id && ids.includes(permission.id)) ?? (permission.key && ids.includes(permission.key));
  });

  if (usedGroups.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
      {usedGroups.map(g => {
        if (!g.id || !g.name) return null;
        const label = resolveLocalizedString(g.name, locale);
        if (!label) return null;
        return <PermissionGroupChipShared key={g.id} label={label} />;
      })}
    </Box>
  );
}

export function PermissionCatalogDataGridDesktop({
  labels,
  permissions,
  groups,
  loading = false,
}: Readonly<PermissionCatalogDataGridDesktopProps>) {
  const t = labels;

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — memoizing columns keeps the grid stable across re-renders.
  const columns = useMemo<GridColDef<PermissionsQuery_permissions>[]>(() => {
    return [
      {
        field: "key",
        headerName: t.columnKey,
        flex: 1,
        minWidth: 200,
        renderCell: params => {
          const value = isStringOrNull(params.value) ? params.value : null;
          return value ? <PermissionKeyChipShared label={value} /> : null;
        },
      },
      {
        field: "category",
        headerName: t.columnCategory,
        width: 180,
        renderCell: params => {
          const val = isStringOrNull(params.value) ? params.value : null;
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
          const val = isStringOrNull(params.value) ? params.value : null;
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
      <DesktopAppDataGrid<PermissionsQuery_permissions>
        rows={permissions}
        columns={columns}
        getRowId={row => row.id ?? row.key ?? ""}
        emptyMessage={t.noPermissionsFound}
        loading={loading}
        autoHeight
        paginationOptions={{ mode: "client" }}
      />
    </Box>
  );
}
