"use client";

import { PersonAddOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { StyledUserToolbar } from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared.styles";
import type { AssignedUsersListSlotProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTabShared.types";
import { MobileCardList } from "@/frontend/mobile/components/ui";
import { AssignedUserCard } from "@/frontend/mobile/views/dashboard/permissions/components/assignedUsersTabCard.mobile.parts";

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

export function AssignedUsersToolbar({
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

export function AssignedUsersMobileList({ props, labels }: Readonly<AssignedUsersListSlotProps>) {
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
