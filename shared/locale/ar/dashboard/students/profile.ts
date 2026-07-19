import type { StudentProfileLabels } from "@/shared/locale/types/dashboard/students";

export const dashboardStudentProfileAr: StudentProfileLabels = {
  title: "ملف الطالب",
  subtitle: "عرض وإدارة معلومات الطالب",
  restrictedIdentity: id => `الطالب ${id}`,
  restrictedIdentityGeneric: "ملف الطالب",
  loading: "جارٍ تحميل ملف الطالب...",
  notFoundTitle: "الطالب غير موجود",
  notFoundDescription: "تعذّر العثور على هذا الطالب. ربما تمت إزالته أو لا تملك صلاحية الوصول إليه.",
  tabs: {
    status: "الحالة",
    classes: "الحصص القادمة",
    quota: "الحصص",
    history: "السجل",
  },
};
