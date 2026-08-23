"use client";

import { Box, CircularProgress } from "@mui/material";
import { type ComponentType, lazy, Suspense } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
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

const LazyMeetingIntegrationsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/MeetingIntegrationsTab").then(module => ({
    default: module.MeetingIntegrationsTab,
  }))
);

const LazyAppearanceSettingsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/settings/tabs/appearance/AppearanceSettingsTab").then(module => ({
    default: module.AppearanceSettingsTab,
  }))
);

const TAB_PANELS: readonly TabPanelDefinition[] = [
  { id: "general", permissions: PAGE_PERMISSIONS.settingsGeneral, Component: LazyGeneralSettingsTab },
  { id: "environment", permissions: PAGE_PERMISSIONS.settingsEnvironment, Component: LazyEnvironmentConfigTab },
  { id: "session", permissions: PAGE_PERMISSIONS.settingsSession, Component: LazySessionConfigTab },
  { id: "audit", permissions: PAGE_PERMISSIONS.settingsAudit, Component: LazySettingsAuditTab },
  { id: "siteContent", permissions: PAGE_PERMISSIONS.settingsSiteContent, Component: LazySiteContentSettingsTab },
  { id: "timezones", permissions: PAGE_PERMISSIONS.settingsTimezones, Component: LazySettingsTimezonesTab },
  {
    id: "meetingIntegrations",
    permissions: PAGE_PERMISSIONS.settingsMeetingIntegrations,
    Component: LazyMeetingIntegrationsTab,
  },
  { id: "appearance", permissions: PAGE_PERMISSIONS.settingsAppearance, Component: LazyAppearanceSettingsTab },
];

function TabPanelFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

export function SettingsTabPanels({ activeTab }: Readonly<SettingsTabPanelsProps>) {
  const panel = TAB_PANELS.find(entry => entry.id === activeTab);
  if (!panel) {
    return null;
  }

  const { permissions, Component } = panel;

  return (
    <Box
      role="tabpanel"
      id={`settings-tabpanel-${activeTab}`}
      aria-labelledby={`settings-tab-${activeTab}`}
      sx={{ width: "100%" }}
    >
      <RequirePermission permissions={permissions} fallback={null}>
        <Suspense fallback={<TabPanelFallback />}>
          <Component />
        </Suspense>
      </RequirePermission>
    </Box>
  );
}
