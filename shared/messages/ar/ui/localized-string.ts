import type { LocalizedStringLabels } from "@/shared/messages/types/ui/localized-string";

export const localizedString: LocalizedStringLabels = {
  editTranslations: "تعديل الترجمات",
  cancel: "إلغاء",
  save: "حفظ",
  selectLocale: "اختيار اللغة",
  drawerSubtitle: "تعديل كل الترجمات",
  switchLocale: "تبديل اللغة",
  atLeastOneTranslationRequired: "أدخل ترجمة واحدة على الأقل",
  localeRequired: (localeName: string) => `${localeName} مطلوب لهذا الحقل`,
  localesRequired: (localeNames: string) => `${localeNames} مطلوبة لهذا الحقل`,
  localeRequiredEntry: (localeName: string) => `${localeName} مطلوب`,
};
