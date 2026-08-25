"use client";

import { AdminPanelSettings, Badge, FamilyRestroom, Group as GroupIcon, School } from "@mui/icons-material";
import { Box, Button, type ButtonProps, Divider, styled, Tooltip, Typography, useTheme } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

const StyledContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
});

// Role-colored icon chip — each role gets a tinted background derived from the
// palette (primary for admin, secondary for teacher, etc.) so the quick-login
// buttons are visually distinguishable at a glance. Uses alpha() so the tint
// adapts to light/dark themes.
const RoleIconWrapper = styled(Box, {
  shouldForwardProp: prop => prop !== "tintColor",
})<{ tintColor: string }>(({ tintColor }) => ({
  width: 28,
  height: 28,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: alpha(tintColor, 0.12),
  color: tintColor,
  flexShrink: 0,
  "& svg": {
    fontSize: 16,
  },
}));

const FastLoginButton = styled(Button)<ButtonProps>(({ theme }) => ({
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  textTransform: "none",
  borderRadius: theme.shape.borderRadius,
  borderColor: theme.palette.divider,
  color: theme.palette.text.primary,
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: theme.spacing(0.5),
  fontSize: theme.typography.bodyMd.fontSize,
  fontWeight: 500,
  transition: theme.transitions.create(["all"], {
    duration: theme.transitions.duration.shorter,
  }),
  "&:hover": {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
    transform: "translateY(-2px)",
    boxShadow: theme.palette.shadow.card,
  },
}));

const StyledDividerLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 500,
  letterSpacing: "0.5px",
}));

// Responsive grid: 2 columns on narrow, expands to 3 on wider cards.
const StyledButtonGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: theme.spacing(1.5),
  [theme.breakpoints.up("sm")]: {
    gridTemplateColumns: "repeat(3, 1fr)",
  },
}));

export interface DemoFastLoginProps {
  readonly labels: AuthLoginLabels;
  readonly groups: { slug: string; name: string; description: string | null }[];
  readonly onFastLogin: (groupSlug: string) => void;
}

// Map each role to a palette color key for the icon tint.
const getGroupTint = (slug: string, theme: Theme): string => {
  if (slug.includes("admin")) return theme.palette.primary.main;
  if (slug.includes("teacher")) return theme.palette.secondary.main;
  if (slug.includes("parent")) return theme.palette.success.main;
  if (slug.includes("staff")) return theme.palette.warning.main;
  if (slug.includes("supervisor")) return theme.palette.info.main;
  return theme.palette.text.secondary;
};

const getGroupIcon = (slug: string) => {
  if (slug.includes("admin")) return <AdminPanelSettings />;
  if (slug.includes("teacher")) return <School />;
  if (slug.includes("parent")) return <FamilyRestroom />;
  if (slug.includes("staff")) return <Badge />;
  return <GroupIcon />;
};

export function DemoFastLogin({ labels, groups, onFastLogin }: Readonly<DemoFastLoginProps>) {
  const theme = useTheme();
  if (!groups || groups.length === 0) return null;

  return (
    <StyledContainer sx={{ mt: 3, mb: 1 }}>
      <Divider sx={{ mb: 2 }}>
        <StyledDividerLabel variant="bodyMd" sx={{ px: 1 }}>
          {labels.orQuickLogin}
        </StyledDividerLabel>
      </Divider>

      <StyledButtonGrid>
        {groups.map(group => (
          <Tooltip
            key={group.slug}
            title={group.description ?? group.name}
            arrow
            placement="top"
            slotProps={{
              popper: {
                modifiers: [{ name: "offset", options: { offset: [0, -4] } }],
              },
            }}
          >
            <FastLoginButton variant="outlined" size="small" onClick={() => onFastLogin(group.slug)}>
              <RoleIconWrapper tintColor={getGroupTint(group.slug, theme)}>{getGroupIcon(group.slug)}</RoleIconWrapper>
              {group.name}
            </FastLoginButton>
          </Tooltip>
        ))}
      </StyledButtonGrid>
    </StyledContainer>
  );
}
