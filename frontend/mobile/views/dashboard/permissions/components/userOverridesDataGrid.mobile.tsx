"use client";

import { EditOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { OverridesCell } from "@/frontend/common/views/dashboard/permissions/components/OverridesCell";
import type { UserOverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { getUserGroupsForUser } from "@/frontend/common/views/dashboard/permissions/utils";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

const StyledUserAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  typography: "bodyMd",
  fontWeight: 600,
}));

interface UserOverridesCardProps {
  readonly user: User;
  readonly groups: readonly PermissionGroup[];
  readonly onManageOverrides: (userId: string) => void;
}

function StatisticBoxMobile({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function UserOverridesCardMobile({ user, groups, onManageOverrides }: Readonly<UserOverridesCardProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;
  const userId = user.id ?? "";
  const userGroups = getUserGroupsForUser(userId, groups);

  return (
    <MobileBaseCard sx={{ p: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <StyledUserAvatar>
            {user.name
              ?.split(" ")
              .map(w => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </StyledUserAvatar>
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

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {userGroups.length === 0 ? (
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.disabled, fontStyle: "italic" })}>
              -
            </Typography>
          ) : (
            userGroups.map(group => {
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
            })
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <StatisticBoxMobile label={t.explicitGrant}>
            <OverridesCell userId={userId} userGroups={userGroups} type="grants" />
          </StatisticBoxMobile>
          <StatisticBoxMobile label={t.explicitDeny}>
            <OverridesCell userId={userId} userGroups={userGroups} type="revokes" />
          </StatisticBoxMobile>
          <StatisticBoxMobile label="Status">
            <OverridesCell userId={userId} userGroups={userGroups} type="status" />
          </StatisticBoxMobile>
        </Box>

        <Button
          size="small"
          variant="outlined"
          onClick={() => onManageOverrides(userId)}
          sx={theme => ({
            textTransform: "uppercase",
            typography: "labelMd",
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
          })}
          startIcon={<EditOutlined fontSize="small" />}
        >
          {t.editOverrides}
        </Button>
      </Box>
    </MobileBaseCard>
  );
}

export function UserOverridesDataGridMobile({
  users,
  groups,
  onManageOverrides,
  loading = false,
}: Readonly<UserOverridesDataGridProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  if (users.length === 0 && !loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t.noPermissionsFound}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {users.map(user => (
        <UserOverridesCardMobile
          key={user.id ?? user.email ?? ""}
          user={user}
          groups={groups}
          onManageOverrides={onManageOverrides}
        />
      ))}
    </Box>
  );
}
