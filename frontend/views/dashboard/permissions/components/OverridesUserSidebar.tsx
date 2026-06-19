"use client";

import { Avatar, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { PermissionGroup, User } from "@/frontend/graphql/generated/gql/graphql-types";

const StyledSidebarContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  borderRight: "none",
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  backgroundColor: theme.palette.surfaceContainerLow ?? "transparent",
  gap: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    width: "25%",
    borderRight: `1px solid ${theme.palette.divider}`,
    borderBottom: "none",
  },
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
  fontSize: "2rem",
  fontWeight: 600,
}));

const StyledGroupsSection = styled(Box)({
  width: "100%",
  textAlign: "left",
});

const StyledGroupsSectionLabel = styled(Typography)(({ theme }) => ({
  textTransform: "uppercase",
  fontSize: "0.75rem",
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
  fontSize: "0.875rem",
});

interface OverridesUserSidebarProps {
  readonly user: User;
  readonly userGroups: readonly PermissionGroup[];
}

export function OverridesUserSidebar({ user, userGroups }: Readonly<OverridesUserSidebarProps>) {
  return (
    <StyledSidebarContainer>
      {/* User Avatar & Info */}
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

      {/* Current Groups */}
      <StyledGroupsSection>
        <StyledGroupsSectionLabel variant="bodyMd">Current Groups</StyledGroupsSectionLabel>
        {userGroups.length === 0 ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.disabled, fontStyle: "italic" })}>
            No assigned groups
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {userGroups.map(g => (
              <StyledGroupChip key={g.id || g.slug}>
                <StyledGroupName variant="bodyMd">{g.name}</StyledGroupName>
              </StyledGroupChip>
            ))}
          </Box>
        )}
      </StyledGroupsSection>
    </StyledSidebarContainer>
  );
}
