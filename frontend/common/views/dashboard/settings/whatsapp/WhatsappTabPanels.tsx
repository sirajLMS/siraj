"use client";

import { LockOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { type ComponentType, Suspense } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { tabFadeInSx } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/whatsappAnimations";
import type { WhatsappSettingsViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  ConfigTabPanel,
  InboxTabPanel,
  NumbersTabPanel,
  OptInTabPanel,
  TemplatesTabPanel,
} from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.parts";
import {
  TAB_PERMISSIONS,
  type WhatsappConfigTab,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappConfig.constants";

// ── Suspense fallback ──

function TabPanelFallback() {
  return (
    <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 6 }} aria-busy>
      <CircularProgress size={28} />
    </Box>
  );
}

// ── Permission-denied fallback ──

function PermissionDeniedFallback({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <Stack spacing={1} sx={{ textAlign: "center", py: 6, px: 2, alignItems: "center" }} role="alert">
      <LockOutlined sx={{ fontSize: 40, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg">{title}</Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {description}
      </Typography>
    </Stack>
  );
}

// ── Props ──

export interface WhatsappTabPanelsProps {
  /** Active tab resolved from the URL by the parent. */
  readonly activeTab: WhatsappConfigTab;
  /** View model — provides all data, handlers, and labels to the tab content. */
  readonly viewModel: WhatsappSettingsViewModel;
}

// ── Tab content registry ──

const TAB_PANELS: Readonly<Record<WhatsappConfigTab, ComponentType<{ viewModel: WhatsappSettingsViewModel }>>> = {
  numbers: NumbersTabPanel,
  templates: TemplatesTabPanel,
  optin: OptInTabPanel,
  // The inbox tab carries its own ViewModel; the settings VM prop is unused.
  inbox: InboxTabPanel,
  // The config tab likewise owns its ViewModel; the settings VM prop is unused.
  config: ConfigTabPanel,
};

/**
 * Renders the active tab's content with Suspense + RequirePermission gating.
 *
 * Each tab's content is lazy-loaded via `next/dynamic` (through
 * `createLazyView`) and wrapped in `RequirePermission` using the per-tab
 * permission map from `TAB_PERMISSIONS`. The fallback is a centered
 * `CircularProgress` skeleton that renders while the chunk downloads.
 */
export function WhatsappTabPanels({ activeTab, viewModel }: Readonly<WhatsappTabPanelsProps>) {
  const Panel = TAB_PANELS[activeTab];
  if (!Panel) {
    return null;
  }

  const permissions = TAB_PERMISSIONS[activeTab];

  return (
    <Box
      key={activeTab}
      role="tabpanel"
      id={`whatsapp-tabpanel-${activeTab}`}
      aria-labelledby={`whatsapp-tab-${activeTab}`}
      sx={{ mt: 3, width: "100%", ...tabFadeInSx }}
    >
      <RequirePermission
        permissions={permissions}
        fallback={
          <PermissionDeniedFallback
            title={viewModel.labels.page.permissionDeniedTitle}
            description={viewModel.labels.page.permissionDeniedDescription}
          />
        }
      >
        <Suspense fallback={<TabPanelFallback />}>
          <Panel viewModel={viewModel} />
        </Suspense>
      </RequirePermission>
    </Box>
  );
}
