"use client";

import { PersonAddOutlined, PersonRemoveOutlined } from "@mui/icons-material";
import { Box, Button, Checkbox, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
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
import { MobileCardList, MobileCardListItem, MobilePersonProfileLink } from "@/frontend/mobile/components/ui";

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
      <SearchBarField value={searchQuery} placeholder={searchPlaceholder} onChange={onSearchChange} />
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
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MobilePersonProfileLink
              href={profileHref}
              name={user.name ?? ""}
              avatarSize={40}
              label={user.email ?? undefined}
              typographyVariant="bodyMd"
              fontWeight={600}
            />
          </Box>
          <Checkbox
            checked={checked}
            onChange={e => onUserToggle(id, e.target.checked)}
            aria-label={user.name ?? user.email ?? ""}
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
      getKey={user => user.id ?? user.email ?? ""}
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
