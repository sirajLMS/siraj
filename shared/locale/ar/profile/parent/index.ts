import type { ProfileParentLabels } from "@/shared/locale/types/old/profile.ts";

export const profileParentAr: ProfileParentLabels = {
  ownSubtitle: "عرض وتحديث بيانات الاتصال والتواصل الخاصة بك.",
  subtitle: "إدارة بيانات الاتصال والتواصل لولي الأمر الأساسي للطالب.",
  adminBanner: "عرض إداري: تظهر حقول الهوية والفوترة.",
  convertedAmount: (lockedAmount, lockedCurrency, convertedApprox, displayCurrency) =>
    `${lockedAmount} ${lockedCurrency} (تقريباً ${convertedApprox} ${displayCurrency})`,
  sections: {
    account: "الحساب",
    contact: "Contact Information",
    social: "Social & Communication",
    identity: "الهوية",
    billing: "الفوترة",
    students: "الطلاب المرتبطون",
  },
  fields: {
    fullName: "الاسم الكامل",
    primaryEmail: "البريد الإلكتروني الأساسي",
    phone: "Phone",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    twitter: "Twitter",
    nationality: "الجنسية",
    address: "العنوان السكني",
    invoiceType: "نوع الفاتورة",
    feeAmount: "قيمة الرسوم الأساسية",
    paymentMethod: "طريقة الدفع الافتراضية",
    currency: "العملة",
    displayCurrency: "عملة العرض",
    timezone: "المنطقة الزمنية",
    lifecycleStatus: "حالة دورة الحياة",
    accountStatus: "حالة الحساب",
    avatar: "الصورة الشخصية",
  },
  status: {
    regular: "عادي",
    on_trial: "فترة تجريبية",
    on_leave: "في إجازة",
    suspended: "موقوف",
    deactivated: "غير مفعّل",
  },
  accountStatus: {
    activated: "مفعّل",
    deactivated: "غير مفعّل",
  },
  actions: {
    deactivateAccount: "إلغاء صلاحية الدخول",
    deactivateDialogTitle: "إلغاء صلاحية دخول ولي الأمر",
    deactivateConfirmText:
      "هل أنت متأكد من إلغاء صلاحية دخول ولي الأمر؟ سيتم تسجيل خروجه فوراً ولن يتمكن من تسجيل الدخول حتى استعادة الصلاحية.",
    reactivateAccount: "استعادة صلاحية الدخول",
    reactivateDialogTitle: "استعادة صلاحية دخول ولي الأمر",
    reactivateConfirmText:
      "هل أنت متأكد من استعادة صلاحية الدخول لولي الأمر؟ سيتمكن من تسجيل الدخول مجدداً. هذا لا يغيّر حالة دورة الحياة.",
    cancel: "إلغاء",
    deactivating: "جارٍ إلغاء الصلاحية...",
    reactivating: "جارٍ استعادة الصلاحية...",
    deactivateSuccess: "تم إلغاء صلاحية دخول ولي الأمر.",
    reactivateSuccess: "تم استعادة صلاحية دخول ولي الأمر.",
    manageLifecycle: "إدارة دورة الحياة",
  },
  common: {
    student: {
      fallbackInitial: "ط",
    },
    teacher: {
      fallbackInitial: "م",
    },
  },
  students: {
    empty: "لا يوجد طلاب مرتبطون حالياً.",
    mobileListLabel: "قائمة الطلاب المرتبطين",
    columns: {
      name: "اسم الطالب",
      status: "الحالة",
      teacher: "المعلم",
      hoursPerWeek: "الساعات أسبوعياً",
    },
    statusLabel: {
      regular: "عادي",
      on_trial: "فترة تجريبية",
      on_leave: "في إجازة",
      suspended: "موقوف",
      deactivated: "غير مفعّل",
    },
  },
  notSet: "غير محدد",
};
