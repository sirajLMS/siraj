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
  paddingLeft: theme.spacing(1.25),
  paddingRight: theme.spacing(1.25),
  minHeight: 42,
  textTransform: "none",
  borderRadius: Number(theme.shape.borderRadius) * 3,
  borderColor: alpha(theme.palette.divider, 0.5),
  color: theme.palette.text.secondary,
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: theme.spacing(0.75),
  fontSize: "0.8rem",
  fontWeight: 600,
  transition: theme.transitions.create(["border-color", "background-color", "color", "transform", "box-shadow"], {
    duration: theme.transitions.duration.short,
  }),
  "&:hover": {
    borderColor: alpha(theme.palette.primary.main, 0.5),
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.text.primary,
    transform: "translateY(-1px)",
    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.15)}`,
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow: "none",
  },
}));

const StyledDividerLabel = styled(Typography)(({ theme }) => ({
  color: alpha(theme.palette.text.primary, 0.6),
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  fontSize: "0.75rem",
}));

// Responsive grid: max 2 columns per row.
const StyledButtonGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: theme.spacing(1.5),
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
    <StyledContainer sx={{ mt: 2.5, mb: 1.5 }}>
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
