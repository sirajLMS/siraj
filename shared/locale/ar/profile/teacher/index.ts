import type { ProfileTeacherLabels } from "@/shared/locale/types/profile";

export const profileTeacherAr: ProfileTeacherLabels = {
  ownSubtitle: "عرض وتحديث ملفك التدريسي وبيانات الاتصال.",
  subtitle: "إدارة بيانات الاعتماد المؤسسية والتفاصيل الإدارية لأعضاء هيئة التدريس.",
  adminBanner: "عرض إداري: تظهر حقول الهوية وبيانات زووم والحالة.",
  sections: {
    account: "الحساب",
    contact: "معلومات الاتصال",
    zoom: "زووم",
    compensation: "التعويضات",
    identity: "الهوية",
    professional: "المؤهلات المهنية",
    stats: "الإحصائيات",
    adminOnly: "تفاصيل إدارية",
  },
  baseSalary: (amount, currency) => `${amount} ${currency}`,
  paymentMethod: method => method,
  convertedAmount: (lockedAmount, lockedCurrency, convertedApprox, displayCurrency) =>
    `${lockedAmount} ${lockedCurrency} (تقريباً ${convertedApprox} ${displayCurrency})`,
  stats: {
    totalClasses: "إجمالي الحصص",
    avgEngagement: "متوسط التفاعل",
  },
  fields: {
    fullName: "الاسم الكامل",
    primaryEmail: "البريد الإلكتروني الأساسي",
    phone: "رقم الهاتف",
    address: "العنوان السكني",
    timezone: "المنطقة الزمنية",
    nationalId: "رقم الهوية",
    dateOfBirth: "تاريخ الميلاد",
    gender: "الجنس",
    qualifications: "المؤهلات",
    hourlyRate: "الأجر بالساعة",
    currency: "العملة",
    paymentMethod: "طريقة الدفع",
    status: "حالة الحساب",
    displayCurrency: "عملة العرض",
  },
  gender: {
    male: "ذكر",
    female: "أنثى",
  },
  status: {
    activated: "مفعّل",
    deactivated: "غير مفعّل",
  },
  shell: {
    tabs: {
      profile: "الملف الشخصي",
      paymentMethods: "طرق الدفع",
      meeting: "إعدادات الاجتماع",
      students: "الطلاب",
      notifications: "الإشعارات",
      permissions: "الصلاحيات",
    },
    loading: "جارٍ تحميل الملف الشخصي...",
    error: {
      retry: "أعد المحاولة",
    },
  },
  actions: {
    edit: "تعديل الملف الشخصي",
    save: "حفظ التغييرات",
    cancel: "إلغاء",
    retry: "إعادة المحاولة",
  },
  errors: {
    failedToLoad: "Failed to load profile.",
    notFound: "Profile not found.",
  },
};
