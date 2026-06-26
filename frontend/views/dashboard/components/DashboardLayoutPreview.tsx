"use client";

import { SchoolOutlined } from "@mui/icons-material";
import { AppBar, alpha, Box, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/frontend/views/dashboard/components/navbar/LanguageSwitcher";
import { ThemeSwitcher } from "@/frontend/views/dashboard/components/navbar/ThemeSwitcher";
import { MobileMenuButton } from "./client/MobileMenuButton";
import type { TranslatedNavItem } from "./client/SidebarShell";
import { NotificationButton } from "./navbar/NotificationButton";
import { UserMenuButton } from "./navbar/UserMenuButton";

interface DashboardLayoutPreviewProps {
  readonly children?: ReactNode;
  readonly sidebar: ReactNode;
  readonly bottomNavItems: readonly TranslatedNavItem[];
  readonly activeNavKey: string;
  readonly locale: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly roleLabel: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
  readonly navbarHeight?: string;
}

export function DashboardLayoutPreview({
  children,
  sidebar,
  bottomNavItems,
  activeNavKey,
  locale,
  userName,
  userEmail,
  roleLabel,
  avatarUrl,
  notificationCount,
  navbarHeight = "64px",
}: DashboardLayoutPreviewProps) {
  const t = useTranslations("dashboard");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: "100%",
          backgroundColor: theme => theme.palette.headerContainer,
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
                backgroundColor: alpha(theme.palette.onHeaderContainer, 0.15),
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
            <UserMenuButton userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flexGrow: 1, mt: navbarHeight, height: "100%", minWidth: 0 }}>
        {sidebar}

        <Box
          component="main"
          sx={theme => ({
            flexGrow: 1,
            minWidth: 0,
            pb: 10,
            minHeight: `calc(100vh - ${navbarHeight})`,
            backgroundColor: theme.palette.background.default,
            height: "100%",
            overflowY: "auto",
          })}
        >
          <Box sx={{ p: theme => theme.layout.pageMargin }}>{children}</Box>
        </Box>
      </Box>

      <Box
        component="nav"
        sx={theme => ({
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          display: { xs: "flex", md: "none" },
          height: 64,
          backgroundColor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.border.light}`,
        })}
      >
        {bottomNavItems.map(item => {
          const IconComponent = item.icon;
          const isActive = item.key === activeNavKey;

          return (
            <Box
              key={item.key}
              component={Link}
              href={`/${locale}${item.href}`}
              sx={theme => ({
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                py: 1,
                textDecoration: "none",
                color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              })}
            >
              <IconComponent fontSize="small" />
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
