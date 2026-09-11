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
import type { WhatsappConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";
import type { WhatsappInboxViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import type {
  WhatsappOptInAuditEntry,
  WhatsappOptInUserState,
  WhatsappSettingsViewModel,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { useWhatsappConfigViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappConfigViewModel";
import { useWhatsappInboxViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappInboxViewModel";
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

const lazyInboxTab = createLazyView<WhatsappInboxViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/InboxTab.mobile").then(m => ({
      default: m.InboxTabMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/InboxTab.desktop").then(m => ({
      default: m.InboxTabDesktop,
    }))
);

const lazyConfigTab = createLazyView<WhatsappConfigTabViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/ConfigTab.mobile").then(m => ({
      default: m.ConfigTabMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/ConfigTab.desktop").then(m => ({
      default: m.ConfigTabDesktop,
    }))
);

/**
 * The inbox tab owns its own ViewModel (`useWhatsappInboxViewModel`) so its
 * queries only fire when the tab is mounted — unrelated to the settings VM.
 */
function InboxTabPanel() {
  const viewModel = useWhatsappInboxViewModel();
  return <ResponsiveViewSwitch mobile={lazyInboxTab.mobile} desktop={lazyInboxTab.desktop} props={viewModel} />;
}

/**
 * The Cloud API configuration tab owns its own ViewModel
 * (`useWhatsappConfigViewModel`) so its queries only fire when mounted; the
 * settings VM stays untouched by its per-field form state.
 */
function ConfigTabPanel() {
  const viewModel = useWhatsappConfigViewModel();
  return <ResponsiveViewSwitch mobile={lazyConfigTab.mobile} desktop={lazyConfigTab.desktop} props={viewModel} />;
}

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
        localDeactivatingId: viewModel.localDeactivatingId,
        syncingId: viewModel.syncingId,
        onLocalDeactivateConfirmDialog: viewModel.openLocalDeactivateConfirmDialog,
        onOpenManageRecipients: viewModel.openManageRecipientsDialog,
        onLocalDeactivateAccount: viewModel.handleLocalDeactivate,
        onSetAccessToken: viewModel.handleSubmitToken,
        onTestAccessToken: viewModel.handleTestToken,
        tokenTestStates: viewModel.tokenTestStates,
        onSetTwoStepPin: viewModel.handleSubmitPin,
        onSyncFromMeta: viewModel.handleSync,
        onDismissSnackbar: viewModel.closeSnackbar,
        isConfigured: viewModel.isConfigured,
        syncDisabledReason: viewModel.syncDisabledReason,
        editingTokenForId: viewModel.editingTokenForId,
        editingPinForId: viewModel.editingPinForId,
        creating: viewModel.creating,
        updatingId: viewModel.updatingId,
        dialogState: viewModel.dialogState,
        mutationError: viewModel.mutationError,
        onCreate: viewModel.handleCreate,
        onEditName: viewModel.handleEditName,
        onUpdatePurpose: viewModel.handleUpdatePurpose,
        onOpenCreateDialog: viewModel.openCreateDialog,
        onOpenEditNameDialog: viewModel.openEditNameDialog,
        onCloseDialog: viewModel.closeDialog,
        validateDisplayName: viewModel.validateDisplayName,
        validatePhoneNumberId: viewModel.validatePhoneNumberId,
        validateWabaId: viewModel.validateWabaId,
        validatePurpose: viewModel.validatePurpose,
        validateAccessToken: viewModel.validateAccessToken,
        validateTwoStepPin: viewModel.validateTwoStepPin,
        esConfigId: viewModel.esConfigId ?? null,
        esAppId: viewModel.esAppId ?? null,
        embeddedSignupAllowedOriginsUrl: viewModel.embeddedSignupAllowedOriginsUrl,
        embeddedSignupBlocked: viewModel.embeddedSignupBlocked,
        onOpenEmbeddedSignup: viewModel.openEmbeddedSignupDialog,
        onEmbeddedSignupComplete: viewModel.handleEmbeddedSignupComplete,
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
  // The opt-in audit history query is not implemented in the backend schema
  // yet, so this surface renders its empty state until the resolver ships and
  // the ViewModel passes real data through.
  const auditEntries: readonly WhatsappOptInAuditEntry[] = [];
  const dateRange = { from: null as string | null, to: null as string | null };
  // The consolidated all-users opt-in state query is likewise pending on the
  // backend; the admin section shows its empty state until it exists.
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
