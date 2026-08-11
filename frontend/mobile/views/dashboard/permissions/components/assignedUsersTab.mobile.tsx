"use client";

import { PersonAddOutlined, PersonRemoveOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import {
  AssignedUsersBulkActionBar,
  AssignedUsersTabShared,
} from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared";
import {
  StyledRemoveButton,
  StyledUserToolbar,
} from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared.styles";
import type { AssignedUsersTabProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTab.types";
import type { AssignedUsersListSlotProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTabShared.types";
import { assignedUsersTabLabels } from "@/frontend/common/views/dashboard/permissions/utils";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { Link } from "@/shared/i18n";

const StyledAssignUsersButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  textTransform: "none",
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  fontWeight: 600,
  width: "100%",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const StyledUserAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  typography: "bodyMd",
  fontWeight: 600,
}));

function AssignedUsersToolbar({
  searchQuery,
  onSearchChange,
  onAssignGroup,
  groupId,
  assignUsersLabel,
  searchPlaceholder,
  loading,
}: Readonly<{
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAssignGroup: (id: string) => void;
  groupId: string | null | undefined;
  assignUsersLabel: string;
  searchPlaceholder: string;
  loading: boolean;
}>) {
  return (
    <StyledUserToolbar>
      <Box
        component="input"
        type="text"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        autoComplete="off"
        sx={theme => ({
          width: "100%",
          padding: `${theme.spacing(1)} ${theme.spacing(3.5)} ${theme.spacing(1)} ${theme.spacing(3.5)}`,
          border: `1px solid ${theme.palette.outlineVariant}`,
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.surfaceContainer,
          color: theme.palette.onSurface,
          outline: "none",
          typography: "bodyMd",
        })}
      />
      <StyledAssignUsersButton
        variant="contained"
        startIcon={<PersonAddOutlined />}
        onClick={() => groupId && onAssignGroup(groupId)}
        disabled={loading}
      >
        {assignUsersLabel}
      </StyledAssignUsersButton>
    </StyledUserToolbar>
  );
}

function AssignedUserCard({
  user,
  checked,
  profileHref,
  assignedDateLabel,
  removeUserLabel,
  groupCreatedAt,
  groupSlug,
  onUserToggle,
  onRevokeUser,
}: Readonly<{
  user: AssignedUsersTabProps["filteredAssignedUsers"][number];
  checked: boolean;
  profileHref: string | undefined;
  assignedDateLabel: string;
  removeUserLabel: string;
  groupCreatedAt: string | undefined;
  groupSlug: string | undefined;
  onUserToggle: (id: string, checked: boolean) => void;
  onRevokeUser: (userId: string) => void;
}>) {
  const id = user.id ?? "";
  const initials = user.name
    ?.split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const assignedOn = groupCreatedAt ? new Date(groupCreatedAt).toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <MobileCardListItem
      variant="edge-to-edge"
      sx={theme => ({
        backgroundColor: checked ? theme.palette.primaryContainer : undefined,
      })}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <StyledUserAvatar>{initials}</StyledUserAvatar>
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            {profileHref ? (
              <Link href={profileHref} style={{ textDecoration: "none", color: "inherit" }}>
                <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                  {user.name}
                </Typography>
              </Link>
            ) : (
              <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                {user.name}
              </Typography>
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
          <input
            type="checkbox"
            checked={checked}
            onChange={e => onUserToggle(id, e.target.checked)}
            style={{ width: 20, height: 20 }}
          />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {assignedDateLabel}: {assignedOn}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          {id ? (
            <ViewAsUserButton
              variant="link"
              targetUserId={id}
              targetUserName={user.name ?? user.email ?? ""}
              targetIsSuperAdmin={groupSlug === "super_admin"}
            />
          ) : null}
          <StyledRemoveButton
            size="small"
            color="error"
            startIcon={<PersonRemoveOutlined fontSize="small" />}
            onClick={() => id && onRevokeUser(id)}
          >
            {removeUserLabel}
          </StyledRemoveButton>
        </Box>
      </Box>
    </MobileCardListItem>
  );
}

function AssignedUsersMobileList({ props, labels }: Readonly<AssignedUsersListSlotProps>) {
  const { group, filteredAssignedUsers, selectedAssignedUserIds, onRevokeUser, onUserToggle } = props;

  return (
    <MobileCardList
      rows={filteredAssignedUsers}
      emptyMessage={labels.noAssignedUsers}
      getKey={user => (user.id || user.email) ?? ""}
      paginationOptions={{ mode: "client" }}
      layout="edge-to-edge"
      renderItem={user => (
        <AssignedUserCard
          user={user}
          checked={selectedAssignedUserIds.includes(user.id ?? "")}
          profileHref={user.id ? profileHrefForUser(user.id) : undefined}
          assignedDateLabel={labels.assignDate}
          removeUserLabel={labels.removeUser}
          groupCreatedAt={group.createdAt ?? undefined}
          groupSlug={group.slug ?? undefined}
          onUserToggle={onUserToggle}
          onRevokeUser={onRevokeUser}
        />
      )}
    />
  );
}

export function AssignedUsersTabMobile(props: Readonly<AssignedUsersTabProps>) {
  return (
    <AssignedUsersTabShared
      props={props}
      slots={{
        Toolbar: AssignedUsersToolbar,
        BulkActionBar: AssignedUsersBulkActionBar,
        UsersList: AssignedUsersMobileList,
      }}
      labels={assignedUsersTabLabels(props.labels)}
    />
  );
}
