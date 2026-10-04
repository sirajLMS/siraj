import type {
  WhatsappCreateInput,
  WhatsappSettingsLabels,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

/** Snackbar notification signature shared by the settings tab's actions and handlers. */
export type SnackbarShow = (message: string, severity: "success" | "error") => void;

/** Creation payload: server-managed fields are nulled so the backend keeps ownership of them. */
export function buildCreateInput(input: WhatsappCreateInput) {
  return {
    displayName: { en: input.displayName },
    phoneNumberId: input.phoneNumberId,
    wabaId: input.wabaId,
    purpose: input.purpose,
    displayPhoneNumber: null,
    isActive: null,
    portfolioMessagingLimitTier: null,
    qualityRating: null,
    throughputLevel: null,
  };
}

/** Rename payload: only the English display name is editable from the settings tab. */
export function buildUpdateInput(displayName: string) {
  return {
    displayName: { en: displayName },
    displayPhoneNumber: null,
    isActive: null,
    portfolioMessagingLimitTier: null,
    qualityRating: null,
    throughputLevel: null,
  };
}

/**
 * Tooltip reason shown on the disabled "Sync from Meta" action: the busy
 * label during a sync, the missing-env-keys hint when no account or env
 * bootstrap can serve Meta sync, and no tooltip when the action is enabled.
 */
export function resolveSyncDisabledReason(
  syncing: boolean,
  isConfigured: boolean,
  missingEnvKeys: readonly string[],
  whatsappLabels: WhatsappSettingsLabels["page"]
): string | undefined {
  if (syncing) return whatsappLabels.syncFromMetaBusy;
  if (!isConfigured) return whatsappLabels.syncFromMetaUnavailable(missingEnvKeys.join(", "));
  return undefined;
}
