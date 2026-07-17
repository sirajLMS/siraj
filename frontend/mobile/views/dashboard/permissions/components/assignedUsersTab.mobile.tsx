"use client";

import { DeleteOutlined, PersonAddOutlined, PersonRemoveOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { BaseCard } from "@/frontend/common/components/ui";
import type { GroupUser, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

const StyledTabContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

const StyledUserToolbar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 2,
  backgroundColor: theme.palette.surfaceContainerLow ?? theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  alignItems: "stretch",
}));

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

const StyledBulkActionBar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  backgroundColor: theme.palette.errorContainer ?? theme.palette.error.main,
  color: theme.palette.onErrorContainer ?? theme.palette.error.main,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  justifyContent: "space-between",
  alignItems: "stretch",
  boxShadow: theme.palette.shadow.card,
}));

const StyledRemoveSelectedButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 700,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  width: "100%",
}));

const StyledUserAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  typography: "bodyMd",
  fontWeight: 600,
}));

const StyledRemoveButton = styled(Button)(() => ({
  fontWeight: 600,
  typography: "labelMd",
}));

interface AssignedUsersTabMobileProps {
  readonly group: PermissionGroup;
  readonly filteredAssignedUsers: readonly GroupUser[];
  readonly selectedAssignedUserIds: readonly string[];
  readonly searchQuery: string;
  readonly selectedCount?: number;
  readonly onBulkRevokeUsers: () => void;
  readonly onRevokeUser: (userId: string) => void;
  readonly onUserToggle: (id: string, checked: boolean) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly loading?: boolean;
}

export function AssignedUsersTabMobile({
  group,
  filteredAssignedUsers,
  selectedAssignedUserIds,
  searchQuery,
  onBulkRevokeUsers,
  onRevokeUser,
  onUserToggle,
  onSearchChange,
  onAssignGroup,
  loading = false,
}: Readonly<AssignedUsersTabMobileProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  return (
    <StyledTabContainer>
      <StyledUserToolbar>
        <Box
          component="input"
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t.searchAssignedUsers}
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
          onClick={() => group.id && onAssignGroup(group.id)}
          disabled={loading}
        >
          {t.assignUsers}
        </StyledAssignUsersButton>
      </StyledUserToolbar>

      {selectedAssignedUserIds.length > 0 && (
        <StyledBulkActionBar>
          <Typography variant="titleLg" sx={{ fontWeight: 600 }}>
            {t.usersSelected(selectedAssignedUserIds.length)}
          </Typography>
          <StyledRemoveSelectedButton
            variant="contained"
            color="error"
            startIcon={<DeleteOutlined />}
            onClick={onBulkRevokeUsers}
          >
            {t.removeSelected}
          </StyledRemoveSelectedButton>
        </StyledBulkActionBar>
      )}

      {filteredAssignedUsers.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {t.noAssignedUsers}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredAssignedUsers.map(user => {
            const id = user.id ?? "";
            const checked = selectedAssignedUserIds.includes(id);
            const profileHref = id ? profileHrefForUser(id) : undefined;

            return (
              <BaseCard
                key={(id || user.email) ?? ""}
                sx={theme => ({
                  p: 2,
                  backgroundColor: checked ? theme.palette.primaryContainer : undefined,
                })}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <StyledUserAvatar>
                      {user.name
                        ?.split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </StyledUserAvatar>
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
                      {t.assignedDate}:{" "}
                      {group.createdAt
                        ? new Date(group.createdAt).toLocaleDateString()
                        : new Date().toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    {id && (
                      <ViewAsUserButton
                        variant="link"
                        targetUserId={id}
                        targetUserName={user.name ?? user.email ?? ""}
                        targetIsSuperAdmin={group.slug === "super_admin"}
                      />
                    )}
                    <StyledRemoveButton
                      size="small"
                      color="error"
                      startIcon={<PersonRemoveOutlined fontSize="small" />}
                      onClick={() => id && onRevokeUser(id)}
                    >
                      {t.removeUser}
                    </StyledRemoveButton>
                  </Box>
                </Box>
              </BaseCard>
            );
          })}
        </Box>
      )}
    </StyledTabContainer>
  );
}
