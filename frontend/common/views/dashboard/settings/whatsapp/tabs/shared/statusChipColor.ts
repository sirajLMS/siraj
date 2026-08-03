import { WhatsappTemplateStatus } from "@/shared/constants/whatsapp-templates.enum";

export function statusChipColor(status: string | null): "success" | "warning" | "error" | "default" {
  switch (status) {
    case WhatsappTemplateStatus.APPROVED:
      return "success";
    case WhatsappTemplateStatus.PENDING:
      return "warning";
    case WhatsappTemplateStatus.REJECTED:
      return "error";
    default:
      return "default";
  }
}
