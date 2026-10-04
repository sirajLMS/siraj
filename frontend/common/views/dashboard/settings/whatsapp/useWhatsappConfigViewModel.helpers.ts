import type {
  WhatsappConfigUpdateInput,
  WhatsappConfigurationFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type {
  WhatsappConfigFormField,
  WhatsappConfigFormValues,
  WhatsappConfigValidationKey,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";
import {
  validateWhatsappAppId,
  validateWhatsappConfigMaxLengths,
  validateWhatsappPhoneNumberId,
  validateWhatsappWabaId,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappConfigFormValidation";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

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

/** Snackbar notification signature shared by the config tab's actions. */
type SnackbarShow = (message: string, severity: "success" | "error") => void;

/** Client-side mirror of the server's per-field length caps, merged with the per-field format validators (the format key wins on both). */
export function computeWhatsappConfigFieldErrors(
  values: WhatsappConfigFormValues
): Partial<Record<WhatsappConfigFormField, WhatsappConfigValidationKey>> {
  const lengthErrors = validateWhatsappConfigMaxLengths(values);
  return {
    appId: validateWhatsappAppId(values.appId) ?? lengthErrors.appId,
    appSecret: lengthErrors.appSecret,
    verifyToken: lengthErrors.verifyToken,
    phoneNumberId: validateWhatsappPhoneNumberId(values.phoneNumberId) ?? lengthErrors.phoneNumberId,
    wabaId: validateWhatsappWabaId(values.wabaId) ?? lengthErrors.wabaId,
    accessToken: lengthErrors.accessToken,
    esConfigId: lengthErrors.esConfigId,
  };
}

/** Form baseline from the masked server view — secrets never materialize in inputs. */
export function baselineFromConfig(config: WhatsappConfigurationFieldsFragment | null): WhatsappConfigFormValues {
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
export function buildConfigInput(
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

/**
 * Save action: the mutation and the follow-up refetch fail separately —
 * a failed refetch must NOT repaint a committed save as a failure, so the
 * success snackbar is shown as soon as the mutation resolves and a refetch
 * failure is only logged (the query's own error state drives the Retry
 * affordance).
 */
export async function saveWhatsappConfigAction(
  input: WhatsappConfigUpdateInput,
  updateConfig: (opts: { variables: { input: WhatsappConfigUpdateInput } }) => Promise<unknown>,
  refetch: () => Promise<unknown>,
  resetDraft: () => void,
  showSnackbar: SnackbarShow,
  setSaving: (value: boolean) => void,
  labels: Pick<WhatsappLabels, "configSaveError" | "configSaveSuccess">
): Promise<void> {
  setSaving(true);
  try {
    try {
      await updateConfig({ variables: { input } });
    } catch (error) {
      logger.error("Failed to save the WhatsApp configuration", { error });
      showSnackbar(labels.configSaveError, "error");
      return;
    }
    resetDraft();
    showSnackbar(labels.configSaveSuccess, "success");
    try {
      await refetch();
    } catch (error) {
      logger.warn("WhatsApp configuration was saved but the follow-up refetch failed", { error });
    }
  } finally {
    setSaving(false);
  }
}

/**
 * Copies a config value to the clipboard and reports the outcome via the
 * snackbar; missing clipboard access (non-browser context) is reported as a
 * failure instead of throwing.
 */
export function copyWhatsappConfigValue(
  value: string | null,
  labels: Pick<WhatsappLabels, "configCopied" | "configCopyFailed">,
  showSnackbar: SnackbarShow
): void {
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
}
