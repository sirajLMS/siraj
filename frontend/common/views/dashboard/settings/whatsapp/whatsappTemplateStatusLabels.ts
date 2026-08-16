import { WhatsappTemplateStatus } from "@/shared/constants/whatsapp-templates.enum";

const TEMPLATE_STATUS_LABEL_KEYS: Readonly<Record<string, string>> = {
  [WhatsappTemplateStatus.APPROVED]: "templateStatusApproved",
  [WhatsappTemplateStatus.PENDING]: "templateStatusPending",
  [WhatsappTemplateStatus.REJECTED]: "templateStatusRejected",
  [WhatsappTemplateStatus.PAUSED]: "templateStatusPaused",
  [WhatsappTemplateStatus.PENDING_DELETION]: "templateStatusPendingDeletion",
  [WhatsappTemplateStatus.DISABLED]: "templateStatusDisabled",
} as const;

export function getTemplateStatusLabelKey(status: string): string {
  return TEMPLATE_STATUS_LABEL_KEYS[status?.toUpperCase() ?? ""] ?? "templateStatusPending";
}
