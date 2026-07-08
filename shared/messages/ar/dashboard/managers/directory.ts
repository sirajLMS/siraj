import type { ManagersDirectoryLabels } from "../../../types/dashboard/managers";

export const managersDirectory: ManagersDirectoryLabels = {
  pageTitle: "دليل المديرين",
  pageSubtitle: "إدارة شاملة للإداريين وموظفي النظام.",
  mobileTitle: "دليل الموظفين",
  metrics: {
    totalAdmin: "إجمالي المديرين",
    systemStaff: "موظفي النظام",
    activeNow: "نشط الآن",
    alerts: "تنبيهات الصلاحيات",
  },
  filters: {
    allRoleTypes: "جميع الأدوار",
    admin: "مدير",
    staff: "موظف",
    statusAll: "الحالة: الكل",
    active: "نشط",
    inactive: "غير نشط",
  },
  table: {
    hash: "#",
    manager: "المدير",
    contactDetails: "بيانات الاتصال",
    phone: "الهاتف",
    roleType: "نوع الدور",
    options: "خيارات",
  },
  fields: {
    phone: "الهاتف",
  },
  actions: {
    addManager: "إضافة مدير جديد",
    options: "خيارات",
    editProfile: "تعديل الملف الشخصي",
    deactivate: "تعطيل",
    activate: "تفعيل",
    cancel: "إلغاء",
    processing: "جاري المعالجة...",
    save: "حفظ",
    deactivateConfirmation: "هل أنت متأكد من أنك تريد تعطيل {name}؟",
    activateConfirmation: "هل أنت متأكد من أنك تريد تفعيل {name}؟",
  },
  status: {
    active: "نشط",
    offline: "غير متصل",
  },
  roles: {
    admin: "مدير",
    staff: "موظف",
  },
  showingOf: "عرض {count} من أصل {total} نتيجة",
  noEntries: "لا يوجد مديرين",
};
