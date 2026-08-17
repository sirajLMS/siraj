import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students";

export const dashboardStudentQuotaAr: StudentQuotaLabels = {
  pageTitle: "تعديل الملف الشخصي للطالب",
  common: {
    system: "النظام",
    notSet: "غير محدد",
  },
  breadcrumbs: {
    students: "الطلاب",
    adjustQuota: "تعديل الحصة",
  },
  sections: {
    studentInfo: "معلومات الطالب",
    courseDetails: "تفاصيل الدورة",
  },
  fields: {
    studentName: "اسم الطالب",
    studentNamePlaceholder: "أدخل الاسم الكامل",
    dateOfBirth: "تاريخ الميلاد",
    language: "اللغة",
    arabic: "العربية",
    english: "الإنجليزية",
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
    teacher: "المعلم",
    loadingTeachers: "جاري تحميل المعلمين...",
    totalClasses: "إجمالي الحصص",
    classesLeft: "الحصص المتبقية",
    overrideActive: "يدوي",
    overrideNotice: "تجاوز الحصة اليدوي نشط. ستتجاهل هذه القيمة الاستهلاك التلقائي لدورة الفوترة الحالية.",
  },
  actions: {
    save: "حفظ التغييرات",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    saved: "تم الحفظ!",
    saveSuccess: "تم تحديث الحصة بنجاح.",
    lastEditedAt: time => `آخر تعديل: ${time}`,
  },
  info: {
    quotaTitle: "إدارة الحصص",
    quotaDesc:
      "سيؤدي تعديل 'الحصص المتبقية' إلى تجاوز التتبع التلقائي للحضور لدورة الفوترة هذه. استخدم هذا للجلسات التكميلية أو أرصدة التعويض.",
    publicTitle: "الملف العام",
    publicDesc: "ستكون التغييرات على الاسم واللغة مرئية للمعلمين وأولياء الأمور في لوحات التحكم الخاصة بهم على الفور.",
  },
  validation: {
    nameRequired: "اسم الطالب مطلوب",
    dobRequired: "تاريخ الميلاد مطلوب",
    languageRequired: "اللغة مطلوبة",
    genderRequired: "الجنس مطلوب",
    teacherRequired: "المعلم مطلوب",
    totalClassesRequired: "إجمالي الحصص مطلوب",
    totalClassesMin: "يجب أن يكون إجمالي الحصص 0 على الأقل",
    classesLeftRequired: "الحصص المتبقية مطلوبة",
    classesLeftMin: "يجب أن تكون الحصص المتبقية 0 على الأقل",
  },
  errors: {
    invalidId: "معرف الطالب غير صالح.",
  },
  audience: {
    studentTitle: "حصصي",
    parentTitle: "حصص الأبناء",
    teacherTitle: "استخدام حصص الصف",
    supervisorTitle: "مراقبة الحصص",
    activeQuotas: "الحصص النشطة",
    remainingCredits: "الأرصدة المتبقية",
    onDemandPending: "طلبات حسب الطلب معلقة",
    noChildren: "لا يوجد أبناء",
    quotaSummary: "ملخص الحصص",
    classQuotaUsage: "استخدام حصص الصف",
    onDemandPendingQueue: "قائمة انتظار الطلبات حسب الطلب",
    classAnalytics: "تحليلات الصف",
    lowBalanceAlerts: "تنبيهات الرصيد المنخفض",
    conflictHeld: "تعارضات معلقة",
    analyticsOverview: "نظرة عامة تحليلية",
    noData: "لا توجد بيانات",
    noQuotaAssigned: "لا توجد حصة مخصصة — تواصل مع مدير الأكاديمية",
    quotaExhausted: "تم استنفاد هذه الحصة",
    eligibleForNextClass: "مؤهل للحصة القادمة",
    notEligibleForNextClass: "غير مؤهل للحصة القادمة",
    expiryWarning: days => {
      if (days === 0) return "تنتهي هذه الحصة اليوم";
      if (days === 1) return "تنتهي هذه الحصة خلال يوم واحد";
      if (days === 2) return "تنتهي هذه الحصة خلال يومين";
      if (days >= 3 && days <= 10) return `تنتهي هذه الحصة خلال ${days} أيام`;
      return `تنتهي هذه الحصة خلال ${days} يوماً`;
    },
    remainingOfTotal: (remaining, total) => `${remaining} / ${total}`,
    validPeriod: "فترة الصلاحية",
    recentLedgerEntries: "آخر عمليات السجل",
    noLedgerEntries: "لا توجد عمليات حديثة في السجل",
    loadingData: "جارٍ التحميل…",
    selectChildPrompt: "اختر ابناً لعرض تفاصيل الحصة",
    name: "الاسم",
    kind: "النوع",
    remaining: "المتبقي",
    totalClasses: "الإجمالي",
    status: "الحالة",
    validFrom: "صالح من",
    validUntil: "صالح حتى",
    delta: "التغيير",
    reason: "السبب",
    ledgerDate: "التاريخ",
    createdAt: "تاريخ الإنشاء",
    newQuota: "حصة جديدة",
    editQuota: "تعديل",
    deleteQuota: "حذف",
    statuses: {
      ACTIVE: "نشط",
      EXPIRED: "منتهي",
      ARCHIVED: "مؤرشف",
    },
    kinds: {
      PACKAGE: "باقة",
      PERIODIC: "دوري",
    },
    ledgerReasons: {
      ADJUST: "تعديل",
      EXPIRE: "انتهاء",
      GRANT: "منح",
      REDEEM: "استرداد",
      RELEASE: "إطلاق",
      RESERVE: "حجز",
    },
  },
  quotaCount: count => {
    if (count === 0) return "لا توجد حصص";
    if (count === 1) return "حصة واحدة";
    if (count === 2) return "حصتان";
    if (count >= 3 && count <= 10) return `${count} حصص`;
    return `${count} حصة`;
  },
};
