import type { ParentsDirectoryLabels } from "@/shared/locale/types/dashboard/parents";

export const directory: ParentsDirectoryLabels = {
  pageTitle: "دليل أولياء الأمور",
  pageSubtitle: "إدارة ملفات أولياء الأمور، حالات الاشتراك، والسجلات المالية.",
  searchPlaceholder: "البحث عن أولياء الأمور...",
  records: "سجلات أولياء الأمور",
  metrics: {
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
    status: "دورة الحياة",
    accountStatus: "الحساب",
    unpaidInvoices: "الفواتير غير المدفوعة",
    options: "خيارات",
  },
  card: {
    guardianOf: name => `ولي أمر ${name}`,
    unpaidCount: count => `غير مدفوع: ${count}`,
    invoicesCleared: "تم تسوية الفواتير",
  },
  accountStatus: {
    activated: "مفعّل",
    deactivated: "غير مفعّل",
  },
  actions: {
    addParent: "إضافة ولي أمر جديد",
    filter: "تصفية",
    clearFilters: "مسح التصفية",
    manageLifecycle: "إدارة دورة الحياة",
  },
  noEntries: "لا يوجد أولياء أمور",
};
