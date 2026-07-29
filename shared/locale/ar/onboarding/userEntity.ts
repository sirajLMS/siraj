import type { UserEntityOnboardingLabels } from "@/shared/locale/types/onboarding/userEntity";

export const onboardingUserEntityAr: UserEntityOnboardingLabels = {
  sectionTitle: "تفاصيل الحساب",
  fields: {
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    phone: "الهاتف",
    avatar: "الصورة الشخصية",
    timezone: "المنطقة الزمنية",
    displayCurrency: "عملة العرض",
  },
  placeholders: {
    fullName: "أدخل الاسم الكامل",
    email: "أدخل البريد الإلكتروني",
    password: "أدخل كلمة المرور",
    phone: "أدخل رقم الهاتف",
  },
  validation: {
    fullNameRequired: "الاسم الكامل مطلوب",
    emailInvalid: "أدخل بريد إلكتروني صالح",
    passwordRequired: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
    phoneRequired: "رقم الهاتف مطلوب",
    timezoneRequired: "المنطقة الزمنية مطلوبة",
    currencyRequired: "العملة مطلوبة",
    nameMinLength: "يجب أن يكون الاسم 3 أحرف على الأقل",
    passwordMinLength: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
  },
};
