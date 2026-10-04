"use client";

import { Box } from "@mui/material";
import { useMemo } from "react";
import type { PermissionGroupsQuery_permissionGroups as PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql";
import type { BasePermissionGroupListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildPermissionGroupsColumns } from "@/frontend/desktop/views/dashboard/permissions/components/permissionGroupsDataGrid.columns";

export interface PermissionGroupsDataGridDesktopProps extends BasePermissionGroupListProps {
  // VARIANT JUSTIFICATION: extra field loading — desktop data-grid supports async row-loading state; mobile card list renders synchronously
  readonly loading?: boolean;
}

export function PermissionGroupsDataGridDesktop({
  labels,
  groups,
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
  groupRowMenuAnchor,
  loading = false,
}: Readonly<PermissionGroupsDataGridDesktopProps>) {
  const t = labels;

  const columns = useMemo(
    () =>
      buildPermissionGroupsColumns({
        labels,
        onViewGroup,
        onEditGroup,
        onDeleteGroup,
        onAssignGroup,
        rowMenuAnchor: groupRowMenuAnchor,
      }),
    [labels, onViewGroup, onEditGroup, onDeleteGroup, onAssignGroup, groupRowMenuAnchor]
  );

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
