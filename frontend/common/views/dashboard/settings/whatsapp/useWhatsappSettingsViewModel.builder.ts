import type { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappTokenTestResult, WhatsappTokenTestState } from "@/frontend/common/stores/whatsappTokenTestStore";
import type {
  WhatsappDialogState,
  WhatsappSettingsLabels,
  WhatsappSettingsViewModel,
  WhatsappSnackbar,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type {
  useWhatsappCreateHandler,
  useWhatsappUpdateLocalDeactivateHandlers,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.handlers";
import type { useDerivedWhatsappData } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.hooks";
import type {
  useWhatsappEmbeddedSignupHandler,
  useWhatsappUtilityHandlers,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.interactions";
import {
  validateAccessToken,
  validateDisplayName,
  validatePhoneNumberId,
  validatePurpose,
  validateTwoStepPin,
  validateWabaId,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";

interface WhatsappViewModelParts {
  labels: WhatsappSettingsLabels;
  esConfigId: string | null;
  esAppId: string | null;
  embeddedSignupAllowedOriginsUrl: string | null;
  accounts: ReturnType<typeof useDerivedWhatsappData>["accounts"];
  templates: ReturnType<typeof useDerivedWhatsappData>["templates"];
  loading: boolean;
  queryError: boolean;
  isOptedIn: boolean;
  isConfigured: boolean;
  syncDisabledReason: string | undefined;
  createHandler: ReturnType<typeof useWhatsappCreateHandler>;
  updateLocalDeactivateHandlers: ReturnType<typeof useWhatsappUpdateLocalDeactivateHandlers>;
  utilityHandlers: ReturnType<typeof useWhatsappUtilityHandlers>;
  embeddedSignupHandler: ReturnType<typeof useWhatsappEmbeddedSignupHandler>;
  dialogState: WhatsappDialogState;
  mutationError: string | null;
  snackbar: WhatsappSnackbar;
  closeSnackbar: () => void;
  openCreateDialog: () => void;
  openEditNameDialog: (accountId: string, displayName: string, purpose: WhatsappAccountPurpose) => void;
  openEditTokenDialog: (accountId: string) => void;
  openEditPinDialog: (accountId: string) => void;
  openLocalDeactivateConfirmDialog: (accountId: string, displayName: string) => void;
  openManageRecipientsDialog: (accountId: string) => void;
  openEmbeddedSignupDialog: () => void;
  embeddedSignupBlocked: boolean;
  closeDialog: () => void;
  refetchAccounts: () => void;
  refetchTemplates: () => void;
  editingTokenForId: string | null;
  editingPinForId: string | null;
  handleTestToken: (accountId: string, token: string) => Promise<WhatsappTokenTestState>;
  tokenTestStates: Readonly<Record<string, Readonly<Record<string, WhatsappTokenTestResult>>>>;
}

/** Flattens the composed handler/state parts into the single view-model object consumed by the tab views. */
export function buildWhatsappViewModel(p: WhatsappViewModelParts): WhatsappSettingsViewModel {
  return {
    labels: p.labels,
    esConfigId: p.esConfigId,
    esAppId: p.esAppId,
    embeddedSignupAllowedOriginsUrl: p.embeddedSignupAllowedOriginsUrl,
    embeddedSignupSubmitting: p.embeddedSignupHandler.embeddedSignupSubmitting,
    openEmbeddedSignupDialog: p.openEmbeddedSignupDialog,
    embeddedSignupBlocked: p.embeddedSignupBlocked,
    handleEmbeddedSignupComplete: p.embeddedSignupHandler.handleEmbeddedSignupComplete,
    accounts: p.accounts,
    templates: p.templates,
    loading: p.loading,
    queryError: p.queryError,
    isOptedIn: p.isOptedIn,
    isConfigured: p.isConfigured,
    syncDisabledReason: p.syncDisabledReason,
    creating: p.createHandler.creating,
    localDeactivatingId: p.updateLocalDeactivateHandlers.localDeactivatingId,
    updatingId: p.updateLocalDeactivateHandlers.updatingId,
    syncingId: p.utilityHandlers.syncing ? "all" : null,
    editingTokenForId: p.editingTokenForId,
    editingPinForId: p.editingPinForId,
    syncing: p.utilityHandlers.syncing,
    optInLoading: p.utilityHandlers.optInLoading,
    mutationError: p.mutationError,
    snackbar: p.snackbar,
    closeSnackbar: p.closeSnackbar,
    validateDisplayName,
    validatePhoneNumberId,
    validateWabaId,
    validateAccessToken,
    validateTwoStepPin,
    validatePurpose,
    dialogState: p.dialogState,
    openCreateDialog: p.openCreateDialog,
    openEditNameDialog: p.openEditNameDialog,
    openEditTokenDialog: p.openEditTokenDialog,
    openEditPinDialog: p.openEditPinDialog,
    openLocalDeactivateConfirmDialog: p.openLocalDeactivateConfirmDialog,
    openManageRecipientsDialog: p.openManageRecipientsDialog,
    closeDialog: p.closeDialog,
    handleCreate: p.createHandler.handleCreate,
    handleEditName: p.updateLocalDeactivateHandlers.handleEditName,
    handleUpdatePurpose: p.updateLocalDeactivateHandlers.handleUpdatePurpose,
    handleLocalDeactivate: p.updateLocalDeactivateHandlers.handleLocalDeactivate,
    handleSubmitToken: p.utilityHandlers.handleSubmitToken,
    handleSubmitPin: p.utilityHandlers.handleSubmitPin,
    handleTestToken: p.handleTestToken,
    tokenTestStates: p.tokenTestStates,
    handleSync: p.utilityHandlers.handleSync,
    handleToggleOptIn: p.utilityHandlers.handleToggleOptIn,
    refetchAccounts: p.refetchAccounts,
    refetchTemplates: p.refetchTemplates,
    onLocalDeactivateAccount: p.updateLocalDeactivateHandlers.handleLocalDeactivate,
    onSetAccessToken: p.utilityHandlers.handleSubmitToken,
    onSetTwoStepPin: p.utilityHandlers.handleSubmitPin,
    onSyncFromMeta: p.utilityHandlers.handleSync,
    onToggleOptIn: p.utilityHandlers.handleToggleOptIn,
    onDismissSnackbar: p.closeSnackbar,
  };
}
