"use client";

import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import {
  EditOverridesButton,
  OverridesCellBox,
  UserGroupsChips,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/userOverridesDataGridShared";
import type { UserOverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { getUserGroupsForUser } from "@/frontend/common/views/dashboard/permissions/utils";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";

export function UserOverridesDataGridDesktop({
  labels,
  users,
  groups,
  onManageOverrides,
  loading = false,
}: Readonly<UserOverridesDataGridProps>) {
  const t = labels;

  const columns = useMemo<GridColDef<User>[]>(() => {
    return [
      {
        field: "name",
        headerName: t.selectUserLabel,
        flex: 1.5,
        minWidth: 220,
        renderCell: params => {
          const user = params.row;
          return (
            <Box sx={{ display: "flex", alignItems: "center", py: 1, height: "100%" }}>
              <DesktopPersonProfileLinkCell
                href={user.id ? profileHrefForUser(user.id) : undefined}
                name={user.name ?? ""}
                avatarUrl={user.avatarUrl}
                avatarSize={32}
                label={user.email ?? undefined}
                typographyVariant="bodyMd"
                fontWeight={600}
              />
            </Box>
          );
        },
      },
      {
        field: "baseGroups",
        headerName: t.groupsTab,
        flex: 1.5,
        minWidth: 200,
        sortable: false,
        renderCell: params => {
          const userGroups = getUserGroupsForUser(params.row.id ?? undefined, groups);
          return <UserGroupsChips userGroups={userGroups} />;
        },
      },
      {
        field: "activeGrants",
        headerName: t.explicitGrant,
        width: 140,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: params => {
          const userId = params.row.id;
          if (!userId) return null;
          const userGroups = getUserGroupsForUser(userId, groups);
          return <OverridesCellBox userId={userId} userGroups={userGroups} type="grants" />;
        },
      },
      {
        field: "activeRevokes",
        headerName: t.explicitDeny,
        width: 140,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: params => {
          const userId = params.row.id;
          if (!userId) return null;
          const userGroups = getUserGroupsForUser(userId, groups);
          return <OverridesCellBox userId={userId} userGroups={userGroups} type="revokes" />;
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        sortable: false,
        renderCell: params => {
          const userId = params.row.id;
          if (!userId) return null;
          const userGroups = getUserGroupsForUser(userId, groups);
          return <OverridesCellBox userId={userId} userGroups={userGroups} type="status" />;
        },
      },
      {
        field: "actions",
        headerName: "",
        width: 180,
        align: "right",
        sortable: false,
        filterable: false,
        renderCell: params => {
          const userId = params.row.id;
          if (!userId) return null;
          return (
            <EditOverridesButton labels={t} userId={userId} onManageOverrides={onManageOverrides} showIcon={false} />
          );
        },
      },
    ];
  }, [t, groups, onManageOverrides]);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <DesktopAppDataGrid<User>
        rows={users}
        columns={columns}
        getRowId={row => row.id ?? row.email ?? ""}
        emptyMessage={t.noPermissionsFound}
        loading={loading}
        autoHeight
        paginationOptions={{ mode: "client" }}
      />
    </Box>
  );
}
