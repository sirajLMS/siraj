"use client";

import { PersonRemoveOutlined } from "@mui/icons-material";
import { Box, Checkbox, Typography } from "@mui/material";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { StyledRemoveButton } from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared.styles";
import type { AssignedUsersTabProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTab.types";
import { MobileCardListItem, MobilePersonProfileLink } from "@/frontend/mobile/components/ui";

export function AssignedUserCard({
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
