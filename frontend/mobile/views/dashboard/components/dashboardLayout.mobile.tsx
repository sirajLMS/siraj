"use client";

import { Box } from "@mui/material";
import { type ReactNode, useEffect, useRef } from "react";
import { useFxLiveRefresh } from "@/frontend/common/hooks/useFxLiveRefresh";
import { SidebarShell, type TranslatedNavItem } from "@/frontend/common/views/dashboard/components/client/SidebarShell";
import type { DashboardLayoutProps } from "@/frontend/common/views/dashboard/components/dashboardLayoutTypes";
import { FxStaleBanner } from "@/frontend/common/views/dashboard/components/FxStaleBanner";
import {
  LanguageSwitcher,
  NavbarChrome,
  NotificationButton,
  ThemeSwitcher,
  UserMenuButton,
} from "@/frontend/common/views/dashboard/components/navbar";
import { useNavLabels } from "@/frontend/common/views/dashboard/components/useNavLabels";
import { getActiveNavKey } from "@/frontend/common/views/dashboard/lib/getDashboardLayoutData";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { BottomNavbarMobile } from "@/frontend/mobile/views/dashboard/components/bottomNavbar.mobile";
import { MobileMenuButton } from "@/frontend/mobile/views/dashboard/components/mobileMenuButton.mobile";
import { usePathname } from "@/shared/i18n/navigation";
import type { DashboardNavigationLabels } from "@/shared/locale/types/dashboard/core/nav";

function MobileMainScrollArea({ children }: { readonly children: ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  useFxLiveRefresh();

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, []);

  return (
    <Box
      component="main"
      ref={mainRef}
      sx={theme => ({
        flexGrow: 1,
        minWidth: 0,
        minHeight: 0,
        overflowY: "auto",
        overscrollBehavior: "contain",
        backgroundColor: theme.palette.background.default,
        pb: `calc(${theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px) + ${theme.spacing(2)})`,
      })}
    >
      <Box
        sx={theme => ({
          px: 0,
          py: theme.spacing(2),
        })}
      >
        <FxStaleBanner />
        {children}
      </Box>
    </Box>
  );
}

function buildTranslatedNavItems(
  navItems: readonly NavItem[],
  t: (key: keyof DashboardNavigationLabels) => string
): TranslatedNavItem[] {
  return navItems.map(item => ({ ...item, label: t(item.labelKey) }));
}

export function DashboardLayoutMobile({
  children,
  sidebarItems,
  bottomNavItems,
  userName,
  userEmail,
  roleLabel,
  appTitle: _appTitle,
  logoAriaLabel: _logoAriaLabel,
  avatarUrl,
  notificationCount,
  sidebarWidth = "260px",
}: Readonly<DashboardLayoutProps>) {
  const pathname = usePathname();
  const t = useNavLabels();
  const activeNavKey = getActiveNavKey(pathname, sidebarItems);
  const translatedNavItems = buildTranslatedNavItems(sidebarItems, t);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: "100vh", overflow: "hidden" }}>
      <NavbarChrome
        roleLabel={roleLabel}
        leftSlot={<MobileMenuButton />}
        rightSlot={
          <>
            <ThemeSwitcher />
            <LanguageSwitcher />
            <NotificationButton notificationCount={notificationCount} />
            <UserMenuButton userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
          </>
        }
      />

      <SidebarShell navItems={translatedNavItems} activeKey={activeNavKey} sidebarWidth={sidebarWidth} />

      {/* NavbarChrome is position:fixed — offset content like desktop (pt: navbarHeight) */}
      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          pt: theme.layout.navbarHeight,
          boxSizing: "border-box",
        })}
      >
        <MobileMainScrollArea>{children}</MobileMainScrollArea>
      </Box>

      <BottomNavbarMobile items={bottomNavItems} activeKey={activeNavKey} />
    </Box>
  );
}
