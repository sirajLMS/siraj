"use client";

import { EditOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import type { PermissionGroupDetailFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { PermissionGroupChipShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupChipShared";
import {
  OverridesCell,
  type OverridesCellLabels,
  type OverridesCellType,
} from "@/frontend/common/views/dashboard/permissions/components/OverridesCell";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import type { PermissionsLabels } from "@/shared/locale";

export function UserGroupsChips({
  userGroups,
}: Readonly<{ readonly userGroups: readonly PermissionGroupDetailFieldsFragment[] }>) {
  if (userGroups.length === 0) {
    return (
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.disabled, fontStyle: "italic" })}>
        -
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {userGroups.map(group => {
        const name = resolveLocalizedString(group.name);
        if (!name) return null;
        return <PermissionGroupChipShared key={group.id ?? group.slug} label={name} />;
      })}
    </Box>
  );
}

export function StatisticBox({
  label,
  children,
}: Readonly<{ readonly label: string; readonly children: React.ReactNode }>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export function OverridesCellBox({
  userId,
  userGroups,
  type,
  labels,
}: Readonly<{
  readonly userId: string;
  readonly userGroups: readonly PermissionGroupDetailFieldsFragment[];
  readonly type: OverridesCellType;
  readonly labels: OverridesCellLabels;
}>) {
  return <OverridesCell userId={userId} userGroups={userGroups} type={type} labels={labels} />;
}

export function EditOverridesButton({
  labels,
  userId,
  onManageOverrides,
  showIcon,
}: Readonly<{
  readonly labels: PermissionsLabels;
  readonly userId: string;
  readonly onManageOverrides: (userId: string) => void;
  readonly showIcon: boolean;
}>) {
  return (
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
        "&:hover": {
          backgroundColor: "transparent",
          color: theme.palette.primary.dark,
          transform: "scale(1.02)",
        },
        transition: theme.transitions.create("all", { duration: 150, easing: "ease" }),
      })}
      startIcon={showIcon ? <EditOutlined fontSize="small" /> : undefined}
    >
      {labels.editOverrides}
    </Button>
  );
}
