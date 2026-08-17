import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export const quotaAr: QuotaLabels = {
  title: "حصص الطلاب",
  newQuota: "حصة جديدة",
  editQuota: "تعديل الحصة",
  quotaDetails: "تفاصيل الحصة",
  insights: "تحليلات الحصص",
  listTitle: "قائمة الحصص",
  noQuotas: "لم يتم العثور على حصص.",
  fields: {
    name: "اسم الحصة",
    student: "الطالب",
    kind: "نوع الحصة",
    totalClasses: "إجمالي الحصص",
    remaining: "الحصص المتبقية",
    reservedClasses: "الحصص المحجوزة",
    validUntil: "صالحة حتى",
    validFrom: "صالحة من",
    status: "الحالة",
    periodType: "نوع الفترة",
    priority: "الأولوية",
    all: "الكل",
    studentIdPlaceholder: "معرف الطالب",
    periodDays: "أيام الفترة",
    periodDaysHelperText: "عدد أيام الفترة المخصصة",
    periodDaysRequired: "أيام الفترة مطلوبة عندما يكون نوع الفترة مخصص",
    validUntilAfterValidFrom: "يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء",
    studentPickerPlaceholder: "اختر طالباً",
    studentPickerNoOptions: "لم يتم العثور على طلاب",
    studentPickerLoading: "جاري تحميل الطلاب...",
  },
  kinds: {
    PACKAGE: "باقة",
    PERIODIC: "دورية",
  },
  statuses: {
    ACTIVE: "نشطة",
    EXPIRED: "منتهية",
    ARCHIVED: "مؤرشفة",
    PENDING: "قيد الانتظار",
  },
  periodTypes: {
    WEEKLY: "أسبوعية",
    MONTHLY: "شهرية",
    CUSTOM: "مخصصة",
  },
  actions: {
    create: "إنشاء حصة",
    save: "حفظ التغييرات",
    edit: "تعديل الحصة",
    delete: "حذف الحصة",
    cancel: "إلغاء",
    viewLedger: "عرض سجل التدقيق",
    view: "عرض",
    filter: "تصفية",
    addQuota: "إضافة حصة",
    exportCsv: "تصدير CSV",
  },
  deleteConfirm: {
    title: "حذف الحصة",
    body: studentName => `هل أنت متأكد من حذف حصة ${studentName}؟`,
    cancel: "إلغاء",
    confirm: "حذف",
  },
  errors: {
    createFailed: "فشل في إنشاء الحصة. يرجى المحاولة مرة أخرى.",
    updateFailed: "فشل في تحديث الحصة. يرجى المحاولة مرة أخرى.",
    deleteFailed: "فشل في حذف الحصة",
    loadFailed: "فشل في تحميل بيانات الحصة. يرجى المحاولة مرة أخرى.",
  },
  ledger: {
    title: "سجل تدقيق الحصة",
    reason: "السبب",
    delta: "تغيير الحصص",
    note: "ملاحظات",
    date: "التاريخ",
  },
  insightsTitle: "نظرة عامة على نظام الحصص",
  activeQuotasCount: count => {
    if (count === 0) return "لا توجد حصص نشطة";
    if (count === 1) return "حصة نشطة واحدة";
    if (count === 2) return "حصتان نشطتان";
    if (count >= 3 && count <= 10) return `${count} حصص نشطة`;
    return `${count} حصة نشطة`;
  },
  totalClassesRemaining: count => {
    if (count === 0) return "لا توجد حصص متبقية";
    if (count === 1) return "حصة متبقية واحدة";
    if (count === 2) return "حصتان متبقيتان";
    if (count >= 3 && count <= 10) return `${count} حصص متبقية`;
    return `${count} حصة متبقية`;
  },
  expiringThisWeekCount: count => {
    if (count === 0) return "لا توجد حصص تنتهي هذا الأسبوع";
    if (count === 1) return "حصة واحدة تنتهي هذا الأسبوع";
    if (count === 2) return "حصتان تنتهيان هذا الأسبوع";
    if (count >= 3 && count <= 10) return `${count} حصص تنتهي هذا الأسبوع`;
    return `${count} حصة تنتهي هذا الأسبوع`;
  },
  quotaCount: count => {
    if (count === 0) return "لا توجد حصص";
    if (count === 1) return "حصة واحدة";
    if (count === 2) return "حصتان";
    if (count >= 3 && count <= 10) return `${count} حصص`;
    return `${count} حصة`;
  },
  ledgerCount: count => {
    if (count === 0) return "لا توجد إدخالات سجل";
    if (count === 1) return "إدخال سجل واحد";
    if (count === 2) return "إدخالا سجل";
    if (count >= 3 && count <= 10) return `${count} إدخالات سجل`;
    return `${count} إدخال سجل`;
  },
  deleteSuccess: "تم حذف الحصة بنجاح",
  notFoundTitle: "لم يتم العثور على الحصة",
  notFoundMessage: "الحصة التي تبحث عنها غير موجودة.",
  notFoundBackButton: "العودة إلى الحصص",
  errorGenericTitle: "حدث خطأ ما",
  errorGeneric: "حدث خطأ غير متوقع أثناء تحميل صفحة الحصة. يرجى المحاولة مرة أخرى.",
  retry: "إعادة المحاولة",
  restrictedAccessHelperText: "تحتاج إلى صلاحيات إدارة الحصص لتعديل هذا الحقل.",
  emptyListMessage: "لم يتم العثور على حصص. أنشئ واحدة للبدء.",
  emptyListCta: "إنشاء حصة",
  insightsDateRangeLabel: "النطاق الزمني",
  insightsKindLabel: "النوع",
  insightsStatusLabel: "الحالة",
  insightsStudentLabel: "الطالب",
  exportSuccess: "اكتمل التصدير",
  emptyInsightsMessage: "لا توجد بيانات تحليلات للفلاتر المحددة.",
  charts: {
    quotaPurchasesOverTime: "مشتريات الحصص عبر الزمن",
    redemptionRateByType: "معدل الاسترداد حسب النوع",
    packageDeliveryRate: "معدل تسليم حصص الباقات",
    pendingCreditBacklogGauge: "تراكم الرصيد المعلق",
    expiredSlippage: "انزلاق الحصص المنتهية",
    months: "الأشهر",
    classes: "حصص",
    packageType: "باقة",
    periodicType: "دورية",
    committed: "ملتزم بها",
    cancelled: "ملغاة",
    deliveryRate: "معدل التسليم",
    pendingCredits: "الرصيد المعلق",
    expiredClasses: "منتهية",
    redeemedClasses: "مستردة",
  },
};
