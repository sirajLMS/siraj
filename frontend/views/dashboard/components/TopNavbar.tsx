"use client";

import { SchoolOutlined } from "@mui/icons-material";
import { AppBar, alpha, Box, Toolbar, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/frontend/views/dashboard/components/navbar/LanguageSwitcher";
import { ThemeSwitcher } from "@/frontend/views/dashboard/components/navbar/ThemeSwitcher";
import { MobileMenuButton } from "./client/MobileMenuButton";
import { NotificationButton } from "./navbar/NotificationButton";
import { UserMenuButton } from "./navbar/UserMenuButton";

interface TopNavbarProps {
  readonly userName: string;
  readonly userEmail: string;
  readonly userRole: string;
  readonly roleLabel: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
}

export function TopNavbar({ userName, userEmail, userRole, roleLabel, avatarUrl, notificationCount }: TopNavbarProps) {
  const t = useTranslations("dashboard");

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: "100%",
        bgcolor: theme => theme.palette.headerContainer,
        color: theme => theme.palette.onHeaderContainer,
        zIndex: theme => theme.zIndex.drawer + 1,
        boxShadow: theme => theme.palette.shadow.card,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          minHeight: theme => theme.layout.navbarHeight,
          px: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
          <MobileMenuButton />

          <Box
            sx={theme => ({
              width: 40,
              height: 40,
              bgcolor: alpha(theme.palette.onHeaderContainer, 0.15),
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <SchoolOutlined sx={{ fontSize: 24 }} />
          </Box>

          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Typography
              sx={{
                color: theme => theme.palette.onHeaderContainer,
                fontFamily: '"Hanken Grotesk", sans-serif',
                fontSize: "20px",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {t("layout.appTitle")}
            </Typography>
            <Typography
              sx={{
                color: theme => alpha(theme.palette.onHeaderContainer, 0.7),
                fontFamily: '"Inter", sans-serif',
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.05em",
              }}
            >
              {roleLabel}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>
          <ThemeSwitcher />
          <LanguageSwitcher />
          <NotificationButton notificationCount={notificationCount} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderLeft: { xs: "none", md: theme => `1px solid ${theme.palette.onHeaderContainer}` },
              pl: { xs: 0, md: 3 },
            }}
          >
            <Box sx={{ textAlign: "end", display: { xs: "none", sm: "block" } }}>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: "12px",
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                {userName}
              </Typography>
              <Typography
                sx={{
                  color: theme => alpha(theme.palette.onHeaderContainer, 0.7),
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  mt: 0.5,
                }}
              >
                {userRole}
              </Typography>
            </Box>
            <UserMenuButton userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
