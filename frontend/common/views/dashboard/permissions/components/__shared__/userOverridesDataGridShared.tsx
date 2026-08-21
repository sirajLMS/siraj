"use client";

import { EditOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { PermissionGroupDetailFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  OverridesCell,
  type OverridesCellType,
} from "@/frontend/common/views/dashboard/permissions/components/OverridesCell";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import type { PermissionsLabels } from "@/shared/locale";

const StyledUserAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  typography: "bodyMd",
  fontWeight: 600,
}));

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
        return (
          <Box
            key={group.id ?? group.slug}
            sx={theme => ({
              typography: "labelMd",
              fontWeight: 500,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              backgroundColor: theme.palette.secondaryContainer,
              color: theme.palette.onSecondaryContainer,
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
}: Readonly<{
  readonly userId: string;
  readonly userGroups: readonly PermissionGroupDetailFieldsFragment[];
  readonly type: OverridesCellType;
}>) {
  return <OverridesCell userId={userId} userGroups={userGroups} type={type} />;
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

export { StyledUserAvatar };
