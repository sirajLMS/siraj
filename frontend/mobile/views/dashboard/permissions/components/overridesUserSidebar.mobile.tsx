"use client";

import { Avatar, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MobileLocalizedStringDisplay } from "@/frontend/mobile/components/ui/display/localizedStringDisplay";
import { useAppTranslation } from "@/shared/locale";

const StyledSidebarContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  backgroundColor: theme.palette.surfaceContainerLow ?? "transparent",
  gap: theme.spacing(3),
}));

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

interface OverridesUserSidebarMobileProps {
  readonly user: User;
  readonly userGroups: readonly PermissionGroup[];
}

export function OverridesUserSidebarMobile({ user, userGroups }: Readonly<OverridesUserSidebarMobileProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  return (
    <StyledSidebarContainer>
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
              <StyledGroupChip key={g.id || g.slug}>
                <StyledGroupName variant="bodyMd">
                  <MobileLocalizedStringDisplay value={g.name ?? {}} typographyVariant="bodyMd" />
                </StyledGroupName>
              </StyledGroupChip>
            ))}
          </Box>
        )}
      </StyledGroupsSection>
    </StyledSidebarContainer>
  );
}
