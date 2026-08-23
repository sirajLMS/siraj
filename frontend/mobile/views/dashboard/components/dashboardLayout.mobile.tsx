"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { type ReactNode, useEffect, useRef } from "react";
import { useCustomizeMode } from "@/frontend/common/hooks/useCustomizeMode";
import { useFxLiveRefresh } from "@/frontend/common/hooks/useFxLiveRefresh";
import {
  SidebarShell,
  type TranslatedNavGroup,
  type TranslatedNavItem,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell";
import { CustomizeOverlay } from "@/frontend/common/views/dashboard/components/customize/CustomizeOverlay";
import type { DashboardLayoutProps } from "@/frontend/common/views/dashboard/components/dashboardLayoutTypes";
import { FxStaleBanner } from "@/frontend/common/views/dashboard/components/FxStaleBanner";
import {
  CustomizeButton,
  LanguageSwitcher,
  NavbarChrome,
  NotificationButton,
  ThemeSwitcher,
  UserMenuButton,
} from "@/frontend/common/views/dashboard/components/navbar";
import { useNavLabels } from "@/frontend/common/views/dashboard/components/useNavLabels";
import { getActiveNavKey } from "@/frontend/common/views/dashboard/lib/getDashboardLayoutData";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { BottomNavbarMobile } from "@/frontend/mobile/views/dashboard/components/bottomNavbar.mobile";
import { MobileMenuButton } from "@/frontend/mobile/views/dashboard/components/mobileMenuButton.mobile";
import { usePathname } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { DashboardNavigationLabels } from "@/shared/locale/types/dashboard/core/nav";

const StyledMain = styled("main")(({ theme }) => ({
  flexGrow: 1,
  minWidth: 0,
  minHeight: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
  backgroundColor: theme.palette.background.default,
}));

function MobileMainScrollArea({
  children,
  hideBottomNav,
}: {
  readonly children: ReactNode;
  readonly hideBottomNav: boolean;
}) {
  const mainRef = useRef<HTMLElement>(null);
  useFxLiveRefresh();

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, []);

  return (
    <StyledMain
      ref={mainRef}
      sx={theme => ({
        pb: hideBottomNav
          ? theme.spacing(2)
          : `calc(${theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px) + ${theme.spacing(2)})`,
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
    </StyledMain>
  );
}

function buildTranslatedNavGroups(
  navGroups: readonly NavGroup[],
  t: (key: keyof DashboardNavigationLabels) => string
): TranslatedNavGroup[] {
  return navGroups.map(group => ({ ...group, label: t(group.labelKey) }));
}

function buildTranslatedNavItems(
  navItems: readonly NavItem[],
  t: (key: keyof DashboardNavigationLabels) => string
): TranslatedNavItem[] {
  return navItems.map(item => ({ ...item, label: t(item.labelKey) }));
}

export function DashboardLayoutMobile({
  children,
  sidebarGroups,
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
  hideSidebarNavigation = false,
}: Readonly<DashboardLayoutProps>) {
  const pathname = usePathname();
  const t = useNavLabels();
  const navLabels = useAppTranslation(Translation.Dashboard.CoreNav);
  const customizeMode = useCustomizeMode();
  const activeNavKey = getActiveNavKey(pathname, sidebarItems);
  const translatedNavGroups = buildTranslatedNavGroups(sidebarGroups, t);
  const translatedNavItems = buildTranslatedNavItems(sidebarItems, t);

  return (
    <CustomizeOverlay>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          height: "100vh",
          overflow: "hidden",
          boxSizing: "border-box",
          ...(customizeMode && {
            paddingTop: "48px",
            // Push the fixed AppBar (NavbarChrome) down below the
            // 48px CustomizeToolbar so it doesn't overlap. The AppBar's
            // default `top: 0` (from `.MuiAppBar-positionFixed`) is
            // overridden here via descendant-selector specificity.
            "& .MuiAppBar-root": {
              top: "48px",
            },
          }),
        }}
      >
        {customizeMode ? <CustomizeOverlay.Toolbar /> : null}
        <NavbarChrome
          roleLabel={roleLabel}
          leftSlot={hideSidebarNavigation ? null : <MobileMenuButton />}
          rightSlot={
            <>
              <CustomizeButton />
              <ThemeSwitcher />
              <LanguageSwitcher />
              <NotificationButton notificationCount={notificationCount} />
              <UserMenuButton userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
            </>
          }
        />

        {hideSidebarNavigation ? null : (
          <SidebarShell
            navGroups={translatedNavGroups}
            navItems={translatedNavItems}
            activeKey={activeNavKey}
            sidebarWidth={sidebarWidth}
            userName={userName}
            avatarUrl={avatarUrl}
            logoutLabel={navLabels.nav.logout}
            toggleGroupAriaLabel={navLabels.toggleGroupAriaLabel}
          />
        )}

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
          <MobileMainScrollArea hideBottomNav={hideSidebarNavigation}>{children}</MobileMainScrollArea>
        </Box>

        {hideSidebarNavigation ? null : <BottomNavbarMobile items={bottomNavItems} activeKey={activeNavKey} />}
      </Box>
    </CustomizeOverlay>
  );
}
