"use client";

import { Box, Typography } from "@mui/material";
import type { PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import {
  EditOverridesButton,
  OverridesCellBox,
  StatisticBox,
  StyledUserAvatar,
  UserGroupsChips,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/userOverridesDataGridShared";
import { getAvatarInitials } from "@/frontend/common/views/dashboard/permissions/components/__shared__/userOverridesDataGridShared.helpers";
import type { UserOverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { getUserGroupsForUser } from "@/frontend/common/views/dashboard/permissions/utils";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { Link } from "@/shared/i18n";

interface UserOverridesCardProps {
  readonly labels: UserOverridesDataGridProps["labels"];
  readonly user: User;
  readonly groups: readonly PermissionGroup[];
  readonly onManageOverrides: (userId: string) => void;
}

function UserOverridesCardMobile({ labels, user, groups, onManageOverrides }: Readonly<UserOverridesCardProps>) {
  const t = labels;
  const userId = user.id ?? "";
  const userGroups = getUserGroupsForUser(userId, groups);

  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <StyledUserAvatar>{getAvatarInitials(user)}</StyledUserAvatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {userId && (
              <Link href={profileHrefForUser(userId)} style={{ textDecoration: "none", color: "inherit" }}>
                <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                  {user.name}
                </Typography>
              </Link>
            )}
            <Typography
              variant="labelMd"
              sx={theme => ({
                color: theme.palette.text.secondary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              })}
            >
              {user.email}
            </Typography>
          </Box>
        </Box>

        <UserGroupsChips userGroups={userGroups} />

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <StatisticBox label={t.explicitGrant}>
            <OverridesCellBox userId={userId} userGroups={userGroups} type="grants" />
          </StatisticBox>
          <StatisticBox label={t.explicitDeny}>
            <OverridesCellBox userId={userId} userGroups={userGroups} type="revokes" />
          </StatisticBox>
          <StatisticBox label={t.columnStatus}>
            <OverridesCellBox userId={userId} userGroups={userGroups} type="status" />
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
