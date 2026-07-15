import type { BooksAndBagsLabels, ResourcesLabels } from "@/shared/messages/types/dashboard/resources";

export const booksAndBags: BooksAndBagsLabels = {
  pageTitle: "الكتب والحقائب",
  pageSubtitle: "تصفح وإدارة مخزون الكتب والحقائب.",
  noEntries: "لم يتم العثور على كتب أو حقائب.",
  statusAvailable: "متوفر",
  statusOutOfStock: "غير متوفر",
  deleteSuccess: "تم حذف الكتاب بنجاح.",
  deleteFailed: "فشل حذف الكتاب.",
};

export const resources: ResourcesLabels = {
  pageTitle: "موارد التعلم",
  pageSubtitle: "إدارة وتوزيع المواد التعليمية للمعلمين والطلاب.",
  upload: {
    sectionTitle: "رفع مورد جديد",
    documentName: "اسم المستند",
    documentNamePlaceholder: "مثال: دليل الرياضيات المتقدمة",
    dropzoneTitle: "اسحب وأفلت الملف هنا",
    dropzoneHint: "أو تصفح جهازك",
    supportedFormats: "الحد الأقصى لحجم الملف: 25 ميجابايت (PDF, DOCX, PPTX)",
    submit: "رفع",
    successMessage: "تم رفع المورد بنجاح.",
  },
  guidelines: {
    title: "إرشادات الرفع",
    items: [
      "تأكد من أن أسماء الملفات احترافية",
      "تحقق من امتثال المستند لحقوق النشر",
      "سيكون المورد مرئياً لجميع المديرين المعينين",
    ],
  },
  governance: {
    title: "الخصوصية والحوكمة",
    body: "المستندات المرفوعة هنا مرئية للمعلمين فقط. يجب تكوين وصول الطلاب وأولياء الأمور يدوياً عبر تبويب الأذونات.",
  },
  library: {
    title: "مكتبة المستندات",
    filter: "تصفية",
    sortByDate: "التاريخ",
    sortByName: "الاسم",
    typeAll: "النوع: الكل",
    uploaded: "تاريخ الرفع",
    noEntries: "لا توجد موارد مطابقة للتصفية",
  },
  deleteDialog: {
    title: "حذف المورد؟",
    body: (title: string) => `لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد من حذف ${title} نهائياً؟`,
    confirm: "نعم",
    cancel: "لا",
  },
  validation: {
    documentNameRequired: "يرجى إدخال اسم المستند.",
    fileRequired: "يرجى اختيار ملف للرفع.",
  },
  notification: {
    fileTypeNotAllowed: (type: string) => `${type} ليس نوع ملف مسموح به`,
    uploadPrepareFailed: "فشل تحضير الرفع",
    uploadFailed: "فشل رفع الملف. يرجى المحاولة مرة أخرى.",
    createRecordFailed: "فشل إنشاء سجل المورد.",
    uploadRetryFailed: "فشل رفع المورد. يرجى المحاولة مرة أخرى.",
    deleteSuccess: "تم حذف المورد بنجاح.",
    deleteFailed: "فشل حذف المورد.",
  },
};
