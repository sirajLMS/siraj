"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  updateWhatsappConfigurationMutationDocument,
  whatsappConfigurationQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type { WhatsappConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";
import type { WhatsappSnackbar } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  baselineFromConfig,
  buildConfigInput,
  computeWhatsappConfigFieldErrors,
  copyWhatsappConfigValue,
  saveWhatsappConfigAction,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappConfigViewModel.helpers";
import {
  useWhatsappConfigForm,
  useWhatsappConnectionTest,
  useWhatsappVerifyTokenGenerator,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappConfigViewModel.hooks";
import { Translation, useAppTranslation } from "@/shared/locale";

export function useWhatsappConfigViewModel(): WhatsappConfigTabViewModel {
  const labels = useAppTranslation(Translation.Whatsapp);
  const canManage = useUserStore(state => state.hasPermission(AppPermission.WhatsappConfigManage));

  // `notifyOnNetworkStatusChange` keeps `loading` true during every refetch
  // (post-save refetch, post-error Retry) so consumers can gate their actions
  // on it — the Retry button disappears while a refetch is in flight, which
  // prevents concurrent refetch clicks, and the form stays rendered during
  // the post-save refetch (config already exists, so no spinner flash).
  const configQuery = useQuery(whatsappConfigurationQueryDocument, { notifyOnNetworkStatusChange: true });
  const [updateConfig] = useMutation(updateWhatsappConfigurationMutationDocument);

  const config = configQuery.data?.whatsappConfiguration ?? null;
  const baseline = useMemo(() => baselineFromConfig(config), [config]);
  const { values, onFieldChange, resetDraft, dirty } = useWhatsappConfigForm(baseline);
  const fieldErrors = useMemo(() => computeWhatsappConfigFieldErrors(values), [values]);

  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<WhatsappSnackbar>(null);

  const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
    setSnackbar({ message, severity });
  }, []);

  const onDismissSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);

  const onRetry = useCallback(() => {
    // Rejection-safe like onSave's refetch handling: a failed refetch is only
    // logged — the query's own error state drives the Retry affordance, and
    // the rejected promise must not surface as an unhandled rejection.
    configQuery.refetch().catch((error: unknown) => {
      logger.warn("WhatsApp configuration refetch failed", { error });
    });
  }, [configQuery]);

  const onSave = useCallback(async () => {
    await saveWhatsappConfigAction(
      buildConfigInput(values, baseline),
      updateConfig,
      configQuery.refetch,
      resetDraft,
      showSnackbar,
      setSaving,
      labels
    );
  }, [baseline, configQuery, labels, resetDraft, showSnackbar, updateConfig, values]);

  const { testing, connectionResult, onTestConnection } = useWhatsappConnectionTest(labels);
  const { generating, onGenerateToken } = useWhatsappVerifyTokenGenerator(labels, onFieldChange, showSnackbar);

  const onCopy = useCallback(
    (value: string | null) => {
      copyWhatsappConfigValue(value, labels, showSnackbar);
    },
    [labels, showSnackbar]
  );

  return {
    labels,
    config,
    loading: configQuery.loading,
    queryError: configQuery.error !== undefined,
    canManage,
    values,
    fieldErrors,
    dirty,
    saving,
    testing,
    generating,
    connectionResult,
    snackbar,
    onFieldChange,
    onSave,
    onTestConnection,
    onGenerateToken,
    onCopy,
    onDismissSnackbar,
    onRetry,
  };
}
