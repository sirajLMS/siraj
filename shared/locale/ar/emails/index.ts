import type { EmailsLabels } from "@/shared/locale/types/emails";

export const emails: EmailsLabels = {
  complaintResponse: {
    subject: ({ complaintTitle }) => `رد على شكواك: ${complaintTitle}`,
    greeting: ({ parentName }) => `عزيزي ${parentName}،`,
    body: ({ complaintTitle }) => `لقد قمنا بالرد على شكواك "${complaintTitle}". يرجى الاطلاع على الرد أدناه.`,
    responseLabel: "الرد",
    dateLabel: "التاريخ",
    footer: "نشكرك على صبرك. إذا كان لديك أي استفسارات أخرى، لا تتردد في الاتصال بنا.",
  },
  suggestionAcknowledged: {
    subject: "تم استلام اقتراحك",
    greeting: ({ parentName }) => `عزيزي ${parentName}،`,
    body: "شكراً لاقتراحك. لقد استلمناه وسيقوم فريقنا بمراجعته.",
    suggestionLabel: "الاقتراح",
    dateLabel: "التاريخ",
    footer: "نقدر ملاحظاتك ومساهمتك في تحسين خدمتنا.",
  },
};
