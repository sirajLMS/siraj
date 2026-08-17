import type { SmsLabels } from "../../types/sms";

export const smsAr: SmsLabels = {
  complaintResponse: {
    urgentResponse: ({ parentName, complaintTitle, responseSummary }) =>
      `عزيزي ${parentName}، بخصوص "${complaintTitle}": ${responseSummary}. - فريق الدعم`,
  },
  suggestionAcknowledged: {
    acknowledged: ({ parentName, suggestionTitle }) =>
      `عزيزي ${parentName}، تم استلام اقتراحك "${suggestionTitle}" وتأكيده. شكراً لك!`,
  },
};
