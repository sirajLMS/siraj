import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

export const dashboardAccountingExpensesAr: ExpensesLabels = {
  title: "سجل المصروفات",
  empty: "لا توجد مصروفات مطابقة للمرشحات الحالية.",
  loadError: "فشل تحميل المصروفات. حاول مرة أخرى.",
  exportFailed: "فشل تصدير CSV. حاول مرة أخرى.",
  exportTruncated: "تم اقتطاع التصدير إلى 10 000 صف.",
  selectedCount: count => {
    if (count === 0) return "لم يتم تحديد أي عنصر";
    if (count === 1) return "عنصر محدد واحد";
    if (count === 2) return "عنصران محددان";
    if (count >= 3 && count <= 10) return `${count} عناصر محددة`;
    return `${count} عنصراً محدداً`;
  },
  deletedBadge: "محذوف",

  column: {
    title: "العنوان",
    type: "النوع",
    teacher: "المعلم",
    value: "القيمة",
    paymentDate: "تاريخ الدفع",
    expenseDate: "شهر المصروف",
    source: "المصدر",
    note: "ملاحظة",
    createdAt: "أُنشئ في",
    actions: "إجراءات",
    rowActions: title => `إجراءات "${title}"`,
  },

  type: {
    Salaries: "الرواتب",
    Marketing: "التسويق",
    Logistics: "اللوجستيات",
    Technology: "التقنية",
  },

  source: {
    Manual: "يدوي",
    FromCarryover: "من الترحيل",
  },

  action: {
    addNew: "إضافة جديد",
    edit: "تعديل",
    delete: "حذف",
    bulkDelete: "حذف جماعي",
    viewSource: "عرض المصدر",
    exportCsv: "تصدير CSV",
  },

  filters: {
    title: "العنوان",
    searchPlaceholder: "ابحث في العناوين",
    type: "النوع",
    expenseDate: "شهر المصروف",
    paymentDateFrom: "تاريخ الدفع من",
    paymentDateTo: "تاريخ الدفع إلى",
    paymentDateRange: "نطاق تاريخ الدفع",
    includeDeleted: "تضمين المحذوفة",
    clear: "مسح",
  },

  modal: {
    form: {
      titleAdd: "إضافة مصروف",
      titleEdit: "تعديل المصروف",
      title: "العنوان",
      type: "النوع",
      teacher: "المعلم (اختياري)",
      value: "القيمة",
      currency: "العملة",
      paymentDate: "تاريخ الدفع",
      expenseDate: "شهر المصروف",
      note: "ملاحظة",
      salariesHint: "تُنشأ مصروفات الرواتب تلقائياً عبر تدفق تسوية الترحيل.",
      sourceBanner: source => `سيُسجَّل هذا المصروف بمصدر: ${source}.`,
      submit: "حفظ",
      cancel: "إلغاء",
    },
    delete: {
      title: "حذف هذا المصروف؟",
      summary: (title, value, currency) => `حذف "${title}" (${value} ${currency})؟`,
      reason: "السبب (اختياري)",
      reasonPlaceholder: "اشرح سبب حذف هذا المصروف (بحد أقصى 500 حرف)",
      confirm: "حذف",
      cancel: "إلغاء",
    },
    bulkDelete: {
      title: count => {
        if (count === 0) return "لم يتم اختيار أي مصروف للحذف";
        if (count === 1) return "حذف مصروف واحد؟";
        if (count === 2) return "حذف مصروفين؟";
        if (count >= 3 && count <= 10) return `حذف ${count} مصروفات؟`;
        return `حذف ${count} مصروفاً؟`;
      },
      confirm: "حذف",
      cancel: "إلغاء",
    },
  },

  validation: {
    titleRequired: "العنوان مطلوب.",
    titleTooLong: "يجب ألا يتجاوز العنوان 200 حرف.",
    typeRequired: "النوع مطلوب.",
    valueRequired: "القيمة مطلوبة.",
    currencyRequired: "العملة مطلوبة.",
    valueNegative: "لا يمكن أن تكون القيمة سالبة.",
    valueInvalid: "أدخل مبلغاً صالحاً بحد أقصى 12 رقماً وخانتين عشريتين.",
    expenseDateInvalid: "يجب أن يكون شهر المصروف بصيغة YYYY-MM.",
    paymentDateInvalid: "يجب أن يكون تاريخ الدفع تاريخاً صالحاً.",
    noteTooLong: "يجب ألا تتجاوز الملاحظة 2,000 حرف.",
  },

  error: {
    notFound: "المصروف غير موجود.",
    alreadyDeleted: "المصروف محذوف بالفعل.",
    deleteViaUnpay: "يجب حذف مصروف الراتب هذا عبر تدفق (إلغاء دفع الترحيل).",
    typeImmutableForSalaries: "النوع للقراءة فقط لمصروفات الرواتب.",
    valueImmutableForSalaries: "القيمة للقراءة فقط لمصروفات الرواتب.",
  },

  success: {
    created: "تم إنشاء المصروف.",
    updated: "تم تحديث المصروف.",
    deleted: "تم حذف المصروف.",
    bulkDeleted: count => {
      if (count === 0) return "لم يتم حذف أي مصروف.";
      if (count === 1) return "تم حذف مصروف واحد.";
      if (count === 2) return "تم حذف مصروفين.";
      if (count >= 3 && count <= 10) return `تم حذف ${count} مصروفات.`;
      return `تم حذف ${count} مصروفاً.`;
    },
  },

  drawer: {
    title: title => `مصروف — ${title}`,
    createdBy: "أُنشئ بواسطة",
    updatedAt: "آخر تحديث",
    deletedBanner: "تم حذف هذا المصروف.",
    deletedAt: "حُذف في",
    deletionReason: "سبب الحذف",
  },

  aggregate: {
    totalValue: "إجمالي القيمة",
    rowCount: "الصفوف",
  },
};
