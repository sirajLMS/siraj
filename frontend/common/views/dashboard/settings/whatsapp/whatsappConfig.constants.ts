import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappConfigTab } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView";

export type { WhatsappConfigTab };

/** Shared tab identifiers — identical for both desktop and mobile. */
export const TAB_IDS: readonly WhatsappConfigTab[] = ["numbers", "templates", "optin", "inbox", "config"];

/** Shared tab label keys — identical for both desktop and mobile. */
export const TAB_LABELS: Record<
  WhatsappConfigTab,
  "tabNumbers" | "tabTemplates" | "tabOptIn" | "tabInbox" | "tabConfig"
> = {
  numbers: "tabNumbers",
  templates: "tabTemplates",
  optin: "tabOptIn",
  inbox: "tabInbox",
  config: "tabConfig",
};

/** Per-tab required permissions for fine-grained access control. */
export const TAB_PERMISSIONS: Record<WhatsappConfigTab, readonly AppPermission[]> = {
  numbers: [AppPermission.WhatsappConfigManage],
  templates: [AppPermission.WhatsappTemplatesManage],
  optin: [AppPermission.WhatsappView],
  inbox: [AppPermission.WhatsappInboxView],
  // Read access mirrors the backend read gate: view OR manage. Editing inside
  // the panel is additionally gated by the manage permission.
  config: [AppPermission.WhatsappView, AppPermission.WhatsappConfigManage],
};
