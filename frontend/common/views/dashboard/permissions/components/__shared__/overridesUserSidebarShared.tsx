"use client";

import { Avatar, Box, Typography } from "@mui/material";
import { type SxProps, styled, type Theme } from "@mui/material/styles";
import type { ComponentType } from "react";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import type { OverridesUserSidebarProps } from "@/frontend/common/views/dashboard/permissions/types";

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

const StyledUserAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  typography: "headlineLg",
  fontWeight: 600,
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

const StyledGroupChip = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
  backgroundColor: theme.palette.secondaryContainer,
  color: theme.palette.onSecondaryContainer,
}));

const StyledGroupName = styled(Typography)({
  fontWeight: 500,
});

export function OverridesUserSidebarShared({
  labels,
  user,
  userGroups,
  options,
  slots,
}: Readonly<OverridesUserSidebarProps> & {
  readonly options: OverridesUserSidebarSharedOptions;
  readonly slots: OverridesUserSidebarSharedSlots;
}) {
  const t = labels;
  const { LocalizedStringDisplay } = slots;

  return (
    <Box sx={options.sidebarContainerSx}>
      <StyledUserInfoBox>
        <StyledUserAvatar src={user.avatarUrl ?? undefined} alt={user.name ?? ""}>
          {user.name
            ?.split(" ")
            .map(w => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </StyledUserAvatar>
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
              <StyledGroupChip key={g.id ?? g.slug}>
                <StyledGroupName variant="bodyMd">
                  <LocalizedStringDisplay value={g.name ?? {}} typographyVariant="bodyMd" />
                </StyledGroupName>
              </StyledGroupChip>
            ))}
          </Box>
        )}
      </StyledGroupsSection>
    </Box>
  );
}
