"use client";

import { Box, Button, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { OverridesCell } from "@/frontend/common/views/dashboard/permissions/components/OverridesCell";
import type { UserOverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { getUserGroupsForUser } from "@/frontend/common/views/dashboard/permissions/utils";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";
import { useAppTranslation } from "@/shared/locale";

interface UserGroupsCellProps {
  readonly userGroups: readonly PermissionGroup[];
}

function UserGroupsCell({ userGroups }: Readonly<UserGroupsCellProps>) {
  if (userGroups.length === 0) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.disabled, fontStyle: "italic" })}>
        -
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
      {userGroups.map(group => {
        const name = resolveLocalizedString(group.name);
        if (!name) return null;
        return (
          <Box
            key={group.id || group.slug}
            sx={theme => ({
              typography: "labelMd",
              fontWeight: 500,
              backgroundColor: theme.palette.secondaryContainer,
              color: theme.palette.onSecondaryContainer,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
            })}
          >
            {name}
          </Box>
        );
      })}
    </Box>
  );
}

export function UserOverridesDataGridDesktop({
  users,
  groups,
  onManageOverrides,
  loading = false,
}: Readonly<UserOverridesDataGridProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — memoizing `columns` keeps
  // the MUI DataGrid column-identity stable across re-renders so the grid does
  // not remount/re-sort on each props change.
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
          return <UserGroupsCell userGroups={userGroups} />;
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
          return <OverridesCell userId={userId} userGroups={userGroups} type="grants" />;
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
          return <OverridesCell userId={userId} userGroups={userGroups} type="revokes" />;
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
          return <OverridesCell userId={userId} userGroups={userGroups} type="status" />;
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
            <Button
              size="small"
              onClick={() => onManageOverrides(userId)}
              sx={theme => ({
                textTransform: "uppercase",
                typography: "labelMd",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: "transparent",
                  color: theme.palette.primary.dark,
                  transform: "scale(1.02)",
                },
                transition: "all 0.15s ease",
              })}
            >
              {t.editOverrides}
            </Button>
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
