import type { ComplaintsLabels } from "@/shared/messages/types/dashboard/complaints";

export const complaints: ComplaintsLabels = {
  parent: {
    pageTitle: "الشكاوى والسجلات",
    formTitle: "تقديم شكوى جديدة",
    student: "اختر الطالب",
    category: "فئة الشكوى",
    contactEmail: "البريد الإلكتروني للتواصل",
    contactEmailPlaceholder: "parent.contact@example.com",
    complaintDetails: "تفاصيل الشكوى",
    complaintDetailsPlaceholder: "صف مخاوفك بالتفصيل...",
    submit: "إرسال الشكوى",
    successMessage: "تم إرسال شكواك بنجاح.",
    policyTitle: "نظرة عامة على السياسة",
    policyBody:
      "نهدف للرد على جميع شكاوى أولياء الأمور خلال 48 ساعة أكاديمية. يجب الإبلاغ عن الأمور العاجلة مباشرة إلى مكتب الإدارة.",
    recordTitle: "سجل الشكاوى",
    totalRecords: "{count} سجل إجمالي",
    loadOlder: "تحميل السجلات الأقدم",
    waitingMessage: "في انتظار مراجعة الإدارة وتقديم الرد...",
    adminResponse: "رد الإدارة",
    regarding: "بخصوص",
    validation: {
      studentRequired: "يرجى اختيار طالب.",
      emailRequired: "يرجى إدخال بريدك الإلكتروني.",
      emailInvalid: "يرجى إدخال بريد إلكتروني صالح.",
      detailsRequired: "يرجى وصف شكواك في 10 أحرف على الأقل.",
      categoryRequired: "يرجى اختيار فئة الشكوى.",
    },
    statusLabels: {
      pending: "معلقة",
      resolved: "تم الحل",
    },
    categoryLabels: {
      REGARDING_TEACHER: "بخصوص المعلم",
      REGARDING_SYSTEM: "بخصوص النظام",
      OTHER: "أخرى",
    },
  },
  admin: {
    pageTitle: "قائمة معالجة الشكاوى",
    pageSubtitle: "مراجعة والرد على شكاوى المؤسسة.",
    metrics: {
      unanswered: "غير مجاب",
      answered: "تم الرد",
      avgResolution: "متوسط وقت المعالجة",
      efficiencyNote: "تحسن الكفاءة 12%",
    },
    tabs: {
      unanswered: "غير مجاب",
      answered: "تم الرد",
    },
    searchPlaceholder: "البحث في الشكاوى...",
    queue: {
      received: "تاريخ الاستلام",
      yourResponse: "ردك",
      responsePlaceholder: "اكتب الحل الرسمي هنا...",
      answer: "رد",
      answerAndEmail: "رد وإرسال بالبريد",
      adminResponse: "رد الإدارة",
      noEntries: "لا توجد شكاوى مطابقة للبحث",
      deleteConfirmTitle: "حذف الشكوى",
      deleteConfirmBody: "سيتم إزالة هذه الشكوى نهائيًا من القائمة. لا يمكن التراجع عن هذا الإجراء.",
      deleteConfirmCancel: "إلغاء",
      deleteConfirmConfirm: "حذف",
    },
    priorityLabels: {
      urgent: "أولوية عاجلة",
      general: "استفسار عام",
    },
    categoryLabels: {
      REGARDING_TEACHER: "بخصوص المعلم",
      REGARDING_SYSTEM: "بخصوص النظام",
      OTHER: "أخرى",
    },
  },
};
