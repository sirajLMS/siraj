"use client";

import { Box, Typography } from "@mui/material";
import { type SxProps, styled, type Theme } from "@mui/material/styles";
import type { ComponentType } from "react";
import { UserAvatar } from "@/frontend/common/components/ui/avatar";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { PermissionGroupChipShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupChipShared";
import type { OverridesUserSidebarProps } from "@/frontend/common/views/dashboard/permissions/types";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

export interface OverridesUserSidebarSharedOptions {
  readonly sidebarContainerSx: SxProps<Theme>;
}

export interface OverridesUserSidebarSharedSlots {
  readonly LocalizedStringDisplay: ComponentType<{
    readonly value: Record<string, unknown>;
    readonly typographyVariant?: UiTypographyVariant;
  }>;
}

const StyledUserInfoBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const StyledGroupsSection = styled(Box)({
  width: "100%",
  textAlign: "left",
});

const StyledGroupsSectionLabel = styled(Typography)(({ theme }) => ({
  textTransform: "uppercase",
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1.5),
  letterSpacing: "0.05em",
}));

export function OverridesUserSidebarShared({
  labels,
  user,
  userGroups,
  options,
}: Readonly<OverridesUserSidebarProps> & {
  readonly options: OverridesUserSidebarSharedOptions;
  readonly slots: OverridesUserSidebarSharedSlots;
}) {
  const t = labels;

  return (
    <Box sx={options.sidebarContainerSx}>
      <StyledUserInfoBox>
        <UserAvatar src={user.avatarUrl ?? undefined} label={user.name ?? ""} size={80} />
        <Box>
          <Typography variant="titleLg" sx={{ fontWeight: 600 }}>
            {user.name}
          </Typography>
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
            {user.email}
          </Typography>
        </Box>
      </StyledUserInfoBox>

      <StyledGroupsSection>
        <StyledGroupsSectionLabel variant="labelMd">{t.currentGroups}</StyledGroupsSectionLabel>
        {userGroups.length === 0 ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.disabled, fontStyle: "italic" })}>
            {t.noAssignedGroups}
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {userGroups.map(g => (
              <PermissionGroupChipShared
                key={g.id ?? g.slug}
                label={resolveLocalizedString(g.name)}
                sx={theme => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1,
                  borderRadius: Number(theme.shape.borderRadius) * 1.5,
                })}
              />
            ))}
          </Box>
        )}
      </StyledGroupsSection>
    </Box>
  );
}
