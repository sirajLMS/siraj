import type { TeacherOwnProfileLabels } from "../../../types/dashboard/teachers/own-profile";

export const ownProfile: TeacherOwnProfileLabels = {
  pageTitle: "تفاصيل الراتب",
  pageSubtitle: "اعرض ملفك الرسمي وتفاصيل التعويض.",
  notSet: "غير محدد",
  sections: {
    contact: "معلومات الاتصال",
    salary: "تفاصيل الراتب",
  },
  baseSalary: "الراتب الأساسي: {amount} {currency}",
  paymentMethod: "طريقة الدفع: {method}",
  errors: {
    failedToLoad: "فشل تحميل ملفك الشخصي.",
  },
};
