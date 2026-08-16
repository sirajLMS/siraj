import type { WhatsappTemplateRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { getWhatsappTemplateStatusBadgeConfig } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge";
import { getTemplateStatusLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappTemplateStatusLabels";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/**
 * Set of i18n keys that are guaranteed to be `string` properties on
 * `WhatsappLabels` (not function-typed pluralization/interpolation keys).
 * Used to safely index `WhatsappLabels` for template status lookups.
 */
const TEMPLATE_STATUS_LABEL_KEYS = [
  "templateStatusApproved",
  "templateStatusPending",
  "templateStatusRejected",
  "templateStatusPaused",
  "templateStatusPendingDeletion",
  "templateStatusDisabled",
] as const satisfies readonly string[];

type TemplateStatusLabelKey = (typeof TEMPLATE_STATUS_LABEL_KEYS)[number];

function isTemplateStatusLabelKey(key: string): key is TemplateStatusLabelKey {
  return (TEMPLATE_STATUS_LABEL_KEYS as readonly string[]).includes(key);
}

/**
 * Builds a localized `StatusBadge` label by resolving the template status enum
 * → i18n key string → localized string from the `WhatsappLabels` object.
 *
 * Falls back to the raw badge config label (enum value) when the resolved i18n
 * key is not one of the known `string`-typed status label keys.
 */
export function getLocalizedTemplateStatus(row: WhatsappTemplateRow, t: WhatsappLabels): string {
  const key = getTemplateStatusLabelKey(row.status ?? "");
  if (isTemplateStatusLabelKey(key)) {
    return t[key];
  }
  return getWhatsappTemplateStatusBadgeConfig(row.status).label;
}
