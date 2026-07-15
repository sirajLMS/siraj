import type { StudentStatusLabels } from "@/shared/locale/types/dashboard/students";

export const status: StudentStatusLabels = {
  pageTitle: "حالة الطالب وتجميد الجدول",
  studentId: id => `المعرف: #${id}`,
  breadcrumbs: {
    students: "الطلاب",
    statusHold: "الحالة والتجميد",
  },
  sections: {
    adminHold: "تجميد إداري",
    policyOverview: "نظرة عامة على السياسة",
    upcomingClasses: "جدول الحصص القادمة",
    upcomingClassesMobile: "الحصص القادمة",
  },
  fields: {
    accountStatus: "حالة الحساب الجديدة",
    statusReason: "سبب التغيير",
    statusReasonPlaceholder: "أدخل المبررات الإدارية هنا...",
    quickReasons: "أسباب سريعة",
  },
  validation: {
    reasonMinLength: "يجب أن يكون السبب 5 أحرف على الأقل",
  },
  statusOptions: {
    REGULAR: "عادي / نشط",
    SUSPENDED: "موقوف (مالي/تأديبي)",
    ON_LEAVE: "في إجازة (طبية/مخطط لها)",
    ON_TRIAL: "تح التجربة",
    DEACTIVATED: "معطّل",
  },
  reasons: {
    unpaidInvoice: "فاتورة غير مدفوعة",
    misconduct: "سوء سلوك",
    vacation: "إجازة",
  },
  actions: {
    applyChange: "تطبيق تغيير الحالة",
    viewHistory: "عرض السجل",
    contactParent: "الاتصال بولي الأمر",
    viewAll: "عرض الكل",
  },
  table: {
    subjectInstructor: "المادة والمعلم",
    dateTime: "التاريخ والوقت",
    holdStatus: "حالة التعليق",
    status: "الحالة",
    pendingHolds: count => `${count} تجميدات معلقة`,
    footerInfo: id => `نهاية قائمة الحصص القادمة لـ ${id}`,
    noUpcomingClasses: "لا توجد حصص قادمة",
    frozen: "مجمّد",
    active: "نشط",
    minutesShort: minutes => `${minutes} د`,
    sessionEnded: "انتهت الحصة",
    joinSession: "الانضمام للحصة",
  },
  policies: {
    suspensionTitle: "الإيقاف",
    suspensionDesc: "يوقف محرك الفوترة تماماً ويغلق جميع صلاحيات الوصول لبوابة الطالب فوراً.",
    onLeaveTitle: "في إجازة",
    onLeaveDesc: "يحافظ على سجلات التسجيل ولكنه يوقف جدولة الحصص. قد يتم احتساب الفوترة بنسب تناسبية.",
  },
  warning: {
    title: "تنبيه: تعليق الحساب قيد الانتظار",
    description:
      "سيؤدي تغيير الحالة إلى 'موقوف' إلى تفعيل قفل شامل للنظام فوراً. سيتم تجميد جميع الحصص القادمة، مما يمنع المعلمين من بدء الجلسات. سيتم إيقاف محرك الفوترة لهذا المعرف حتى إعادة التفعيل يدوياً.",
  },
  successMessage: "تم تحديث حالة الطالب بنجاح.",
  errors: {
    invalidId: "معرف الطالب غير صالح.",
  },
};
