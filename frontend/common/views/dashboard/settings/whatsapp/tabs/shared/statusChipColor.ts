import { WhatsappTemplateStatus } from "@/shared/constants/whatsapp-templates.enum";

export function statusChipColor(status: string | null): "success" | "warning" | "error" | "default" {
  switch (status) {
    case WhatsappTemplateStatus.APPROVED:
      return "success";
    case WhatsappTemplateStatus.PENDING:
      return "warning";
    case WhatsappTemplateStatus.REJECTED:
      return "error";
    case WhatsappTemplateStatus.PAUSED:
      return "default";
    case WhatsappTemplateStatus.PENDING_DELETION:
      return "default";
    case WhatsappTemplateStatus.DISABLED:
      return "default";
    default:
      return "default";
  }
}
