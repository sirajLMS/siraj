import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

export const dashboardAccountingCarryoverAr: CarryoverLabels = {
  title: "أرصدة الترحيل",
  pageSubtitle: "تسوية مستحقات المعلمين المجمّعة وتحويلها إلى مصروفات.",
  empty: "لا توجد سجلات ترحيل مطابقة للمرشحات الحالية.",
  emptyStateHeading: "لا توجد أرصدة ترحيل",
  emptyStateHint: "جرّب تغيير معايير التصفية أو أضف سجلاً جديداً يدوياً.",
  loadError: "فشل تحميل أرصدة الترحيل. حاول مرة أخرى.",
  exportTruncated: "تم اقتطاع التصدير إلى 10 000 صف.",
  exportFailed: "فشل تصدير CSV. حاول مرة أخرى.",
  selectedCount: count => {
    if (count === 0) return "لم يتم تحديد أي عنصر";
    if (count === 1) return "عنصر محدد واحد";
    if (count === 2) return "عنصران محددان";
    if (count >= 3 && count <= 10) return `${count} عناصر محددة`;
    return `${count} عنصراً محدداً`;
  },

  column: {
    teacher: "المعلم",
    studentsCount: "الطلاب",
    studentsText: "قائمة الطلاب",
    totalDuration: "المدة (س)",
    payable: "المستحق",
    paid: "المدفوع",
    fromDate: "من",
    toDate: "إلى",
    paymentDate: "تاريخ الدفع",
  },

  chip: {
    paid: "مدفوع",
    unpaid: "غير مدفوع",
    disabledTeacher: "موقوف",
  },

  action: {
    addNew: "إضافة جديد",
    edit: "تعديل",
    delete: "حذف",
    bulkToExpense: "تحويل إلى مصروفات",
    bulkDelete: "حذف جماعي",
    unpay: "إلغاء الدفع",
    viewSessions: "عرض الجلسات",
    exportCsv: "تصدير CSV",
  },

  filters: {
    teacher: "المعلم",
    teacherPlaceholder: "اختر معلماً",
    paidStatus: "حالة الدفع",
    paid: "مدفوع",
    unpaid: "غير مدفوع",
    both: "الكل",
    dateRange: "نطاق التاريخ",
    fromDate: "من",
    toDate: "إلى",
    includeDisabledTeachers: "تضمين المعلمين الموقوفين",
    searchPlaceholder: "ابحث في الملاحظات أو الطلاب",
    clear: "مسح",
  },

  modal: {
    bulkToExpense: {
      title: "التحويل إلى مصروفات",
      paymentDate: "تاريخ الدفع",
      expenseDate: "شهر المصروف",
      note: "ملاحظة (اختياري)",
      notePlaceholder: "ملاحظة داخلية (بحد أقصى 2,000 حرف)",
      summary: (count, amount, currency) => {
        if (count === 1) return `رصيد واحد بإجمالي ${amount} ${currency}`;
        if (count === 2) return `رصيدان بإجمالي ${amount} ${currency}`;
        if (count >= 3 && count <= 10) return `${count} أرصدة بإجمالي ${amount} ${currency}`;
        return `${count} رصيداً بإجمالي ${amount} ${currency}`;
      },
      convertConsequenceWarning: "سيتم إنشاء صف مصروف لكل رصيد ترحيل ووضعها كمدفوعة. ستصبح الجلسات المرتبطة مدفوعة.",
      convertFillRequiredHint: "املأ الحقول المطلوبة أعلاه للتحويل.",
      submit: "تحويل",
      cancel: "إلغاء",
    },
    bulkCreate: {
      groupedSummary: (sessions, balances) => {
        let sessionPart: string;
        if (sessions === 1) {
          sessionPart = "جلسة مدققة واحدة";
        } else if (sessions === 2) {
          sessionPart = "جلستان مدقتان";
        } else if (sessions >= 3 && sessions <= 10) {
          sessionPart = `${sessions} جلسات مدققة`;
        } else {
          sessionPart = `${sessions} جلسة مدققة`;
        }
        let balancePart: string;
        if (balances === 1) {
          balancePart = "رصيد ترحيل واحد";
        } else if (balances === 2) {
          balancePart = "رصيدَي ترحيل";
        } else if (balances >= 3 && balances <= 10) {
          balancePart = `${balances} أرصدة ترحيل`;
        } else {
          balancePart = `${balances} رصيد ترحيل`;
        }
        return `سيتم تجميع ${sessionPart} في ${balancePart}.`;
      },
      groupedConsequence: "ستنتقل الجلسات إلى حالة بانتظار الدفع.",
    },
    form: {
      titleAdd: "إضافة رصيد ترحيل",
      titleEdit: "تعديل رصيد الترحيل",
      teacher: "المعلم",
      teacherPlaceholder: "اختر معلماً",
      teacherLockedHint: "لا يمكن تغيير المعلم؛ احذف السجل وأعد إنشاءه بدلاً من ذلك.",
      fromDate: "من",
      toDate: "إلى",
      payable: "المستحق",
      currency: "العملة",
      studentsCount: "الطلاب",
      studentsText: "قائمة الطلاب",
      studentsAutoFilledHelper: "تمت تعبئته تلقائياً من الجلسات",
      note: "ملاحظة",
      notePlaceholder: "ملاحظة اختيارية (بحد أقصى 2,000 حرف)",
      submit: "حفظ",
      cancel: "إلغاء",
    },
    delete: {
      title: "حذف رصيد الترحيل؟",
      linkedSessionsWarning: count => {
        if (count === 1) {
          return "هذا الرصيد مرتبط بجلسة واحدة. حذفه يفصلها ويعيد حالة التدقيق السابقة لها.";
        }
        if (count === 2) {
          return "هذا الرصيد مرتبط بجلستين. حذفه يفصلهما ويعيد حالة التدقيق السابقة لهما.";
        }
        if (count >= 3 && count <= 10) {
          return `هذا الرصيد مرتبط بـ${count} جلسات. حذفه يفصلها ويعيد حالة التدقيق السابقة لها.`;
        }
        return `هذا الرصيد مرتبط بـ${count} جلسة. حذفه يفصلها ويعيد حالة التدقيق السابقة لها.`;
      },
      confirm: "حذف",
      cancel: "إلغاء",
    },
    unpay: {
      title: "إلغاء دفع رصيد الترحيل؟",
      warning: "سيتم حذف المصروف المرتبط (حذف ناعم) وستعود الجلسات المرتبطة إلى حالة بانتظار الدفع.",
      expenseLabel: "المصروف",
      note: "سبب التصحيح (اختياري)",
      notePlaceholder: "اشرح سبب إلغاء دفع هذا الرصيد (بحد أقصى 2,000 حرف)",
      confirm: "إلغاء الدفع",
      cancel: "إلغاء",
    },
  },

  drawer: {
    title: teacherName => `رصيد الترحيل — ${teacherName}`,
    sessionsHeading: count => {
      if (count === 0) return "لا توجد جلسات مرتبطة";
      if (count === 1) return "جلسة مرتبطة واحدة";
      if (count === 2) return "جلستان مرتبطتان";
      if (count >= 3 && count <= 10) return `${count} جلسات مرتبطة`;
      return `${count} جلسة مرتبطة`;
    },
    noSessions: "لا توجد جلسات مرتبطة بهذا الرصيد.",
    sessionDate: "التاريخ",
    student: "الطالب",
    subject: "المادة",
    duration: "المدة (س)",
    amount: "المبلغ",
    status: "الحالة",
  },

  validation: {
    teacherRequired: "اختر معلماً.",
    dateRangeInvalid: "يجب ألا يتجاوز تاريخ البدء تاريخ الانتهاء.",
    payableNegative: "يجب أن يكون المستحق 0 أو أكثر.",
    currencyRequired: "العملة مطلوبة.",
    noteTooLong: "يجب ألا تتجاوز الملاحظة 2,000 حرف.",
  },

  error: {
    alreadyPaid: "واحد أو أكثر من الأرصدة مدفوعة بالفعل.",
  },

  success: {
    created: "تم إنشاء رصيد الترحيل.",
    updated: "تم تحديث رصيد الترحيل.",
    deleted: "تم حذف رصيد الترحيل.",
    bulkCreated: count => {
      if (count === 0) return "لم يتم إنشاء أي رصيد ترحيل.";
      if (count === 1) return "تم إنشاء رصيد ترحيل واحد.";
      if (count === 2) return "تم إنشاء رصيدَي ترحيل.";
      if (count >= 3 && count <= 10) return `تم إنشاء ${count} أرصدة ترحيل.`;
      return `تم إنشاء ${count} رصيد ترحيل.`;
    },
    bulkDeleted: count => {
      if (count === 0) return "لم يتم حذف أي رصيد ترحيل.";
      if (count === 1) return "تم حذف رصيد ترحيل واحد.";
      if (count === 2) return "تم حذف رصيدَي ترحيل.";
      if (count >= 3 && count <= 10) return `تم حذف ${count} أرصدة ترحيل.`;
      return `تم حذف ${count} رصيد ترحيل.`;
    },
    bulkedToExpense: count => {
      if (count === 0) return "لم يتم إنشاء أي مصروف.";
      if (count === 1) return "تم إنشاء مصروف واحد.";
      if (count === 2) return "تم إنشاء مصروفين.";
      if (count >= 3 && count <= 10) return `تم إنشاء ${count} مصروفات.`;
      return `تم إنشاء ${count} مصروفاً.`;
    },
    unpaid: "تم إلغاء دفع الرصيد؛ تمت استعادة الجلسات.",
  },

  aggregate: {
    totalPayable: "إجمالي المستحق",
    totalPaid: "إجمالي المدفوع",
    recordsCount: count => {
      if (count === 0) return "لا توجد سجلات";
      if (count === 1) return "سجل واحد";
      if (count === 2) return "سجلان";
      if (count >= 3 && count <= 10) return `${count} سجلات`;
      return `${count} سجلاً`;
    },
    paidCount: count => {
      if (count === 0) return "لا توجد أرصدة مدفوعة";
      if (count === 1) return "رصيد مدفوع واحد";
      if (count === 2) return "رصيدان مدفوعان";
      if (count >= 3 && count <= 10) return `${count} أرصدة مدفوعة`;
      return `${count} رصيداً مدفوعاً`;
    },
    unpaidCount: count => {
      if (count === 0) return "لا توجد أرصدة غير مدفوعة";
      if (count === 1) return "رصيد غير مدفوع واحد";
      if (count === 2) return "رصيدان غير مدفوعان";
      if (count >= 3 && count <= 10) return `${count} أرصدة غير مدفوعة`;
      return `${count} رصيداً غير مدفوعاً`;
    },
  },
};
