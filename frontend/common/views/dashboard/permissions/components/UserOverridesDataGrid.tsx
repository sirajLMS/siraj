"use client";

import { useQuery } from "@apollo/client/react";
import { CheckCircleOutlined, WarningOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, PersonProfileLinkCell } from "@/frontend/common/components/ui";
import type { PermissionGroup, User, UserOverride } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { userOverridesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { useAppTranslation } from "@/shared/locale/client";

export interface UserOverridesDataGridProps {
  readonly users: readonly User[];
  readonly groups: readonly PermissionGroup[];
  readonly onManageOverrides: (userId: string) => void;
  readonly loading?: boolean;
}

interface OverridesInfo {
  readonly grants: number;
  readonly revokes: number;
  readonly status: "healthy" | "conflict";
  readonly conflictDetails: string[];
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

  const info = useMemo<OverridesInfo | null>(() => {
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
    const hasConflict = conflictDetails.length > 0;

    return {
      grants,
      revokes,
      status: hasConflict ? "conflict" : "healthy",
      conflictDetails,
    };
  }, [data, userGroups]);

  return { loading, error, info };
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

function getUserGroupsForUser(
  userId: string | undefined,
  groups: readonly PermissionGroup[]
): readonly PermissionGroup[] {
  if (!userId) return [];
  return groups.filter(g => g.assignedUsers?.some(au => au.id === userId));
}

interface UserGroupsCellProps {
  readonly userGroups: readonly PermissionGroup[];
}

function UserGroupsCell({ userGroups }: Readonly<UserGroupsCellProps>) {
  if (userGroups.length === 0) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.disabled, fontStyle: "italic" })}>
        -
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
      {userGroups.map(group => {
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
      })}
    </Box>
  );
}

interface DynamicOverridesCellProps {
  readonly userId: string;
  readonly userGroups: readonly PermissionGroup[];
  readonly type: "grants" | "revokes" | "status";
}

function DynamicOverridesCell({ userId, userGroups, type }: Readonly<DynamicOverridesCellProps>) {
  const { loading, info } = useUserOverridesInfo(userId, userGroups);

  if (loading) {
    return <CircularProgress size={16} thickness={5} color="inherit" sx={{ opacity: 0.5 }} />;
  }

  if (!info) {
    return <Typography variant="bodyMd">-</Typography>;
  }

  if (type === "grants") {
    if (info.grants > 0) {
      return (
        <Box
          sx={theme => ({
            fontSize: theme.typography.bodyMd.fontSize,
            fontWeight: "bold",
            minWidth: 24,
            height: 24,
            borderRadius: 1,
            px: 1,
            backgroundColor: theme.palette.successContainer ?? alpha(theme.palette.success.main, 0.15),
            color: theme.palette.success.main,
            border: `1px solid ${theme.palette.success.light}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          {info.grants}
        </Box>
      );
    }
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {info.grants}
      </Typography>
    );
  }

  if (type === "revokes") {
    if (info.revokes > 0) {
      return (
        <Box
          sx={theme => ({
            fontSize: theme.typography.bodyMd.fontSize,
            fontWeight: "bold",
            minWidth: 24,
            height: 24,
            borderRadius: 1,
            px: 1,
            backgroundColor: theme.palette.errorContainer ?? alpha(theme.palette.error.main, 0.15),
            color: theme.palette.error.main,
            border: `1px solid ${theme.palette.error.light}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          {info.revokes}
        </Box>
      );
    }
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {info.revokes}
      </Typography>
    );
  }

  // Type is status
  if (info.status === "conflict") {
    const tooltipTitle = info.conflictDetails.join("\n");
    return (
      <Tooltip title={tooltipTitle} arrow placement="top">
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: theme.palette.warning.main,
            cursor: "help",
          })}
        >
          <WarningOutlined fontSize="small" />
          <Typography variant="labelMd" sx={{ fontWeight: 600 }}>
            Conflict
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.success.main })}>
      <CheckCircleOutlined fontSize="small" />
      <Typography variant="labelMd" sx={{ fontWeight: 600 }}>
        Healthy
      </Typography>
    </Box>
  );
}

export function UserOverridesDataGrid({
  users,
  groups,
  onManageOverrides,
  loading = false,
}: Readonly<UserOverridesDataGridProps>) {
  const t = useAppTranslation("dashboard.permissions");

  const columns = useMemo<GridColDef<User>[]>(() => {
    return [
      {
        field: "name",
        headerName: t.selectUserLabel,
        flex: 1.5,
        minWidth: 220,
        renderCell: params => {
          const user = params.row;
          return (
            <Box sx={{ display: "flex", alignItems: "center", py: 1, height: "100%" }}>
              <PersonProfileLinkCell
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
      },
      {
        field: "baseGroups",
        headerName: t.groupsTab,
        flex: 1.5,
        minWidth: 200,
        sortable: false,
        renderCell: params => {
          const userGroups = getUserGroupsForUser(params.row.id ?? undefined, groups);
          return <UserGroupsCell userGroups={userGroups} />;
        },
      },
      {
        field: "activeGrants",
        headerName: t.explicitGrant,
        width: 140,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: params => {
          const userId = params.row.id;
          if (!userId) return null;
          const userGroups = getUserGroupsForUser(userId, groups);
          return <DynamicOverridesCell userId={userId} userGroups={userGroups} type="grants" />;
        },
      },
      {
        field: "activeRevokes",
        headerName: t.explicitDeny,
        width: 140,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: params => {
          const userId = params.row.id;
          if (!userId) return null;
          const userGroups = getUserGroupsForUser(userId, groups);
          return <DynamicOverridesCell userId={userId} userGroups={userGroups} type="revokes" />;
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        sortable: false,
        renderCell: params => {
          const userId = params.row.id;
          if (!userId) return null;
          const userGroups = getUserGroupsForUser(userId, groups);
          return <DynamicOverridesCell userId={userId} userGroups={userGroups} type="status" />;
        },
      },
      {
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
            <Button
              size="small"
              onClick={() => onManageOverrides(userId)}
              sx={theme => ({
                textTransform: "uppercase",
                typography: "labelMd",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: "transparent",
                  color: theme.palette.primary.dark,
                  transform: "scale(1.02)",
                },
                transition: "all 0.15s ease",
              })}
            >
              {t.editOverrides}
            </Button>
          );
        },
      },
    ];
  }, [t, groups, onManageOverrides]);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <AppDataGrid<User>
        rows={users}
        columns={columns}
        getRowId={row => row.id ?? row.email ?? ""}
        emptyMessage={t.noPermissionsFound}
        loading={loading}
        autoHeight
      />
    </Box>
  );
}
