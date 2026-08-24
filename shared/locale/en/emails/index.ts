import type { EmailsLabels } from "@/shared/locale/types/emails";

export const emailsEn: EmailsLabels = {
  complaintResponse: {
    subject: ({ complaintTitle }) => `Response to your complaint: ${complaintTitle}`,
    greeting: ({ parentName }) => `Dear ${parentName},`,
    body: ({ complaintTitle }) =>
      `We have responded to your complaint "${complaintTitle}". Please see the response below.`,
    responseLabel: "Response",
    dateLabel: "Date",
    footer: "Thank you for your patience. If you have any further questions, please don't hesitate to contact us.",
  },
  suggestionAcknowledged: {
    subject: "Your suggestion has been acknowledged",
    greeting: ({ parentName }) => `Dear ${parentName},`,
    body: "Thank you for your suggestion. We have received it and our team will review it.",
    suggestionLabel: "Suggestion",
    dateLabel: "Date",
    footer: "We appreciate your feedback and contribution to improving our service.",
  },
};
