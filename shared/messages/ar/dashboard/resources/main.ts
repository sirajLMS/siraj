import type { ResourcesLabels } from "../../../types/dashboard/resources";

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
    body: "لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد من حذف {title} نهائياً؟",
    confirm: "نعم",
    cancel: "لا",
  },
  validation: {
    documentNameRequired: "يرجى إدخال اسم المستند.",
    fileRequired: "يرجى اختيار ملف للرفع.",
  },
};
