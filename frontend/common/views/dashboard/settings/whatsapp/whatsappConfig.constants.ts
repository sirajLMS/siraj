import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappConfigTab } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView";

export type { WhatsappConfigTab };

/** Shared tab identifiers — identical for both desktop and mobile. */
export const TAB_IDS: readonly WhatsappConfigTab[] = ["numbers", "templates", "optin"];

/** Shared tab label keys — identical for both desktop and mobile. */
export const TAB_LABELS: Record<WhatsappConfigTab, "tabNumbers" | "tabTemplates" | "tabOptIn"> = {
  numbers: "tabNumbers",
  templates: "tabTemplates",
  optin: "tabOptIn",
};

/** Per-tab required permissions for fine-grained access control. */
export const TAB_PERMISSIONS: Record<WhatsappConfigTab, readonly AppPermission[]> = {
  numbers: [AppPermission.WhatsappConfigManage],
  templates: [AppPermission.WhatsappTemplatesManage],
  optin: [AppPermission.WhatsappView],
};

/** Tab URL string values — same as TAB_IDS, used for URL serialization. */
export const TAB_URL_VALUES: readonly WhatsappConfigTab[] = TAB_IDS;
