import type { TeacherOwnProfileLabels } from "@/shared/locale/types/dashboard/teachers";

export const dashboardTeacherOwnProfileAr: TeacherOwnProfileLabels = {
  pageTitle: "الملف الشخصي",
  pageSubtitle: "إدارة معلوماتك",
  notSet: "غير محدد",
  fields: {
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
  },
  sections: {
    contact: "معلومات الاتصال",
    salary: "تفاصيل الراتب",
  },
  baseSalary: (amount, currency) => `الراتب الأساسي: ${amount} ${currency}`,
  paymentMethod: method => `طريقة الدفع: ${method}`,
  errors: {
    failedToLoad: "فشل تحميل الملف الشخصي.",
  },
};
