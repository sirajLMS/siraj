"use client";

import { useQuery } from "@apollo/client/react";
import { CheckCircleOutlined, WarningOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, CircularProgress, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/components/ui";
import type { PermissionGroup, User, UserOverride } from "@/frontend/graphql/generated/gql/graphql-types";
import { userOverridesQueryDocument } from "@/frontend/graphql/sharedDocuments/permission-management.documents";

export interface UserOverridesDataGridProps {
  readonly users: readonly User[];
  readonly groups: readonly PermissionGroup[];
  readonly onManageOverrides: (userId: string) => void;
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
  readonly error: any;
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

    // Build the set of all permission IDs inherited via groups
    const inheritedPermissionIds = new Set<string>();
    for (const group of userGroups) {
      if (group.permissionIds) {
        for (const pid of group.permissionIds) {
          inheritedPermissionIds.add(pid);
        }
      }
    }

    const conflictDetails: string[] = [];
    let hasConflict = false;

    for (const override of overrides) {
      const isInherited = override.permissionId ? inheritedPermissionIds.has(override.permissionId) : false;
      if (override.state === "DENIED" && isInherited) {
        hasConflict = true;
        conflictDetails.push(`Deny override for "${override.permissionId}" conflicts with inherited group permission.`);
      } else if (override.state === "GRANTED" && isInherited) {
        hasConflict = true;
        conflictDetails.push(`Allow override for "${override.permissionId}" overlaps with inherited group permission.`);
      }
    }

    return {
      grants,
      revokes,
      status: hasConflict ? "conflict" : "healthy",
      conflictDetails,
    };
  }, [data, userGroups]);

  return { loading, error, info };
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
      {userGroups.map(g => (
        <Box
          key={g.id || g.slug}
          sx={theme => ({
            fontSize: "0.75rem",
            fontWeight: 500,
            backgroundColor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
          })}
        >
          {g.name}
        </Box>
      ))}
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
            minWidth: 24,
            height: 24,
            borderRadius: 1,
            px: 1,
            backgroundColor: "rgba(27, 59, 43, 0.15)",
            color: theme.palette.success.main,
            border: `1px solid ${theme.palette.success.light}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "0.85rem",
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
            minWidth: 24,
            height: 24,
            borderRadius: 1,
            px: 1,
            backgroundColor: "rgba(74, 22, 22, 0.15)",
            color: theme.palette.error.main,
            border: `1px solid ${theme.palette.error.light}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "0.85rem",
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
          <Typography variant="bodyMd" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
            Conflict
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.success.main })}>
      <CheckCircleOutlined fontSize="small" />
      <Typography variant="bodyMd" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
        Healthy
      </Typography>
    </Box>
  );
}

export function UserOverridesDataGrid({ users, groups, onManageOverrides }: Readonly<UserOverridesDataGridProps>) {
  const t = useTranslations("dashboard.permissions");

  const columns = useMemo<GridColDef<User>[]>(() => {
    return [
      {
        field: "name",
        headerName: t("selectUserLabel"),
        flex: 1.5,
        minWidth: 220,
        renderCell: params => {
          const user = params.row;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
              <Avatar
                src={user.avatarUrl ?? undefined}
                alt={user.name ?? ""}
                sx={theme => ({
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.primaryContainer,
                  color: theme.palette.onPrimaryContainer,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                })}
              >
                {user.name
                  ?.split(" ")
                  .map(w => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <Typography
                  variant="bodyMd"
                  sx={{
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.name}
                </Typography>
                <Typography
                  variant="bodyMd"
                  sx={theme => ({
                    color: theme.palette.text.secondary,
                    fontSize: "0.75rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  })}
                >
                  {user.email}
                </Typography>
              </Box>
            </Box>
          );
        },
      },
      {
        field: "baseGroups",
        headerName: t("groupsTab"),
        flex: 1.5,
        minWidth: 200,
        sortable: false,
        renderCell: params => {
          const userId = params.row.id;
          const userGroups = groups.filter(g => g.assignedUsers?.some(au => au.id === userId));
          return <UserGroupsCell userGroups={userGroups} />;
        },
      },
      {
        field: "activeGrants",
        headerName: t("explicitGrant"),
        width: 140,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: params => {
          const userId = params.row.id;
          if (!userId) return null;
          const userGroups = groups.filter(g => g.assignedUsers?.some(au => au.id === userId));
          return <DynamicOverridesCell userId={userId} userGroups={userGroups} type="grants" />;
        },
      },
      {
        field: "activeRevokes",
        headerName: t("explicitDeny"),
        width: 140,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: params => {
          const userId = params.row.id;
          if (!userId) return null;
          const userGroups = groups.filter(g => g.assignedUsers?.some(au => au.id === userId));
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
          const userGroups = groups.filter(g => g.assignedUsers?.some(au => au.id === userId));
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
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: theme.palette.primary.main,
                "&:hover": {
                  bgcolor: "transparent",
                  color: theme.palette.primary.dark,
                  transform: "scale(1.02)",
                },
                transition: "all 0.15s ease",
              })}
            >
              {t("editOverrides")}
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
        emptyMessage={t("noPermissionsFound")}
        autoHeight
      />
    </Box>
  );
}
