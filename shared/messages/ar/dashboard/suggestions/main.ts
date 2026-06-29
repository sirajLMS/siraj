import type { SuggestionsLabels } from "../../../types/dashboard/suggestions";

export const suggestions: SuggestionsLabels = {
  parent: {
    pageTitle: "بوابة ملاحظات أولياء الأمور",
    heroTitle: "بوابة ملاحظات أولياء الأمور",
    heroSubtitle:
      "يسعدنا معرفة اقتراحاتكم حول أساليب التدريس وتطوير برامجنا. تساعدنا ملاحظاتكم في تحسين الرحلة التعليمية لأبنائكم.",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "أدخل اسمك الكامل",
    suggestion: "اقتراحك",
    suggestionPlaceholder: "أخبرنا كيف يمكننا التحسين...",
    submit: "إرسال",
    successMessage: "لقد استلمنا رسالتك",
    socialProof: "يراجعها فريق الإدارة يومياً",
    support: {
      privacy: {
        title: "خصوصية مضمونة",
        body: "ملاحظاتك سرية تماماً ولا تُشارك إلا مع فريق التطوير الأساسي.",
      },
      fastResponse: {
        title: "استجابة سريعة",
        body: "نراجع ونؤكد استلام اقتراحات أولياء الأمور خلال 48 ساعة عمل عادةً.",
      },
      constantEvolution: {
        title: "تطور مستمر",
        body: "أكثر من 40% من ميزاتنا الجديدة تنبع مباشرة من ملاحظات أولياء الأمور.",
      },
    },
    validation: {
      fullNameRequired: "يرجى إدخال اسمك الكامل.",
      suggestionRequired: "يرجى إدخال اقتراح لا يقل عن 10 أحرف.",
    },
    notifications: {
      submitSuccess: "تم إرسال اقتراحك بنجاح!",
      submitError: "فشل إرسال الاقتراح. يرجى المحاولة مرة أخرى.",
    },
  },
  admin: {
    pageTitle: "إدارة الاقتراحات",
    pageSubtitle: "مراجعة وتأكيد ملاحظات أولياء الأمور الواردة.",
    metrics: {
      pending: "معلقة",
      reviewed: "تمت المراجعة",
      duplicate: "مكررة",
      avgResponse: "متوسط وقت الاستجابة",
      efficiencyNote: "تحسن الكفاءة 12%",
    },
    tabs: {
      pending: "معلقة",
      reviewed: "تمت المراجعة",
      duplicate: "مكررة",
    },
    searchPlaceholder: "البحث في الاقتراحات...",
    table: {
      parentName: "ولي الأمر",
      suggestion: "الاقتراح",
      submittedAt: "تاريخ الإرسال",
      status: "الحالة",
      actions: "إجراءات",
      markReviewed: "تحديد كمراجَع",
      respond: "الرد",
      markDuplicate: "تحديد كمكرر",
      delete: "حذف",
      noEntries: "لا توجد اقتراحات مطابقة للبحث",
    },
    statusLabels: {
      pending: "معلقة",
      reviewed: "تمت المراجعة",
      duplicate: "مكررة",
    },
    notifications: {
      markReviewedSuccess: "تم تحديد الاقتراح كمراجَع.",
      markReviewedError: "فشل تحديد الاقتراح كمراجَع.",
      respondSuccess: "تم إرسال الرد بنجاح.",
      respondError: "فشل إرسال الرد.",
      markDuplicateSuccess: "تم تحديد الاقتراح كمكرر.",
      markDuplicateError: "فشل تحديد الاقتراح كمكرر.",
      deleteSuccess: "تم حذف الاقتراح بنجاح.",
      deleteError: "فشل حذف الاقتراح.",
    },
    dialogs: {
      deleteConfirmTitle: "حذف الاقتراح",
      deleteConfirmBody: "هل أنت متأكد أنك تريد حذف هذا الاقتراح؟ لا يمكن التراجع عن هذا الإجراء.",
      deleteConfirmAction: "حذف",
      cancel: "إلغاء",
      respondTitle: "الرد على الاقتراح",
      respondPlaceholder: "اكتب ردك...",
      respondAction: "إرسال الرد",
      duplicateTitle: "تحديد كمكرر",
      duplicateSearchPlaceholder: "ابحث عن الاقتراح الأصلي...",
      duplicateAction: "تحديد كمكرر",
      duplicateNoneFound: "لم يتم العثور على اقتراحات.",
    },
  },
};
