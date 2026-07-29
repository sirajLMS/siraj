"use client";

import { Box } from "@mui/material";
import { type ReactNode, useEffect, useRef } from "react";
import { useFxLiveRefresh } from "@/frontend/common/hooks/useFxLiveRefresh";
import { FxStaleBanner } from "@/frontend/common/views/dashboard/components/FxStaleBanner";
import { getActiveNavKey } from "@/frontend/common/views/dashboard/lib/getDashboardLayoutData";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { SidebarDesktop } from "@/frontend/desktop/views/dashboard/components/sidebar.desktop";
import { usePathname } from "@/shared/i18n/navigation";

interface DashboardLayoutIslandProps {
  readonly sidebarGroups: readonly NavGroup[];
  readonly sidebarItems: readonly NavItem[];
  readonly sidebarWidth: string;
  readonly children: ReactNode;
  readonly initialSidebarOpen?: boolean;
  readonly userName: string;
  readonly avatarUrl: string;
  readonly hideSidebarNavigation?: boolean;
}

function DesktopMainScrollArea({ children }: { readonly children: ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  useFxLiveRefresh();

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, []);

  return (
    <Box
      component="main"
      ref={mainRef}
      sx={{
        flexGrow: 1,
        minWidth: 0,
        minHeight: 0,
        overflowY: "auto",
        overscrollBehavior: "contain",
        backgroundColor: "var(--mui-palette-background-default)",
        pb: 0,
      }}
    >
      <Box
        sx={theme => ({
          px: theme.layout.pageMargin,
          py: theme.layout.pageMargin,
        })}
      >
        <FxStaleBanner />
        {children}
      </Box>
    </Box>
  );
}

export function DashboardLayoutIsland({
  sidebarGroups,
  sidebarItems,
  sidebarWidth,
  children,
  initialSidebarOpen,
  userName,
  avatarUrl,
  hideSidebarNavigation = false,
}: Readonly<DashboardLayoutIslandProps>) {
  const pathname = usePathname();
  const activeNavKey = getActiveNavKey(pathname, sidebarItems);

  return (
    <>
      {hideSidebarNavigation ? null : (
        <SidebarDesktop
          navGroups={sidebarGroups}
          navItems={sidebarItems}
          activeKey={activeNavKey}
          sidebarWidth={sidebarWidth}
          initialSidebarOpen={initialSidebarOpen}
          userName={userName}
          avatarUrl={avatarUrl}
        />
      )}
      <DesktopMainScrollArea>{children}</DesktopMainScrollArea>
    </>
  );
}
