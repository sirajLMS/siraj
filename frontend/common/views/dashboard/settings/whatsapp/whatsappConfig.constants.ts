import type { WhatsappConfigTab } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView";

/** Shared tab identifiers — identical for both desktop and mobile. */
export const TAB_IDS: readonly WhatsappConfigTab[] = ["numbers", "templates", "optin"];

/** Shared tab label keys — identical for both desktop and mobile. */
export const TAB_LABELS: Record<WhatsappConfigTab, "tabNumbers" | "tabTemplates" | "tabOptIn"> = {
  numbers: "tabNumbers",
  templates: "tabTemplates",
  optin: "tabOptIn",
};
