import type { SettingsAppearanceTabLabels } from "@/shared/locale/types/dashboard/settings/appearance";

export const dashboardSettingsAppearanceAr: SettingsAppearanceTabLabels = {
  title: "مظهر الموقع",
  subtitle: "خصّص هوية الموقع، الألوان، والمظهر البصري.",

  publishedBadge: "منشور",
  draftBadge: "المسودة تحتوي على تغييرات",
  noPublishedVersion: "لا توجد نسخة منشورة بعد",
  lastPublishedBy: (actor, when) => `آخر نشر ${when} بواسطة ${actor}`,
  draftUpdated: when => `تم تحديث المسودة ${when}`,
  draftUpdatedJustNow: "تم تحديث المسودة للتو",

  enterCustomizeMode: "دخول وضع التخصيص",
  enterCustomizeModeHint: "افتح أداة التخصيص المباشرة لتحرير الألوان والشعار وهوية العلامة التجارية في الوقت الفعلي.",

  saveDraft: "حفظ المسودة",
  publishNow: "نشر الآن",
  resetToDefaults: "إعادة التعيين إلى الافتراضي",
  exportJson: "تصدير JSON",

  toolbarBadge: "تخصيص",
  toolbarExit: "خروج",
  toolbarUndo: "تراجع",
  toolbarRedo: "إعادة",
  toolbarLivePreviewHint: "تظهر التغييرات مباشرة أثناء التحرير",
  toolbarPublish: "نشر",

  saveDraftSuccess: "تم حفظ مسودة المظهر.",
  saveDraftError: "فشل حفظ مسودة المظهر.",
  publishSuccess: "تم نشر المظهر لجميع المستخدمين.",
  publishError: "فشل نشر إعدادات المظهر.",
  resetSuccess: "تمت إعادة تعيين مسودة المظهر إلى الافتراضي.",
  resetError: "فشل إعادة تعيين مسودة المظهر.",

  resetConfirmTitle: "إعادة تعيين مسودة المظهر",
  resetConfirmBody: "إعادة تعيين المسودة إلى المظهر الافتراضي؟ لن يؤثر هذا على النسخة المنشورة.",
  resetConfirmCancel: "إلغاء",
  resetConfirmConfirm: "إعادة التعيين",

  conflictTitle: "تم تعديل المظهر بواسطة مسؤول آخر",
  conflictBody:
    "تم تغيير إعدادات المظهر بواسطة مسؤول آخر منذ آخر تحميل لك. " +
    "أعد التحميل لتجاهل تغييراتك واستخدام أحدث إصدار، أو الكتابة فوقها لفرض تغييراتك.",
  conflictReload: "إعادة التحميل",
  conflictOverwrite: "الكتابة فوق",
  conflictCancel: "إلغاء",

  errorBoundaryTitle: "خطأ في المخصّص",
  errorBoundaryBody: "واجه مخصّص مظهر الموقع خطأ غير متوقع. أعد التعيين واخرج للاستعادة.",
  errorBoundaryReset: "إعادة التعيين والخروج",

  noPermission: "ليس لديك صلاحية لإدارة مظهر الموقع.",

  customize: {
    enterMode: "دخول وضع التخصيص",
    exitMode: "خروج من وضع التخصيص",
    undo: "تراجع",
    redo: "إعادة",
    saveDraft: "حفظ المسودة",
    publish: "نشر",
    resetDefaults: "إعادة التعيين إلى الافتراضي",
    brandIdentity: "هوية العلامة التجارية",
    colors: "ألوان النمط",
    light: "فاتح",
    dark: "داكن",
    logoUpload: "الشعار",
    defaultMode: "الوضع الافتراضي",
    published: "منشور",
    draft: "مسودة",
    exportJson: "تصدير JSON",
  },
};
