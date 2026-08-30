export const uiMeetingConfigEnhancementsAr = {
  oauthCallbackSuccess: "تم ربط المزود بنجاح. حسابك أصبح مرتبطًا الآن.",
  oauthCallbackError: "فشل استدعاء OAuth. يرجى محاولة إعادة ربط المزود.",
  reconnectAll: "إعادة ربط الكل",
  reconnecting: "جارٍ إعادة الربط…",
  reconnectAllSuccess: "تمت إعادة ربط جميع المزودين بنجاح.",
  reconnectAllError: "تعذّرت إعادة ربط بعض المزودين. يرجى المحاولة مرة أخرى.",
  reconnectAllWithCount: (count: number) => `إعادة ربط الكل (${count})`,
  reconnectingProgress: (current: number, total: number) => `جارٍ إعادة الربط ${current} من ${total}…`,
  reconnectedProviders: (count: number) => {
    if (count === 1) return "تمت إعادة ربط مزود واحد";
    if (count === 2) return "تمت إعادة ربط مزودين";
    return `تمت إعادة ربط ${count} مزودين`;
  },
  reconnectFailedProviders: (count: number) => {
    if (count === 1) return "فشل إعادة ربط مزود واحد";
    if (count === 2) return "فشل إعادة ربط مزودين";
    return `فشل إعادة ربط ${count} مزودين`;
  },
  reconnectAllAriaLabel: "إعادة ربط جميع المزودين المنتهية صلاحيتهم",
  expiresInDays: (days: number) => {
    if (days === 1) return "ينتهي خلال يوم واحد";
    if (days === 2) return "ينتهي خلال يومين";
    return `ينتهي خلال ${days} أيام`;
  },
  expiresInHours: (hours: number) => {
    if (hours === 1) return "ينتهي خلال ساعة واحدة";
    if (hours === 2) return "ينتهي خلال ساعتين";
    return `ينتهي خلال ${hours} ساعات`;
  },
  expired: "منتهي الصلاحية",
  reconnect: "إعادة الربط",
  copyMeetingUrl: "نسخ رابط الاجتماع",
  urlCopied: "تم نسخ رابط الاجتماع!",
  urlCopyFailed: "تعذّر نسخ الرابط.",
  generationPending: "جارٍ توليد رابط الاجتماع…",
  generationSuccess: "تم توليد رابط الاجتماع بنجاح.",
  generationFailed: "تعذّر توليد رابط الاجتماع.",
  retryGeneration: "إعادة التوليد",
  generationPreviewCallout: "المعاينة ستولّد رابط اجتماع مؤقتًا دون حفظه.",
  testConfig: "اختبار الإعداد",
  previewUrlGenerated: "تم توليد رابط المعاينة. لن يتم حفظ هذا الرابط.",
  connectFirstProvider: "اربط مزودك الأول",
  connectFirstProviderDescription: "اربط مزود اجتماعات لبدء التوليد التلقائي لروابط الاجتماعات لحصصك.",
  disconnectWarningTitle: "فصل المزود؟",
  disconnectWarningMessage: "أنت على وشك فصل مزود الاجتماعات هذا. قد تتوقف روابط الاجتماعات الحالية عن العمل.",
  disconnectWarningImpact: "ستحتاج الحصص القادمة إلى إدخال الرابط يدويًا حتى يتم إعادة ربط مزود.",
  disconnect: "قطع الاتصال",
  cancel: "إلغاء",
  disconnectError: "تعذّر قطع الاتصال بالمزود. يرجى المحاولة مرة أخرى.",
  navigateToAdminSettings: "إعدادات المزود الإدارية",
  navigateToAdminSettingsAriaLabel: "فتح إعدادات مزود الاجتماعات الإدارية",
};
