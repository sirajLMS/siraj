import type { SmsLabels } from "@/shared/locale/types/sms";

export const sms: SmsLabels = {
  complaintResponse: {
    urgentResponse: ({ parentName, complaintTitle, responseSummary }) =>
      `Dear ${parentName}, regarding "${complaintTitle}": ${responseSummary}. - Support Team`,
  },
  suggestionAcknowledged: {
    acknowledged: ({ parentName, suggestionTitle }) =>
      `Dear ${parentName}, your suggestion "${suggestionTitle}" has been acknowledged. Thank you!`,
  },
};
