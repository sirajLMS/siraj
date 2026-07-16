import type { CurrencyHedgesLabels } from "@/shared/locale/types/dashboard/billing/currencyHedges";

export const dashboardBillingCurrencyHedgesAr: CurrencyHedgesLabels = {
  pageTitle: "تحوط العملات",
  pageSubtitle: "إدارة مراكز التحوط بالعملات الأجنبية",
  addHedge: "إضافة تحوط",
  editHedge: "تعديل التحوط",
  deleteHedge: "حذف التحوط",
  deleteConfirm: "هل أنت متأكد من حذف هذا التحوط؟",
  cancel: "إلغاء",
  save: "حفظ",
  createSuccess: "تم إنشاء التحوط",
  updateSuccess: "تم تحديث التحوط",
  deleteSuccess: "تم حذف التحوط",
  saveFailed: "تعذر حفظ التحوط",
  empty: "لا توجد سجلات تحوط",
  columns: {
    currency: "العملة",
    amount: "المبلغ",
    hedgeType: "نوع التحوط",
    notes: "ملاحظات",
    updatedAt: "آخر تحديث",
    actions: "إجراءات",
  },
  fields: {
    currency: "العملة",
    amount: "المبلغ",
    hedgeType: "نوع التحوط",
    notes: "ملاحظات",
  },
  hedgeTypes: {
    long: "LONG",
    short: "SHORT",
  },
};
