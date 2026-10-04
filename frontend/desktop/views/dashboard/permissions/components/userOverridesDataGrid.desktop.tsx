"use client";

import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { UsersQuery_users as User } from "@/frontend/common/graphql/generated/gql/graphql";
import type { UserOverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { buildUserOverridesColumns } from "@/frontend/desktop/views/dashboard/permissions/components/userOverridesDataGrid.columns.desktop";

export function UserOverridesDataGridDesktop({
  labels,
  users,
  groups,
  onManageOverrides,
  loading = false,
}: Readonly<UserOverridesDataGridProps>) {
  const columns = useMemo<GridColDef<User>[]>(
    () => buildUserOverridesColumns({ labels, groups, onManageOverrides }),
    [labels, groups, onManageOverrides]
  );

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <DesktopAppDataGrid<User>
        rows={users}
        columns={columns}
        getRowId={row => row.id ?? row.email ?? ""}
        emptyMessage={labels.noPermissionsFound}
        loading={loading}
        autoHeight
        paginationOptions={{ mode: "client" }}
      />
    </Box>
  );
}
