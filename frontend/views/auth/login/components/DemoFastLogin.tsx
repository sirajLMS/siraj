"use client";

import { AdminPanelSettings, Badge, FamilyRestroom, Group as GroupIcon, School } from "@mui/icons-material";
import { Box, Button, type ButtonProps, Divider, styled, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

// Extending ButtonProps in case you need to type check somewhere, or just use it inline
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
  fontSize: "0.8125rem",
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

export interface DemoFastLoginProps {
  groups: { slug: string; name: string; description: string | null }[];
  onFastLogin: (groupSlug: string) => void;
}

const getGroupIcon = (slug: string) => {
  if (slug.includes("admin")) return <AdminPanelSettings />;
  if (slug.includes("teacher")) return <School />;
  if (slug.includes("parent")) return <FamilyRestroom />;
  if (slug.includes("staff")) return <Badge />;
  return <GroupIcon />;
};

export function DemoFastLogin({ groups, onFastLogin }: Readonly<DemoFastLoginProps>) {
  const t = useTranslations("auth.login");

  if (!groups || groups.length === 0) return null;

  return (
    <Box sx={{ mt: 3, mb: 1 }}>
      <Divider sx={{ mb: 2 }}>
        <Typography
          variant="bodyMd"
          sx={theme => ({
            color: theme.palette.text.secondary,
            px: 1,
            fontWeight: 500,
            letterSpacing: "0.5px",
          })}
        >
          {t("orQuickLogin")}
        </Typography>
      </Divider>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 1.5,
        }}
      >
        {groups.map(group => (
          <FastLoginButton
            key={group.slug}
            variant="outlined"
            size="small"
            startIcon={getGroupIcon(group.slug)}
            onClick={() => onFastLogin(group.slug)}
          >
            {group.name}
          </FastLoginButton>
        ))}
      </Box>
    </Box>
  );
}
