"use client";

import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  WhatsappOptInAuditEntry,
  WhatsappOptInUserState,
  WhatsappSettingsViewModel,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { useWhatsappConfigViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappConfigViewModel";
import { useWhatsappInboxViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappInboxViewModel";
import {
  lazyConfigTab,
  lazyInboxTab,
  lazyNumbersTab,
  lazyOptInTab,
  lazyTemplatesTab,
} from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.lazy";

/**
 * The inbox tab owns its own ViewModel (`useWhatsappInboxViewModel`) so its
 * queries only fire when the tab is mounted — unrelated to the settings VM.
 */
export function InboxTabPanel() {
  const viewModel = useWhatsappInboxViewModel();
  return <ResponsiveViewSwitch mobile={lazyInboxTab.mobile} desktop={lazyInboxTab.desktop} props={viewModel} />;
}

/**
 * The Cloud API configuration tab owns its own ViewModel
 * (`useWhatsappConfigViewModel`) so its queries only fire when mounted; the
 * settings VM stays untouched by its per-field form state.
 */
export function ConfigTabPanel() {
  const viewModel = useWhatsappConfigViewModel();
  return <ResponsiveViewSwitch mobile={lazyConfigTab.mobile} desktop={lazyConfigTab.desktop} props={viewModel} />;
}

export function NumbersTabPanel({ viewModel }: Readonly<{ viewModel: WhatsappSettingsViewModel }>) {
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

export function TemplatesTabPanel({ viewModel }: Readonly<{ viewModel: WhatsappSettingsViewModel }>) {
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

export function OptInTabPanel({ viewModel }: Readonly<{ viewModel: WhatsappSettingsViewModel }>) {
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
