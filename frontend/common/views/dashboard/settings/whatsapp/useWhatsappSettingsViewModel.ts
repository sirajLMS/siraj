"use client";

import { useWhatsappTokenTestStore } from "@/frontend/common/stores/whatsappTokenTestStore";
import type { WhatsappSettingsViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { buildWhatsappViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.builder";
import { resolveSyncDisabledReason } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.helpers";
import {
  useDerivedWhatsappData,
  useWhatsappLabels,
  useWhatsappMutations,
  useWhatsappQueries,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.hooks";
import { useWhatsappTokenTestHandler } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.interactions";
import { useWhatsappPageInteractions } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.pageInteractions";
import { Translation, useAppTranslation } from "@/shared/locale";

export function useWhatsappSettingsViewModel(props?: {
  esConfigId?: string | null;
  esAppId?: string | null;
}): WhatsappSettingsViewModel {
  const esConfigId = props?.esConfigId ?? null;
  const esAppId = props?.esAppId ?? null;
  const whatsappLabels = useAppTranslation(Translation.Whatsapp);
  const conversationsLabels = useAppTranslation(Translation.WhatsappConversations);
  const queries = useWhatsappQueries();
  const mutations = useWhatsappMutations();
  const { handleTestToken } = useWhatsappTokenTestHandler(mutations);
  const tokenTestStates = useWhatsappTokenTestStore(store => store.tokenTests);

  const labels = useWhatsappLabels(whatsappLabels, conversationsLabels);
  const {
    accounts,
    templates,
    loading,
    queryError,
    isOptedIn,
    isConfigured,
    missingEnvKeys,
    embeddedSignupAllowedOriginsUrl,
  } = useDerivedWhatsappData(queries, mutations);
  const page = useWhatsappPageInteractions(queries, mutations, labels);
  const syncDisabledReason = resolveSyncDisabledReason(
    page.utilityHandlers.syncing,
    isConfigured,
    missingEnvKeys,
    whatsappLabels
  );

  return buildWhatsappViewModel({
    labels,
    esConfigId,
    esAppId,
    embeddedSignupAllowedOriginsUrl,
    accounts,
    templates,
    loading,
    isOptedIn,
    isConfigured,
    syncDisabledReason,
    queryError,
    createHandler: page.createHandler,
    updateLocalDeactivateHandlers: page.updateLocalDeactivateHandlers,
    utilityHandlers: page.utilityHandlers,
    embeddedSignupHandler: page.embeddedSignupHandler,
    dialogState: page.dialogState,
    mutationError: page.mutationError,
    snackbar: page.snackbar,
    closeSnackbar: page.closeSnackbar,
    openCreateDialog: page.openCreateDialog,
    openEditNameDialog: page.openEditNameDialog,
    openEditTokenDialog: page.openEditTokenDialog,
    openEditPinDialog: page.openEditPinDialog,
    openLocalDeactivateConfirmDialog: page.openLocalDeactivateConfirmDialog,
    openManageRecipientsDialog: page.openManageRecipientsDialog,
    openEmbeddedSignupDialog: page.openEmbeddedSignupDialog,
    embeddedSignupBlocked: page.embeddedSignupBlocked,
    closeDialog: page.closeDialog,
    refetchAccounts: page.refetchAccounts,
    refetchTemplates: page.refetchTemplates,
    editingTokenForId: page.editingTokenForId,
    editingPinForId: page.editingPinForId,
    handleTestToken,
    tokenTestStates,
  });
}
