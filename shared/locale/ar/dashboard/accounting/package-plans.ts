import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

export const dashboardAccountingPackagePlansAr: PackagePlansLabels = {
  pageTitle: "الباقات",
  pageSubtitle: "باقات ساعات معتمدة محددة مسبقاً تملأ نموذج إضافة الدفعة تلقائياً.",
  createPlan: "إنشاء باقة",
  createTitle: "إنشاء باقة",
  editTitle: "تعديل الباقة",

  columns: {
    codename: "الاسم المميز",
    displayName: "الاسم المعروض",
    creditHours: "الساعات المعتمدة",
    price: "السعر",
    currency: "العملة",
    active: "نشطة",
    sortOrder: "ترتيب العرض",
    actions: "الإجراءات",
  },

  form: {
    codename: "الاسم المميز",
    codenamePlaceholder: "مثال: PLAN_A_4HRS",
    codenameHelp: "رمز فريد يظهر في سجلات المدفوعات.",
    displayName: "الاسم المعروض",
    description: "الوصف",
    creditHours: "الساعات المعتمدة",
    priceAmount: "السعر",
    currency: "العملة",
    active: "نشطة",
    activeHelp: "الباقات غير النشطة تختفي من قائمة إضافة الدفعة مع الاحتفاظ بسجلها.",
    sortOrder: "ترتيب العرض",
    submit: "حفظ الباقة",
    cancel: "إلغاء",
    saving: "جارٍ الحفظ…",
  },

  archiveTitle: "أرشفة الباقة",
  archiveBody: name => `أرشفة "${name}"؟ المدفوعات السابقة تحتفظ بلقختها، لكن الباقة تختفي من نماذج الدفع الجديدة.`,
  archiveConfirm: "أرشفة",
  archived: "مؤرشفة",
  empty: "لا توجد باقات بعد. أنشئ أول باقة لتفعيل الدفع بالباقات.",
  loadError: "فشل تحميل الباقات. حاول مرة أخرى.",
  saveSuccess: "تم حفظ الباقة بنجاح.",
  saveError: "فشل حفظ الباقة. راجع البيانات وحاول مرة أخرى.",
  archiveSuccess: "تمت أرشفة الباقة.",
  hoursUnit: hours => `${hours} ساعة`,
};
