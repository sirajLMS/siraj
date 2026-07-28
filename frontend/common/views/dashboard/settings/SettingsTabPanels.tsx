"use client";

import { Box, CircularProgress } from "@mui/material";
import { type ComponentType, lazy, Suspense } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { useSettingsStore } from "@/frontend/common/stores/settingsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { SettingsTabId } from "@/frontend/common/views/dashboard/settings/types/settings.types";

type SettingsTabPanelsProps = {
  readonly activeTab: SettingsTabId;
};

type TabPanelDefinition = {
  readonly id: SettingsTabId;
  readonly permissions: (typeof PAGE_PERMISSIONS)[keyof typeof PAGE_PERMISSIONS];
  readonly Component: ComponentType;
};

const LazyGeneralSettingsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/settings/tabs/general/GeneralSettingsTab").then(module => ({
    default: module.GeneralSettingsTab,
  }))
);

const LazyEnvironmentConfigTab = lazy(() =>
  import("@/frontend/common/views/dashboard/settings/tabs/environment/EnvironmentConfigTab").then(module => ({
    default: module.EnvironmentConfigTab,
  }))
);

const LazySessionConfigTab = lazy(() =>
  import("@/frontend/common/views/dashboard/settings/tabs/session/SessionConfigTab").then(module => ({
    default: module.SessionConfigTab,
  }))
);

const LazySettingsAuditTab = lazy(() =>
  import("@/frontend/common/views/dashboard/settings/tabs/audit/SettingsAuditTab").then(module => ({
    default: module.SettingsAuditTab,
  }))
);

const LazySiteContentSettingsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/settings/tabs/siteContent/SiteContentSettingsTab").then(module => ({
    default: module.SiteContentSettingsTab,
  }))
);

const LazySettingsTimezonesTab = lazy(() =>
  import("@/frontend/common/views/dashboard/settings/tabs/timezones/SettingsTimezonesTab").then(module => ({
    default: module.SettingsTimezonesTab,
  }))
);

const TAB_PANELS: readonly TabPanelDefinition[] = [
  { id: "general", permissions: PAGE_PERMISSIONS.settingsGeneral, Component: LazyGeneralSettingsTab },
  { id: "environment", permissions: PAGE_PERMISSIONS.settingsEnvironment, Component: LazyEnvironmentConfigTab },
  { id: "session", permissions: PAGE_PERMISSIONS.settingsSession, Component: LazySessionConfigTab },
  { id: "audit", permissions: PAGE_PERMISSIONS.settingsAudit, Component: LazySettingsAuditTab },
  { id: "siteContent", permissions: PAGE_PERMISSIONS.settingsSiteContent, Component: LazySiteContentSettingsTab },
  { id: "timezones", permissions: PAGE_PERMISSIONS.settingsTimezones, Component: LazySettingsTimezonesTab },
];

function TabPanelFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function getTabPanelSx(isActive: boolean) {
  if (isActive) {
    return {
      position: "relative" as const,
      width: "100%",
      visibility: "visible" as const,
      overflow: "visible" as const,
      pointerEvents: "auto" as const,
    };
  }

  // Keep visited panels mounted without display:none so DataGrid can retain width.
  return {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    visibility: "hidden" as const,
    height: 0,
    overflow: "hidden" as const,
    pointerEvents: "none" as const,
  };
}

export function SettingsTabPanels({ activeTab }: Readonly<SettingsTabPanelsProps>) {
  const visitedTabs = useSettingsStore(state => state.visitedTabs);

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {TAB_PANELS.map(({ id, permissions, Component }) => {
        if (!visitedTabs[id]) {
          return null;
        }

        const isActive = activeTab === id;

        return (
          <Box
            key={id}
            role="tabpanel"
            id={`settings-tabpanel-${id}`}
            aria-labelledby={`settings-tab-${id}`}
            aria-hidden={!isActive}
            sx={getTabPanelSx(isActive)}
          >
            <RequirePermission permissions={permissions} fallback={null}>
              <Suspense fallback={<TabPanelFallback />}>
                <Component />
              </Suspense>
            </RequirePermission>
          </Box>
        );
      })}
    </Box>
  );
}
