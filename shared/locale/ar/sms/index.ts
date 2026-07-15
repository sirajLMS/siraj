import type { SmsLabels } from "@/shared/locale/types/sms";

export const sms: SmsLabels = {
  complaintResponse: {
    urgentResponse: ({ parentName, complaintTitle, responseSummary }) =>
      `عزيزي ${parentName}، بخصوص "${complaintTitle}": ${responseSummary}. - فريق الدعم`,
  },
  suggestionAcknowledged: {
    acknowledged: ({ parentName, suggestionTitle }) =>
      `عزيزي ${parentName}، تم استلام اقتراحك "${suggestionTitle}" وتأكيده. شكراً لك!`,
  },
};
