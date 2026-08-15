"use client";

import { RemoveCircleOutlined } from "@mui/icons-material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { CurrentPermissionsEmptyState } from "@/frontend/common/views/dashboard/permissions/components/__shared__/currentPermissionsTabShared";
import {
  StyledPermissionKeyChipShared,
  StyledRevokeButtonShared,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/currentPermissionsTabShared.styles";
import type { CurrentPermissionsTabProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopAppDataGrid, DesktopSectionPanel } from "@/frontend/desktop/components/ui";

export function CurrentPermissionsTabDesktop({
  labels,
  groupPermissions,
  permissionsCount,
  onRevokePermission,
  onSwitchToAddTab,
  loading = false,
}: Readonly<CurrentPermissionsTabProps>) {
  const t = labels;

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — memoizing columns keeps the grid stable across re-renders.
  const currentPermissionsColumns = useMemo<GridColDef<Permission>[]>(() => {
    const cols: GridColDef<Permission>[] = [
      {
        field: "key",
        headerName: t.columnKey,
        flex: 1,
        minWidth: 200,
        renderCell: params => <StyledPermissionKeyChipShared>{String(params.value)}</StyledPermissionKeyChipShared>,
      },
      {
        field: "category",
        headerName: t.columnCategory,
        width: 180,
      },
      {
        field: "description",
        headerName: t.columnDescription,
        flex: 1.5,
        minWidth: 250,
      },
      {
        field: "actions",
        headerName: "",
        width: 100,
        align: "right",
        sortable: false,
        renderCell: params => (
          <StyledRevokeButtonShared
            size="small"
            startIcon={<RemoveCircleOutlined fontSize="small" />}
            onClick={() => params.row.id && onRevokePermission(params.row.id)}
          >
            {t.revoke}
          </StyledRevokeButtonShared>
        ),
      },
    ];

    return cols;
  }, [t, onRevokePermission]);

  return (
    <DesktopSectionPanel contentPadding={false} title={t.currentPermissions}>
      {permissionsCount === 0 && !loading ? (
        <CurrentPermissionsEmptyState t={t} onSwitchToAddTab={onSwitchToAddTab} />
      ) : (
        <DesktopAppDataGrid<Permission>
          rows={groupPermissions}
          columns={currentPermissionsColumns}
          getRowId={row => row.id ?? row.key ?? ""}
          emptyMessage={t.noPermissionsFound}
          loading={loading}
          autoHeight
          paginationOptions={{ mode: "client" }}
        />
      )}
    </DesktopSectionPanel>
  );
}
