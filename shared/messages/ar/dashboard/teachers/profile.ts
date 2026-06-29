import type { TeacherProfileLabels } from "../../../types/dashboard/teachers";

export const profile: TeacherProfileLabels = {
  pageTitle: "تعديل الملف الشخصي للمعلم",
  pageSubtitle: "إدارة البيانات المؤسسية والتفاصيل الإدارية لأعضاء هيئة التدريس.",
  breadcrumbs: {
    teachers: "المعلمون",
    editProfile: "تعديل الملف الشخصي",
  },
  sections: {
    teacherInfo: "معلومات المعلم",
    salaryDetails: "تفاصيل الراتب",
    systemConfig: "إعدادات النظام",
  },
  fields: {
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
    timezone: "المنطقة الزمنية",
    address: "العنوان السكني",
    baseSalary: "الراتب الأساسي",
    currency: "العملة",
    paymentMethod: "طريقة الدفع",
    zoomLink: "رابط زووم الشخصي",
    zoomLinkTooltip: "رابط الاجتماع القياسي للفصول الافتراضية",
    accountStatus: "حالة الحساب",
    accountStatusDesc: "منح حق الوصول إلى الأنظمة الداخلية",
    active: "نشط",
    inactive: "غير نشط",
  },
  actions: {
    saveProfile: "حفظ الملف الشخصي",
    discardChanges: "تجاهل التغييرات",
    lastModified: "آخر تعديل: {date}",
    saveSuccess: "تم حفظ الملف الشخصي بنجاح",
    saveError: "فشل حفظ الملف الشخصي",
  },
  stats: {
    totalClasses: "إجمالي الحصص المقدمة",
    avgEngagement: "متوسط درجة التفاعل",
  },
  validation: {
    nameRequired: "الاسم الكامل مطلوب",
    emailRequired: "البريد الإلكتروني مطلوب",
    emailInvalid: "بريد إلكتروني غير صالح",
    timezoneRequired: "المنطقة الزمنية مطلوبة",
  },
};
