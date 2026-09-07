"use client";

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import type { WhatsappConfigurationFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { AppPermission, type WhatsappConfigUpdateInput } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  generateWhatsappVerifyTokenQueryDocument,
  testWhatsappConnectionQueryDocument,
  updateWhatsappConfigurationMutationDocument,
  whatsappConfigurationQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  WhatsappConfigConnectionResult,
  WhatsappConfigFormField,
  WhatsappConfigFormValues,
  WhatsappConfigTabViewModel,
  WhatsappConfigValidationKey,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";
import type { WhatsappSnackbar } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  validateWhatsappAppId,
  validateWhatsappPhoneNumberId,
  validateWhatsappWabaId,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappConfigFormValidation";
import { Translation, useAppTranslation } from "@/shared/locale";

// ─── Constants ───────────────────────────────────────────────────────

const EMPTY_CONFIG_VALUES: WhatsappConfigFormValues = {
  appId: "",
  appSecret: "",
  verifyToken: "",
  phoneNumberId: "",
  wabaId: "",
  accessToken: "",
  esConfigId: "",
};

/** Meta app secret / access token start empty — typed values replace, empty preserves. */
const SECRET_FIELDS: readonly WhatsappConfigFormField[] = ["appSecret", "accessToken"];

/** Visible (non-secret) fields — emptied inputs clear the stored value on save. */
const VISIBLE_FIELDS: readonly WhatsappConfigFormField[] = [
  "appId",
  "verifyToken",
  "phoneNumberId",
  "wabaId",
  "esConfigId",
];

// ─── Pure helpers ────────────────────────────────────────────────────

function areValuesEqual(a: WhatsappConfigFormValues, b: WhatsappConfigFormValues): boolean {
  return (
    a.appId === b.appId &&
    a.appSecret === b.appSecret &&
    a.verifyToken === b.verifyToken &&
    a.phoneNumberId === b.phoneNumberId &&
    a.wabaId === b.wabaId &&
    a.accessToken === b.accessToken &&
    a.esConfigId === b.esConfigId
  );
}

/** Form baseline from the masked server view — secrets never materialize in inputs. */
function baselineFromConfig(config: WhatsappConfigurationFieldsFragment | null): WhatsappConfigFormValues {
  if (!config) {
    return EMPTY_CONFIG_VALUES;
  }
  return {
    appId: config.appId ?? "",
    appSecret: "",
    verifyToken: config.verifyToken ?? "",
    phoneNumberId: config.phoneNumberId ?? "",
    wabaId: config.wabaId ?? "",
    accessToken: "",
    esConfigId: config.esConfigId ?? "",
  };
}

/**
 * Builds the mutation input with the backend's merge semantics: a field set
 * to `undefined` is dropped by the JSON transport (stored value preserved),
 * an explicit `null` clears the stored value, and a string replaces it.
 * Masked server values are never echoed back — secret inputs only submit
 * when the user typed a replacement.
 */
function buildConfigInput(
  values: WhatsappConfigFormValues,
  baseline: WhatsappConfigFormValues
): WhatsappConfigUpdateInput {
  const input: WhatsappConfigUpdateInput = {
    appId: undefined,
    appSecret: undefined,
    verifyToken: undefined,
    phoneNumberId: undefined,
    wabaId: undefined,
    accessToken: undefined,
    esConfigId: undefined,
  };

  for (const field of VISIBLE_FIELDS) {
    if (values[field] !== baseline[field]) {
      input[field] = values[field] === "" ? null : values[field];
    }
  }
  for (const field of SECRET_FIELDS) {
    if (values[field] !== "") {
      input[field] = values[field];
    }
  }
  return input;
}

// ─── Form state hook ─────────────────────────────────────────────────

/**
 * Draft-based form state: without a draft the inputs mirror the server
 * baseline (so refetches keep the form fresh); the first keystroke creates a
 * draft that then wins over any server change until it is reset on save.
 */
function useConfigForm(baseline: WhatsappConfigFormValues) {
  const [draft, setDraft] = useState<WhatsappConfigFormValues | null>(null);

  const values = draft ?? baseline;

  const onFieldChange = useCallback(
    (field: WhatsappConfigFormField, value: string) => {
      setDraft(previous => ({ ...(previous ?? baseline), [field]: value }));
    },
    [baseline]
  );

  const resetDraft = useCallback(() => {
    setDraft(null);
  }, []);

  const dirty = draft !== null && !areValuesEqual(draft, baseline);

  return { values, onFieldChange, resetDraft, dirty };
}

// ─── Main hook ───────────────────────────────────────────────────────

export function useWhatsappConfigViewModel(): WhatsappConfigTabViewModel {
  const labels = useAppTranslation(Translation.Whatsapp);
  const canManage = useUserStore(state => state.hasPermission(AppPermission.WhatsappConfigManage));
  const client = useApolloClient();

  // `notifyOnNetworkStatusChange` keeps `loading` true during every refetch
  // (post-save refetch, post-error Retry) so consumers can gate their actions
  // on it — the Retry button disappears while a refetch is in flight, which
  // prevents concurrent refetch clicks, and the form stays rendered during
  // the post-save refetch (config already exists, so no spinner flash).
  const configQuery = useQuery(whatsappConfigurationQueryDocument, { notifyOnNetworkStatusChange: true });
  const [updateConfig] = useMutation(updateWhatsappConfigurationMutationDocument);

  const config = configQuery.data?.whatsappConfiguration ?? null;
  const baseline = useMemo(() => baselineFromConfig(config), [config]);
  const { values, onFieldChange, resetDraft, dirty } = useConfigForm(baseline);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [connectionResult, setConnectionResult] = useState<WhatsappConfigConnectionResult | null>(null);
  const [snackbar, setSnackbar] = useState<WhatsappSnackbar>(null);

  const fieldErrors = useMemo<Partial<Record<WhatsappConfigFormField, WhatsappConfigValidationKey>>>(
    () => ({
      appId: validateWhatsappAppId(values.appId) ?? undefined,
      phoneNumberId: validateWhatsappPhoneNumberId(values.phoneNumberId) ?? undefined,
      wabaId: validateWhatsappWabaId(values.wabaId) ?? undefined,
    }),
    [values]
  );

  const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
    setSnackbar({ message, severity });
  }, []);

  const onDismissSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);

  const onRetry = useCallback(() => {
    void configQuery.refetch();
  }, [configQuery]);

  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateConfig({ variables: { input: buildConfigInput(values, baseline) } });
      await configQuery.refetch();
      resetDraft();
      showSnackbar(labels.configSaveSuccess, "success");
    } catch (error) {
      logger.error("Failed to save the WhatsApp configuration", { error });
      showSnackbar(labels.configSaveError, "error");
    } finally {
      setSaving(false);
    }
  }, [baseline, configQuery, labels, resetDraft, showSnackbar, updateConfig, values]);

  const onTestConnection = useCallback(async () => {
    setTesting(true);
    try {
      const { data } = await client.query({
        query: testWhatsappConnectionQueryDocument,
        fetchPolicy: "network-only",
      });
      const result = data?.testWhatsappConnection;
      setConnectionResult(
        result
          ? { success: result.success === true, message: result.message ?? "", phoneNumber: result.phoneNumber ?? null }
          : null
      );
    } catch (error) {
      logger.error("Failed to run the WhatsApp connection test", { error });
      setConnectionResult({ success: false, message: labels.configTestConnectionError, phoneNumber: null });
    } finally {
      setTesting(false);
    }
  }, [client, labels]);

  const onGenerateToken = useCallback(async () => {
    setGenerating(true);
    try {
      const { data } = await client.query({
        query: generateWhatsappVerifyTokenQueryDocument,
        fetchPolicy: "network-only",
      });
      const token = data?.generateWhatsappVerifyToken ?? "";
      if (token.length > 0) {
        onFieldChange("verifyToken", token);
        showSnackbar(labels.configTokenGenerated, "success");
      }
    } catch (error) {
      logger.error("Failed to generate a WhatsApp verify token", { error });
      showSnackbar(labels.configTokenGenerateError, "error");
    } finally {
      setGenerating(false);
    }
  }, [client, labels, onFieldChange, showSnackbar]);

  const onCopy = useCallback(
    (value: string | null) => {
      if (!value) {
        return;
      }
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        showSnackbar(labels.configCopyFailed, "error");
        return;
      }
      navigator.clipboard.writeText(value).then(
        () => showSnackbar(labels.configCopied, "success"),
        () => showSnackbar(labels.configCopyFailed, "error")
      );
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
