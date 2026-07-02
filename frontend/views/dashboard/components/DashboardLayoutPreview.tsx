"use client";

import { SchoolOutlined } from "@mui/icons-material";
import { AppBar, alpha, Box, Toolbar, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/frontend/views/dashboard/components/navbar/LanguageSwitcher";
import { ThemeSwitcher } from "@/frontend/views/dashboard/components/navbar/ThemeSwitcher";
import { Link } from "@/shared/i18n/routing";
import { MobileMenuButton } from "./client/MobileMenuButton";
import type { TranslatedNavItem } from "./client/SidebarShell";
import { NotificationButton } from "./navbar/NotificationButton";
import { UserMenuButton } from "./navbar/UserMenuButton";

interface DashboardLayoutPreviewProps {
  readonly children?: ReactNode;
  readonly sidebar: ReactNode;
  readonly bottomNavItems: readonly TranslatedNavItem[];
  readonly activeNavKey: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly roleLabel: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
  readonly navbarHeight?: string;
}

function Navbar({
  roleLabel,
  userName,
  userEmail,
  avatarUrl,
  notificationCount,
}: {
  readonly roleLabel: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
}) {
  const t = useTranslations("dashboard");

  return (
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
              variant="titleLg"
              sx={{
                color: theme => theme.palette.onHeaderContainer,
              }}
            >
              {t("layout.appTitle")}
            </Typography>
            <Typography
              variant="labelMd"
              sx={{
                color: theme => alpha(theme.palette.onHeaderContainer, 0.7),
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
  );
}

function MainContent({
  children,
  sidebar,
  navbarHeight,
}: {
  readonly children?: ReactNode;
  readonly sidebar: ReactNode;
  readonly navbarHeight: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        pt: navbarHeight,
        boxSizing: "border-box",
      }}
    >
      {sidebar}
      <Box
        component="main"
        sx={theme => ({
          flexGrow: 1,
          minWidth: 0,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          backgroundColor: theme.palette.background.default,
          pb: {
            xs: `calc(${theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px) + ${theme.spacing(2)})`,
            md: 0,
          },
        })}
      >
        <Box sx={{ p: theme => theme.layout.pageMargin }}>{children}</Box>
      </Box>
    </Box>
  );
}

const BOTTOM_NAV_SCROLL_THRESHOLD = 5;
const BOTTOM_NAV_ITEM_MIN_WIDTH = 72;

function BottomNavItem({
  item,
  isActive,
  isScrollable,
}: {
  readonly item: TranslatedNavItem;
  readonly isActive: boolean;
  readonly isScrollable: boolean;
}) {
  const IconComponent = item.icon;

  return (
    <Box
      key={item.key}
      component={Link}
      href={item.href}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      sx={theme => ({
        flex: isScrollable ? `0 0 ${BOTTOM_NAV_ITEM_MIN_WIDTH}px` : 1,
        minWidth: isScrollable ? BOTTOM_NAV_ITEM_MIN_WIDTH : 0,
        maxWidth: isScrollable ? 80 : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.25,
        px: 0.5,
        py: 0.75,
        textDecoration: "none",
        color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
        overflow: "hidden",
      })}
    >
      <IconComponent sx={{ fontSize: 20, flexShrink: 0 }} />
      <Typography
        variant="labelSm"
        sx={{
          fontWeight: isActive ? 600 : 400,
          width: "100%",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          letterSpacing: 0,
          lineHeight: 1.2,
        }}
      >
        {item.label}
      </Typography>
    </Box>
  );
}

function BottomNav({
  bottomNavItems,
  activeNavKey,
}: {
  readonly bottomNavItems: readonly TranslatedNavItem[];
  readonly activeNavKey: string;
}) {
  const isScrollable = bottomNavItems.length > BOTTOM_NAV_SCROLL_THRESHOLD;

  return (
    <Box
      component="nav"
      sx={theme => ({
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        display: { xs: "flex", md: "none" },
        minHeight: theme.layout.bottomNavHeight,
        boxSizing: "content-box",
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.border.light}`,
        overflowX: isScrollable ? "auto" : "hidden",
        scrollbarWidth: "none",
        pb: "env(safe-area-inset-bottom)",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      })}
    >
      {bottomNavItems.map(item => (
        <BottomNavItem
          key={item.key}
          item={item}
          isActive={item.key === activeNavKey}
          isScrollable={isScrollable}
        />
      ))}
    </Box>
  );
}

export function DashboardLayoutPreview({
  children,
  sidebar,
  bottomNavItems,
  activeNavKey,
  userName,
  userEmail,
  roleLabel,
  avatarUrl,
  notificationCount,
  navbarHeight = "64px",
}: DashboardLayoutPreviewProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: "100vh", overflow: "hidden" }}>
      <Navbar
        roleLabel={roleLabel}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        notificationCount={notificationCount}
      />
      <MainContent sidebar={sidebar} navbarHeight={navbarHeight}>
        {children}
      </MainContent>
      <BottomNav bottomNavItems={bottomNavItems} activeNavKey={activeNavKey} />
    </Box>
  );
}
