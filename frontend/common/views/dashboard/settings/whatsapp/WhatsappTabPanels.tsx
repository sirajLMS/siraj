"use client";

import { LockOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { type ComponentType, Suspense } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { tabFadeInSx } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/whatsappAnimations";
import type {
  NumbersTabSharedProps,
  OptInTabSharedProps,
  TemplatesTabSharedProps,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type {
  WhatsappOptInAuditEntry,
  WhatsappOptInUserState,
  WhatsappSettingsViewModel,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  TAB_PERMISSIONS,
  type WhatsappConfigTab,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappConfig.constants";

// ── Lazy tab content (tier-split via createLazyView + ResponsiveViewSwitch) ──

const lazyNumbersTab = createLazyView<NumbersTabSharedProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile").then(m => ({
      default: m.NumbersTabMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop").then(m => ({
      default: m.NumbersTabDesktop,
    }))
);

const lazyTemplatesTab = createLazyView<TemplatesTabSharedProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/TemplatesTab.mobile").then(m => ({
      default: m.TemplatesTabMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/TemplatesTab.desktop").then(m => ({
      default: m.TemplatesTabDesktop,
    }))
);

const lazyOptInTab = createLazyView<OptInTabSharedProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile").then(m => ({
      default: m.OptInTabMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/OptInTab.desktop").then(m => ({
      default: m.OptInTabDesktop,
    }))
);

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

// ── Tab content builder ──

type TabId = WhatsappConfigTab;

function NumbersTabPanel({ viewModel }: Readonly<{ viewModel: WhatsappSettingsViewModel }>) {
  return (
    <ResponsiveViewSwitch
      mobile={lazyNumbersTab.mobile}
      desktop={lazyNumbersTab.desktop}
      props={{
        labels: viewModel.labels,
        accounts: viewModel.accounts,
        loading: viewModel.loading,
        syncing: viewModel.syncing,
        snackbar: viewModel.snackbar,
        deletingId: viewModel.deletingId,
        syncingId: viewModel.syncingId,
        onOpenDeleteConfirmDialog: viewModel.openDeleteConfirmDialog,
        onDeleteAccount: viewModel.handleDelete,
        onSetAccessToken: viewModel.handleSubmitToken,
        onSetTwoStepPin: viewModel.handleSubmitPin,
        onSyncFromMeta: viewModel.handleSync,
        onDismissSnackbar: viewModel.closeSnackbar,
        isConfigured: viewModel.isConfigured,
        editingTokenForId: viewModel.editingTokenForId,
        editingPinForId: viewModel.editingPinForId,
        creating: viewModel.creating,
        updatingId: viewModel.updatingId,
        dialogState: viewModel.dialogState,
        mutationError: viewModel.mutationError,
        onCreate: viewModel.handleCreate,
        onEditName: viewModel.handleEditName,
        onOpenCreateDialog: viewModel.openCreateDialog,
        onOpenEditNameDialog: viewModel.openEditNameDialog,
        onCloseDialog: viewModel.closeDialog,
        validateDisplayName: viewModel.validateDisplayName,
        validatePhoneNumberId: viewModel.validatePhoneNumberId,
        validateWabaId: viewModel.validateWabaId,
        validateAccessToken: viewModel.validateAccessToken,
        validateTwoStepPin: viewModel.validateTwoStepPin,
      }}
    />
  );
}

function TemplatesTabPanel({ viewModel }: Readonly<{ viewModel: WhatsappSettingsViewModel }>) {
  return (
    <ResponsiveViewSwitch
      mobile={lazyTemplatesTab.mobile}
      desktop={lazyTemplatesTab.desktop}
      props={{
        labels: viewModel.labels,
        templates: viewModel.templates,
        loading: viewModel.loading,
        syncing: viewModel.syncing,
        onSyncFromMeta: viewModel.handleSync,
        isConfigured: viewModel.isConfigured,
        queryError: viewModel.queryError,
        onRetry: viewModel.refetchTemplates,
      }}
    />
  );
}

function OptInTabPanel({ viewModel }: Readonly<{ viewModel: WhatsappSettingsViewModel }>) {
  // ── Task 12: opt-in history audit data ──
  // NOTE: Backend `whatsappOptInAuditQuery` resolver does not exist yet (Task 3).
  //       Until it ships, we pass an empty array here (the UI will show the
  //       empty-state message). When the resolver is implemented, replace
  //       this with the real query result from the ViewModel.
  const auditEntries: readonly WhatsappOptInAuditEntry[] = [];
  const dateRange = { from: null as string | null, to: null as string | null };

  // ── Task 13: admin consolidated opt-in view ──
  // NOTE: Backend resolver for all-users opt-in state query does not exist
  //       yet. Until it ships, we pass an empty array here (the admin section
  //       will show the empty-state message). When the resolver is
  //       implemented, replace this with the real query result from the
  //       ViewModel.
  const adminUsers: readonly WhatsappOptInUserState[] = [];

  return (
    <ResponsiveViewSwitch
      mobile={lazyOptInTab.mobile}
      desktop={lazyOptInTab.desktop}
      props={{
        labels: viewModel.labels,
        isOptedIn: viewModel.isOptedIn,
        optInLoading: viewModel.optInLoading,
        onToggleOptIn: viewModel.handleToggleOptIn,
        auditEntries,
        dateRange,
        onDateRangeChange: () => {},
        onExportCsv: () => {},
        adminUsers,
      }}
    />
  );
}

const TAB_PANELS: Readonly<Record<TabId, ComponentType<{ viewModel: WhatsappSettingsViewModel }>>> = {
  numbers: NumbersTabPanel,
  templates: TemplatesTabPanel,
  optin: OptInTabPanel,
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
