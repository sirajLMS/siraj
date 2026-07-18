"use client";

import { useQuery } from "@apollo/client/react";
import { CheckCircleOutlined, EditOutlined, WarningOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { PermissionGroup, User, UserOverride } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { userOverridesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import type { UserOverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

interface OverridesInfo {
  readonly grants: number;
  readonly revokes: number;
  readonly status: "healthy" | "conflict";
  readonly conflictDetails: string[];
}

function buildConflictDetails(overrides: readonly UserOverride[], inheritedPermissionIds: Set<string>): string[] {
  const details: string[] = [];
  for (const override of overrides) {
    if (!override.permissionId) continue;
    const isInherited = inheritedPermissionIds.has(override.permissionId);
    if (override.state === "DENIED" && isInherited) {
      details.push(`Deny override for "${override.permissionId}" conflicts with inherited group permission.`);
    } else if (override.state === "GRANTED" && isInherited) {
      details.push(`Allow override for "${override.permissionId}" overlaps with inherited group permission.`);
    }
  }
  return details;
}

function computeOverrideInfo(
  data: { userOverrides?: readonly UserOverride[] | null } | undefined,
  userGroups: readonly PermissionGroup[]
): OverridesInfo | null {
  if (!data?.userOverrides) return null;

  const overrides = data.userOverrides;
  const grants = overrides.filter((o: UserOverride) => o.state === "GRANTED").length;
  const revokes = overrides.filter((o: UserOverride) => o.state === "DENIED").length;

  const inheritedPermissionIds = new Set<string>();
  for (const group of userGroups) {
    if (group.permissionIds) {
      for (const pid of group.permissionIds) {
        inheritedPermissionIds.add(pid);
      }
    }
  }

  const conflictDetails = buildConflictDetails(overrides, inheritedPermissionIds);
  return {
    grants,
    revokes,
    status: conflictDetails.length > 0 ? "conflict" : "healthy",
    conflictDetails,
  };
}

function useUserOverridesInfo(
  userId: string,
  userGroups: readonly PermissionGroup[]
): {
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly info: OverridesInfo | null;
} {
  const { data, loading, error } = useQuery(userOverridesQueryDocument, {
    variables: { userId },
    skip: !userId,
  });

  return { loading, error, info: computeOverrideInfo(data, userGroups) };
}

function getUserGroupsForUser(
  userId: string | undefined,
  groups: readonly PermissionGroup[]
): readonly PermissionGroup[] {
  if (!userId) return [];
  return groups.filter(g => g.assignedUsers?.some(au => au.id === userId));
}

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

function UserOverridesCardMobile({ user, groups, onManageOverrides }: Readonly<UserOverridesCardProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;
  const userId = user.id ?? "";
  const userGroups = getUserGroupsForUser(userId, groups);
  const { loading, info } = useUserOverridesInfo(userId, userGroups);

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
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.explicitGrant}
            </Typography>
            {loading ? (
              <CircularProgress size={16} thickness={5} color="inherit" sx={{ opacity: 0.5 }} />
            ) : (
              <Typography
                variant="bodyMd"
                sx={theme => ({
                  fontWeight: 700,
                  color: info?.grants ? theme.palette.success.main : theme.palette.text.secondary,
                })}
              >
                {info?.grants ?? 0}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.explicitDeny}
            </Typography>
            {loading ? (
              <CircularProgress size={16} thickness={5} color="inherit" sx={{ opacity: 0.5 }} />
            ) : (
              <Typography
                variant="bodyMd"
                sx={theme => ({
                  fontWeight: 700,
                  color: info?.revokes ? theme.palette.error.main : theme.palette.text.secondary,
                })}
              >
                {info?.revokes ?? 0}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              Status
            </Typography>
            {!loading && info ? (
              info.status === "conflict" ? (
                <Box
                  sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.warning.main })}
                >
                  <WarningOutlined fontSize="small" />
                  <Typography variant="labelMd" sx={{ fontWeight: 600 }}>
                    Conflict
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.success.main })}
                >
                  <CheckCircleOutlined fontSize="small" />
                  <Typography variant="labelMd" sx={{ fontWeight: 600 }}>
                    Healthy
                  </Typography>
                </Box>
              )
            ) : (
              <Typography variant="bodyMd">-</Typography>
            )}
          </Box>
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
