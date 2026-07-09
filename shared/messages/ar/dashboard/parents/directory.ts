import type { ParentsDirectoryLabels } from "@/shared/messages/types/dashboard/parents";

export const directory: ParentsDirectoryLabels = {
  pageTitle: "دليل أولياء الأمور",
  pageSubtitle: "إدارة ملفات أولياء الأمور، حالات الاشتراك، والسجلات المالية.",
  searchPlaceholder: "البحث عن أولياء الأمور...",
  records: "سجلات أولياء الأمور",
  metrics: {
    activated: "مفعّل",
    deactivated: "معطّل",
    regular: "عادي",
    onLeave: "في إجازة",
    suspended: "موقوف",
    onTrial: "تجريبي",
  },
  table: {
    index: "#",
    image: "الصورة",
    name: "الاسم",
    email: "البريد الإلكتروني",
    time: "الوقت",
    status: "الحالة",
    unpaidInvoices: "الفواتير غير المدفوعة",
    options: "خيارات",
  },
  card: {
    guardianOf: "ولي أمر {name}",
    unpaidCount: "غير مدفوع: {count}",
    invoicesCleared: "تم تسوية الفواتير",
  },
  actions: {
    addParent: "إضافة ولي أمر جديد",
    filter: "تصفية",
    clearFilters: "مسح التصفية",
  },
  noEntries: "لا يوجد أولياء أمور",
};
