"use client";

import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { UsersQuery_users as User } from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import {
  EditOverridesButton,
  OverridesCellBox,
  UserGroupsChips,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/userOverridesDataGridShared";
import type { OverridesCellType } from "@/frontend/common/views/dashboard/permissions/components/OverridesCell";
import type { UserOverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { getUserGroupsForUser } from "@/frontend/common/views/dashboard/permissions/utils";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";

type ColumnLabels = UserOverridesDataGridProps["labels"];
type ColumnGroups = UserOverridesDataGridProps["groups"];
type ManageOverridesHandler = UserOverridesDataGridProps["onManageOverrides"];

type OverridesColumnConfig = Readonly<{
  readonly field: "activeGrants" | "activeRevokes" | "status";
  readonly headerName: string;
  readonly cellType: OverridesCellType;
  readonly width: number;
  readonly centered: boolean;
  readonly labels: ColumnLabels;
  readonly groups: ColumnGroups;
}>;

function buildNameColumn(labels: ColumnLabels): GridColDef<User> {
  return {
    field: "name",
    headerName: labels.selectUserLabel,
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
  };
}

function buildBaseGroupsColumn(labels: ColumnLabels, groups: ColumnGroups): GridColDef<User> {
  return {
    field: "baseGroups",
    headerName: labels.groupsTab,
    flex: 1.5,
    minWidth: 200,
    sortable: false,
    renderCell: params => {
      const userGroups = getUserGroupsForUser(params.row.id ?? undefined, groups);
      return <UserGroupsChips userGroups={userGroups} />;
    },
  };
}

function buildOverridesColumn({
  field,
  headerName,
  cellType,
  width,
  centered,
  labels,
  groups,
}: OverridesColumnConfig): GridColDef<User> {
  return {
    field,
    headerName,
    width,
    align: centered ? "center" : undefined,
    headerAlign: centered ? "center" : undefined,
    sortable: false,
    renderCell: params => {
      const userId = params.row.id;
      if (!userId) return null;
      const userGroups = getUserGroupsForUser(userId, groups);
      return <OverridesCellBox userId={userId} userGroups={userGroups} type={cellType} labels={labels} />;
    },
  };
}

function buildActionsColumn(labels: ColumnLabels, onManageOverrides: ManageOverridesHandler): GridColDef<User> {
  return {
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
        <EditOverridesButton labels={labels} userId={userId} onManageOverrides={onManageOverrides} showIcon={false} />
      );
    },
  };
}

export function buildUserOverridesColumns({
  labels,
  groups,
  onManageOverrides,
}: Readonly<Pick<UserOverridesDataGridProps, "labels" | "groups" | "onManageOverrides">>): GridColDef<User>[] {
  return [
    buildNameColumn(labels),
    buildBaseGroupsColumn(labels, groups),
    buildOverridesColumn({
      field: "activeGrants",
      headerName: labels.explicitGrant,
      cellType: "grants",
      width: 140,
      centered: true,
      labels,
      groups,
    }),
    buildOverridesColumn({
      field: "activeRevokes",
      headerName: labels.explicitDeny,
      cellType: "revokes",
      width: 140,
      centered: true,
      labels,
      groups,
    }),
    buildOverridesColumn({
      field: "status",
      headerName: labels.columnStatus,
      cellType: "status",
      width: 130,
      centered: false,
      labels,
      groups,
    }),
    buildActionsColumn(labels, onManageOverrides),
  ];
}
