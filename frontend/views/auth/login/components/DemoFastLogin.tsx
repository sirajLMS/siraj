"use client";

import { AdminPanelSettings, Badge, FamilyRestroom, School } from "@mui/icons-material";
import { Box, Button, type ButtonProps, Divider, styled, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { parents, staff, superAdmins, teachers } from "@/shared/demo-users";

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
  onFastLogin: (email: string, password: string) => void;
}

export function DemoFastLogin({ onFastLogin }: Readonly<DemoFastLoginProps>) {
  const t = useTranslations("auth.login");

  const demoUsers = [
    { user: superAdmins[0], label: t("superAdmin"), icon: <AdminPanelSettings /> },
    { user: teachers[0], label: t("teacher"), icon: <School /> },
    { user: parents[0], label: t("parent"), icon: <FamilyRestroom /> },
    { user: staff[0], label: t("staff"), icon: <Badge /> },
  ].filter(item => !!item.user);

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
        {demoUsers.map(({ user, label, icon }) => (
          <FastLoginButton
            key={user.email}
            variant="outlined"
            size="small"
            startIcon={icon}
            onClick={() => onFastLogin(user.email, user.plainPassword)}
          >
            {label}
          </FastLoginButton>
        ))}
      </Box>
    </Box>
  );
}
