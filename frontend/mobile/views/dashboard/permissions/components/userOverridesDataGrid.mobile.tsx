"use client";

import { Box } from "@mui/material";
import type {
  PermissionGroupDetailFieldsFragment,
  UsersQuery_users,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import {
  EditOverridesButton,
  OverridesCellBox,
  StatisticBox,
  UserGroupsChips,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/userOverridesDataGridShared";
import type { UserOverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { getUserGroupsForUser } from "@/frontend/common/views/dashboard/permissions/utils";
import { MobileCardList, MobileCardListItem, MobilePersonProfileLink } from "@/frontend/mobile/components/ui";

interface UserOverridesCardProps {
  readonly labels: UserOverridesDataGridProps["labels"];
  readonly user: UsersQuery_users;
  readonly groups: readonly PermissionGroupDetailFieldsFragment[];
  readonly onManageOverrides: (userId: string) => void;
}

function UserOverridesCardMobile({ labels, user, groups, onManageOverrides }: Readonly<UserOverridesCardProps>) {
  const t = labels;
  const userId = user.id ?? "";
  const userGroups = getUserGroupsForUser(userId, groups);

  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <MobilePersonProfileLink
          href={user.id ? profileHrefForUser(user.id) : undefined}
          name={user.name ?? ""}
          avatarUrl={user.avatarUrl}
          label={user.email ?? undefined}
        />

        <UserGroupsChips userGroups={userGroups} />

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <StatisticBox label={t.explicitGrant}>
            <OverridesCellBox userId={userId} userGroups={userGroups} type="grants" labels={t} />
          </StatisticBox>
          <StatisticBox label={t.explicitDeny}>
            <OverridesCellBox userId={userId} userGroups={userGroups} type="revokes" labels={t} />
          </StatisticBox>
          <StatisticBox label={t.columnStatus}>
            <OverridesCellBox userId={userId} userGroups={userGroups} type="status" labels={t} />
          </StatisticBox>
        </Box>

        <EditOverridesButton labels={t} userId={userId} onManageOverrides={onManageOverrides} showIcon />
      </Box>
    </MobileCardListItem>
  );
}

export function UserOverridesDataGridMobile({
  labels,
  users,
  groups,
  onManageOverrides,
  loading = false,
}: Readonly<UserOverridesDataGridProps>) {
  const t = labels;

  return (
    <MobileCardList
      rows={users}
      loading={loading}
      emptyMessage={t.noPermissionsFound}
      getKey={user => user.id ?? user.email ?? ""}
      paginationOptions={{ mode: "client" }}
      layout="edge-to-edge"
      renderItem={user => (
        <UserOverridesCardMobile labels={labels} user={user} groups={groups} onManageOverrides={onManageOverrides} />
      )}
    />
  );
}
