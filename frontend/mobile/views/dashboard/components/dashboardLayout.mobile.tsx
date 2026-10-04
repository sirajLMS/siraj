"use client";

import { Box } from "@mui/material";
import { SidebarShell } from "@/frontend/common/views/dashboard/components/client/SidebarShell";
import type { DashboardLayoutProps } from "@/frontend/common/views/dashboard/components/dashboardLayoutTypes";
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
import { BottomNavbarMobile } from "@/frontend/mobile/views/dashboard/components/bottomNavbar.mobile";
import {
  buildTranslatedNavGroups,
  buildTranslatedNavItems,
} from "@/frontend/mobile/views/dashboard/components/dashboardLayout.mobile.helpers";
import { MobileMainScrollArea } from "@/frontend/mobile/views/dashboard/components/dashboardLayout.mobile.parts";
import { MobileMenuButton } from "@/frontend/mobile/views/dashboard/components/mobileMenuButton.mobile";
import { usePathname } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

export function DashboardLayoutMobile({
  children,
  sidebarGroups,
  sidebarItems,
  bottomNavItems,
  userName,
  userEmail,
  roleLabel,
  appTitle,
  appLogoUrl,
  logoAriaLabel: _logoAriaLabel,
  avatarUrl,
  notificationCount,
  sidebarWidth = "260px",
  hideSidebarNavigation = false,
}: Readonly<DashboardLayoutProps>) {
  const pathname = usePathname();
  const t = useNavLabels();
  const navLabels = useAppTranslation(Translation.Dashboard.CoreNav);
  const activeNavKey = getActiveNavKey(pathname, sidebarItems);
  const translatedNavGroups = buildTranslatedNavGroups(sidebarGroups, t);
  const translatedNavItems = buildTranslatedNavItems(sidebarItems, t);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        // `CustomizeModeShell` (the customization layout above this one)
        // bounds the shell height via `--dashboard-shell-height`; the 100vh
        // fallback keeps the dashboard full-height outside customize mode.
        minHeight: "var(--dashboard-shell-height, 100vh)",
        height: "var(--dashboard-shell-height, 100vh)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <NavbarChrome
        roleLabel={roleLabel}
        appTitle={appTitle}
        appLogoUrl={appLogoUrl}
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
          expandSidebarLabel={navLabels.expandSidebar}
          collapseSidebarLabel={navLabels.collapseSidebar}
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
  );
}
