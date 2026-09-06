import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappConfigTab } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView";

export type { WhatsappConfigTab };

/** Shared tab identifiers — identical for both desktop and mobile. */
export const TAB_IDS: readonly WhatsappConfigTab[] = ["numbers", "templates", "optin", "inbox"];

/** Shared tab label keys — identical for both desktop and mobile. */
export const TAB_LABELS: Record<WhatsappConfigTab, "tabNumbers" | "tabTemplates" | "tabOptIn" | "tabInbox"> = {
  numbers: "tabNumbers",
  templates: "tabTemplates",
  optin: "tabOptIn",
  inbox: "tabInbox",
};

/** Per-tab required permissions for fine-grained access control. */
export const TAB_PERMISSIONS: Record<WhatsappConfigTab, readonly AppPermission[]> = {
  numbers: [AppPermission.WhatsappConfigManage],
  templates: [AppPermission.WhatsappTemplatesManage],
  optin: [AppPermission.WhatsappView],
  inbox: [AppPermission.WhatsappInboxView],
};
