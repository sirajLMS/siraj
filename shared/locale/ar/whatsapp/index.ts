import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export const whatsappAr: WhatsappLabels = {
  // ─── Page / Tab labels ──────────────────────────────────────────────
  pageTitle: "إعدادات واتساب",
  tabNavAriaLabel: "أقسام إعدادات واتساب",
  tabNumbers: "الأرقام",
  tabTemplates: "القوالب",
  tabOptIn: "الموافقة",

  // ─── Numbers tab ─────────────────────────────────────────────────────
  numbersTitle: "أرقام واتساب",
  numbersSubtitle: "إدارة أرقام WhatsApp Business عبر Cloud API وبيانات اعتمادها.",
  addAccount: "إضافة رقم",
  editAccount: "تعديل الرقم",
  editToken: "تعديل الرمز",
  editPin: "تعديل رمز PIN",
  showToken: "إظهار الرمز",
  hideToken: "إخفاء الرمز",
  cancel: "إلغاء",
  save: "حفظ",
  test: "اختبار",
  testRunning: "جارٍ الاختبار…",
  testPassed: "نجح الاختبار",
  testFailed: "فشل الاختبار",
  /** رفض Meta للرمز لأنه غير صالح أو منتهي الصلاحية (كود 190). */
  tokenTestReasonInvalidToken: (reason: string) =>
    `رفضت Meta هذا الرمز لأنه غير صالح أو منتهي الصلاحية: ${reason}. أنشئ رمز System User جديدًا من إعدادات الأعمال في Meta والصقه هنا.`,
  /** رفض Meta بسبب أذونات ناقصة (كود 10/200). */
  tokenTestReasonMetaPermissions: (reason: string) =>
    `رفضت Meta هذا الرمز لنقص الأذونات (${reason}). يجب أن ينتمي الرمز إلى System User لديه تحكم كامل (أو وصول جزئي على الأقل) في حساب WhatsApp Business الخاص بهذا الرقم، وأن يتضمن إذني whatsapp_business_management و whatsapp_business_messaging.`,
  /** أي خطأ آخر من Meta Graph API. */
  tokenTestReasonMetaError: (reason: string) =>
    `أعادت Meta خطأ أثناء التحقق من الرمز: ${reason}. هذا الخطأ صادر من Meta وليس من أذونات هذا الموقع.`,
  /** الرقم موجود لكنه ليس بحالة CONNECTED لدى Meta. */
  tokenTestReasonNotConnected: (reason: string | null) => {
    const status = reason ?? "غير معروفة";
    return `الرمز صالح، لكن Meta تُبلغ عن حالة هذا الرقم بأنها "${status}" بدلًا من "CONNECTED". راجع الرقم في WhatsApp Manager — قد يكون غير مسجّل أو مفصولًا أو مقيّدًا.`;
  },
  /** تعذّر الوصول إلى Meta (شبكة/تحليل الاستجابة). */
  tokenTestReasonNetworkError: (reason: string | null) => {
    const detail = reason ? `: ${reason}` : "";
    return `تعذّر الوصول إلى Meta للتحقق من الرمز${detail}. تحقق من اتصال الإنترنت للخادم وحاول مجددًا.`;
  },
  /** الخادم رفض طلب الاختبار نفسه (أذونات/تحقق)، قبل التواصل مع Meta. */
  tokenTestReasonRequestRejected: (reason: string | null) => {
    const detail = reason ? `: ${reason}` : "";
    return `رفض الخادم طلب الاختبار نفسه${detail}. هذه مشكلة أذونات أو تحقق في هذا الموقع، وليست مشكلة في رمز Meta.`;
  },
  localDeactivateAccount: "إيقاف استخدام الرقم",
  localDeactivateAccountTooltip: "يبقى الرقم على هذا النظام وعلى Meta، لكن المنصة ستتوقف عن استخدامه.",
  localDeactivateConfirm: "هل أنت متأكد من رغبتك في إيقاف استخدام رقم واتساب هذا؟",
  wabaId: "معرّف WABA",
  phoneNumberId: "معرّف رقم الهاتف",
  displayPhoneNumber: "رقم الهاتف المعروض",
  displayName: "الاسم المعروض",
  accessToken: "رمز الوصول",
  accessTokenPlaceholder: "أدخل رمز الوصول من Meta",
  twoStepPin: "رمز التحقق بخطوتين",
  twoStepPinPlaceholder: "أدخل رمز PIN المكوّن من 6 أرقام",
  isActive: "نشط",
  accountStatusLabel: "حالة النظام",
  metaStatusLabel: "الاتصال بـ Meta",
  metaStatusConnected: "متصل",
  metaStatusDisconnected: "غير متصل",
  metaStatusUnknown: "غير معروف",
  qualityRating: "تقييم الجودة",
  messagingTier: "مستوى حد المراسلة",
  throughputLevel: "مستوى معدل الإرسال",
  lastWebhookAt: "آخر webhook مستلم",
  syncFromMeta: "مزامنة من Meta",
  syncFromMetaUnavailable: (missingEnvKeys: string) =>
    `المزامنة من Meta غير متاحة: إعدادات واتساب التالية غير مضبوطة (${missingEnvKeys}). عيّن هذه القيم في بيئة التشغيل، أو أضف حساب واتساب أدناه.`,
  syncFromMetaBusy: "جارٍ المزامنة من Meta…",
  syncSuccess: "تمت مزامنة حسابات واتساب من Meta بنجاح.",
  syncSuccessWithCounts: (synced: number, added: number) => {
    let syncedPhrase = `${synced} أرقام`;
    if (synced === 1) {
      syncedPhrase = "رقم واحد";
    } else if (synced === 2) {
      syncedPhrase = "رقمين";
    }
    if (added === 0) {
      return `تمت مزامنة ${syncedPhrase} من Meta — جميعها معروفة مسبقاً هنا، ولم تُضف أرقام جديدة.`;
    }
    let addedPhrase = `${added} أرقام جديدة`;
    if (added === 1) {
      addedPhrase = "رقم جديد واحد";
    } else if (added === 2) {
      addedPhrase = "رقمان جديدان";
    }
    return `تمت مزامنة ${syncedPhrase} من Meta — تمت إضافة ${addedPhrase}.`;
  },
  syncNoChange: "لم يتم اكتشاف أي تغييرات من Meta.",
  syncError: "فشلت المزامنة من Meta. يرجى التحقق من بيانات الاعتماد والمحاولة مرة أخرى.",
  noAccounts: 'لا توجد أرقام واتساب مُعدة. انقر على "إضافة رقم" للبدء.',

  // ─── Meta phone numbers settings link ──────────────────────────────
  metaNumbersHelpTitle: "إعدادات أرقام هواتف فيسبوك",
  metaNumbersHelpBody:
    "أضف أرقام واتساب الخاصة بك أو عدّلها أو احذفها من إعدادات أرقام الهواتف في مدير الأعمال من Meta.",
  metaNumbersCopyLink: "نسخ الرابط",
  metaNumbersCopyLinkTooltip: "انسخ رابط إعدادات أرقام الهواتف في Meta",
  metaNumbersCopied: "تم النسخ",
  metaNumbersOpenInNewTab: "فتح في تبويب جديد",
  metaNumbersOpenInNewTabTooltip: "افتح إعدادات أرقام الهواتف في Meta في تبويب جديد",

  // ─── Templates tab ──────────────────────────────────────────────────
  templatesTitle: "قوالب الرسائل",
  templatesSubtitle: "مزامنة ومراجعة قوالب رسائل واتساب من Meta.",
  templateName: "اسم القالب",
  templateLanguage: "اللغة",
  templateStatus: "الحالة",
  templateCategory: "الفئة",
  noTemplates: 'لا توجد قوالب. انقر على "مزامنة القوالب" لجلبها من Meta.',
  syncTemplates: "مزامنة القوالب",

  // ─── Template status labels (Q5: Meta enum → localized) ───────────
  templateStatusApproved: "معتمد",
  templateStatusPending: "قيد المراجعة",
  templateStatusRejected: "مرفوض",
  templateStatusPaused: "متوقف مؤقتًا",
  templateStatusPendingDeletion: "في انتظار الحذف",
  templateStatusDisabled: "معطّل",

  // ─── Quality rating labels (Q5) ────────────────────────────────────
  qualityGreen: "جودة عالية",
  qualityYellow: "جودة متوسطة",
  qualityRed: "جودة منخفضة",
  qualityUnknown: "غير معروف",

  // ─── Tier label captions (Q5: raw Meta enum → localized) ──────────
  tier10: "10 محادثات / 24 ساعة",
  tier50: "50 محادثة / 24 ساعة",
  tier250: "250 محادثة / 24 ساعة",
  tier1K: "1,000 محادثة / 24 ساعة",
  tier5K: "5,000 محادثة / 24 ساعة",
  tier10K: "10,000 محادثة / 24 ساعة",
  tier100K: "100,000 محادثة / 24 ساعة",
  tierUnlimited: "محادثات غير محدودة / 24 ساعة",
  tierUnknown: "فئة غير معروفة",

  // ─── Throughput level labels ────────────────────────────────────────
  throughputStandard: "قياسي",
  throughputCoexistence: "تعايش",
  throughputHigh: "عالي",
  throughputUnknown: "غير معروف",

  // ─── Coexistence warning (R7) ───────────────────────────────────────
  coexistenceWarningTitle: "وضع التعايش نشط",
  coexistenceWarningBody:
    "هذا الرقم في وضع التعايش مع تطبيق WhatsApp Business. تقتصر المراسلة على 20 رسالة في الثانية. قد تكون بعض الميزات غير متاحة.",

  // ─── Unverified 2-slot warning (R7) ─────────────────────────────────
  unverifiedWarningTitle: "رقم غير موثّق",
  unverifiedWarningBody:
    "هذا الرقم غير موثّق ومقتصر على فتحتين لقوالب الرسائل. أكمل التحقق من Meta لفتح السعة الكاملة للقوالب.",

  // ─── Tier exceeded & coexistence inline warnings (Task 11) ─────────
  warningTierExceeded: "تجاوز حد الفئة — قد يتم تقييد المراسلة",
  warningCoexistence: "وضع التعايش نشط — 20 رسالة/ثانية كحد أقصى",

  // ─── Throughput metric label (Task 11) ──────────────────────────────
  throughput24h: "الإنتاجية (24 ساعة)",

  // ─── Opt-in toggle + consent copy (REQ-10) ──────────────────────────
  optInTitle: "الموافقة على إشعارات واتساب",
  optInSubtitle: "اختر ما إذا كنت ترغب في تلقي الإشعارات عبر واتساب.",
  optInToggle: "تلقّي الإشعارات عبر واتساب",
  optInConsentBody:
    "بتمكين هذا الخيار، فإنك توافق على تلقي الإشعارات والتحديثات عبر واتساب. يمكنك إلغاء الاشتراك في أي وقت. قد تُطبق رسوم الرسائل القياسية.",
  optInEnabled: "تم تفعيل إشعارات واتساب",
  optInDisabled: "تم تعطيل إشعارات واتساب",

  // ─── Snackbar / notification messages ──────────────────────────────
  localDeactivateSuccess: "تم إيقاف استخدام الرقم.",
  localDeactivateError: "فشل إيقاف استخدام الرقم.",
  saveSuccess: "تم حفظ رقم واتساب بنجاح.",
  saveError: "فشل حفظ رقم واتساب.",
  optInError: "فشل تحديث تفضيل الموافقة على واتساب.",
  isInactive: "غير نشط",

  // ─── Delivery-failure keys (14.5) ──────────────────────────────────
  deliveryFailed: "فشل تسليم رسالة واتساب",
  deliveryFailedWithReason: (reason: string) => `فشل تسليم رسالة واتساب: ${reason}`,

  // ─── Create/Edit form labels (Task 1) ──────────────────────────────
  createAccountTitle: "إضافة رقم واتساب",
  editNameTitle: "تعديل الاسم المعروض",
  displayNameLabel: "الاسم المعروض",
  phoneNumberIdLabel: "معرّف رقم الهاتف",
  wabaIdLabel: "معرّف WABA",
  displayNameHelper: "الاسم الذي يظهر للمستلمين في واتساب.",
  phoneNumberIdHelper: "معرّف رقم الهاتف المعيّن من Meta.",
  wabaIdHelper: "معرّف حساب WhatsApp Business من Meta.",

  // ─── Validation messages (Task 1) ──────────────────────────────────
  validationDisplayNameRequired: "الاسم المعروض مطلوب.",
  validationDisplayNameTooLong: "يجب ألا يتجاوز الاسم المعروض 100 حرف.",
  validationPhoneNumberIdRequired: "معرّف رقم الهاتف مطلوب.",
  validationPhoneNumberIdNumeric: "يجب أن يكون معرّف رقم الهاتف رقميًا.",
  validationWabaIdRequired: "معرّف WABA مطلوب.",
  validationWabaIdNumeric: "يجب أن يكون معرّف WABA رقميًا.",
  validationAccessTokenTooShort: "يجب أن يتكون رمز الوصول من 50 حرفًا على الأقل.",
  validationPinFormat: "يجب أن يتكون رمز PIN من 6 أرقام بالضبط.",
  validationPurposeRequired: "يرجى اختيار الغرض من هذا الرقم.",
  validationPurposeInvalid: "الغرض المحدد غير صالح.",

  // ─── Local-deactivate confirm with interpolation (Task 1) ───────────────────
  localDeactivateConfirmTitle: "إيقاف استخدام رقم واتساب",
  localDeactivateConfirmMessage: (displayName: string) =>
    `هل أنت متأكد من رغبتك في إيقاف استخدام "${displayName}"؟ يبقى الرقم على هذا النظام وعلى Meta، لكن المنصة ستتوقف عن استخدامه.`,

  // ─── State labels (Task 1) ─────────────────────────────────────────
  loadingTitle: "جارٍ التحميل…",
  retry: "إعادة المحاولة",
  refresh: "تحديث",
  permissionDenied: "تم رفض الإذن",

  // ─── Account action labels (Task 1) ────────────────────────────────
  editName: "تعديل الاسم",
  addFirstNumber: "أضف رقمك الأول",

  // ─── Template preview labels (Task 1) ─────────────────────────────
  templateBody: "نص الرسالة",
  templateButtons: "الأزرار",
  templateLastUpdated: "آخر تحديث",

  // ─── Error boundary (Task 1) ───────────────────────────────────────
  errorGenericTitle: "حدث خطأ ما",
  errorGeneric: "حدث خطأ غير متوقع أثناء تحميل إعدادات واتساب. يرجى المحاولة مرة أخرى.",

  // ─── Opt-in history table (Task 12) ─────────────────────────────────
  optInHistoryTitle: "سجل الاشتراك",
  optInHistorySubtitle: "التغييرات الأخيرة على حالة اشتراكك في إشعارات واتساب.",
  optInHistoryDate: "التاريخ",
  optInHistoryAction: "الإجراء",
  optInHistoryChangedBy: "تم التغيير بواسطة",
  optInActionOptedIn: "اشترك",
  optInActionOptedOut: "ألغى الاشتراك",
  optInHistoryEmpty: "لا توجد إدخالات في سجل الاشتراك بعد.",
  optInHistoryFilter: "تصفية",
  optInHistoryFilterFrom: "من",
  optInHistoryFilterTo: "إلى",
  optInHistoryFilterApply: "تطبيق",
  optInHistoryFilterClear: "مسح",
  optInHistoryExport: "تصدير CSV",

  // ─── Admin consolidated opt-in view (Task 13) ──────────────────────
  optInAdminTitle: "حالة اشتراك جميع المستخدمين",
  optInAdminSubtitle: "عرض وإدارة حالات الاشتراك لجميع مستخدمي واتساب.",
  optInAdminUserName: "المستخدم",
  optInAdminOptedIn: "مشترك",
  optInAdminOptedInAt: "تاريخ الاشتراك",
  optInAdminActions: "إجراءات",
  optInAdminSearchPlaceholder: "ابحث باسم المستخدم…",
  optInAdminYes: "نعم",
  optInAdminNo: "لا",
  optInAdminEmpty: "لا يوجد مستخدمون مطابقون لمرشح البحث.",

  // ─── Embedded Signup (coexistence onboarding) ───────────────────────
  connectBusinessApp: "ربط تطبيق الأعمال",
  embeddedSignupTitle: "ربط تطبيق واتساب للأعمال (التواجد المشترك)",
  embeddedSignupDescription:
    "اربط رقمًا مستخدمًا حاليًا في تطبيق واتساب للأعمال. يبقى فريقك يستخدم تطبيق الهاتف بينما تستطيع المنصة قراءة الرسائل وإرسالها.",
  embeddedSignupLaunch: "بدء تسجيل Meta المضمّن",
  embeddedSignupWaitingTitle: "أكمل الخطوات في نافذة Meta",
  embeddedSignupWaitingBody:
    "وافق على الربط في نافذة Meta (أو في تطبيق واتساب للأعمال)، ثم عد إلى هنا. سنُكمل الإعداد تلقائيًا.",
  embeddedSignupCancelledTitle: "تم إلغاء الربط",
  embeddedSignupCancelledBody: "غادرت إعداد Meta قبل الإكمال. لم يتغيّر شيء — يمكنك البدء من جديد متى شئت.",
  embeddedSignupErrorTitle: "فشل الربط",
  embeddedSignupSuccessTitle: "تم ربط الرقم",
  embeddedSignupSuccessBody:
    "تم ربط الرقم. تتم مزامنة جهات الاتصال وسجل المحادثات في الخلفية — وقد يستغرق ذلك حتى ٢٤ ساعة.",
  embeddedSignupRetry: "إعادة المحاولة",
  embeddedSignupNotConfigured: "التسجيل المضمّن غير مهيأ في هذه البيئة.",
  embeddedSignupStepCompleteInApp: "أكمل في تطبيق واتساب للأعمال",
  embeddedSignupStepSync: "مزامنة جهات الاتصال والسجل",
  embeddedSignupVersionNote: "يتطلب تطبيق واتساب للأعمال بالإصدار 2.24.17 أو أحدث على هاتف الموظف.",
  embeddedSignupSyncInfo:
    "تتم مزامنة سجل المحادثات وجهات الاتصال في الخلفية بعد الربط — وقد يستغرق ذلك حتى ٢٤ ساعة. يستمر فريقك في استخدام تطبيق الهاتف خلال ذلك.",
  embeddedSignupErrorBody: "تعذّر إكمال الربط. لم يتم ربط أي رقم — يمكنك إعادة بدء عملية الإعداد.",
  embeddedSignupCompletingTitle: "جارٍ إنهاء الإعداد",
  embeddedSignupCompletingBody: "جارٍ تأكيد الربط وجدولة مزامنة جهات الاتصال والسجل. يستغرق ذلك لحظات فقط.",
  embeddedSignupDone: "تم",
  embeddedSignupClose: "إغلاق",
  embeddedSignupAllowedOriginsTitle: "إعداد أول مرة: اسمح لهذا التطبيق في Meta",
  embeddedSignupAllowedOriginsBody: origin =>
    `لا ترسل Meta رمز التسجيل إلا إلى النطاقات المسجّلة. أضف ${origin} قبل الإطلاق ضمن App Dashboard ← Facebook Login for Business ← Settings في حقول «Allowed domains» و«Valid OAuth redirect URIs».`,
  embeddedSignupAllowedOriginsLink: "افتح إعدادات تطبيق Meta",
  embeddedSignupRequiresHttps:
    "يتطلب ربط رقم اتصالاً آمناً عبر HTTPS — تحظر Meta تدفق تسجيل الدخول على HTTP غير المشفّر. افتح هذه الصفحة عبر HTTPS للمتابعة.",

  // ─── Accessibility & Permission Denied (Task 17) ───────────────────
  permissionDeniedTitle: "الوصول مقيد",
  permissionDeniedDescription: "ليس لديك إذن للوصول إلى هذا القسم. تواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.",

  // ─── Tab labels (v2) ─────────────────────────────────────────────────
  tabInbox: "البريد الوارد",

  // ─── Purpose labels ───────────────────────────────────────────────────
  purposeLabel: "الغرض",
  purposeHelper: "يحدد الإشعارات التي يرسلها هذا الرقم. تعود الأحداث غير المعيّنة إلى الرقم العام.",
  purposeGeneral: "عام",
  purposeAdvertising: "إعلاني",
  purposeStudents: "الطلاب",
  purposeUpdated: "تم تحديث غرض الرقم.",
  purposeUpdateFailed: "فشل تحديث غرض الرقم.",

  // ─── Onboarding mode labels ───────────────────────────────────────────
  onboardingModeLabel: "وضع الربط",
  onboardingModeCloudApi: "Cloud API",
  onboardingModeCoexistence: "التواجد المشترك (تطبيق الأعمال)",
  coexistenceRestrictionsHint:
    "لأرقام التواجد المشترك بعض القيود — تبقى القوائم البثية وبعض ميزات التطبيق حكرًا على تطبيق واتساب للأعمال.",

  // ─── Coexistence sync statuses ───────────────────────────────────────
  syncStatusLabel: "حالة المزامنة",
  syncStatusNotStarted: "لم تبدأ",
  syncStatusRequested: "مطلوبة",
  syncStatusSyncing: "جارٍ المزامنة",
  syncStatusComplete: "مكتملة",
  syncStatusFailed: "فشلت",
  syncHistoryDeclined: "تم رفض السجل",
  syncProgress: (percent: number) => `تمت مزامنة ${percent}٪`,
  syncPhaseLabel: (phase: number) => `مزامنة السجل — المرحلة ${phase}`,
  syncDeadlineHint: (deadline: string) => `متوقع بحلول ${deadline}`,
  syncDeclinedGuidance: "يبقى البريد الوارد غير متاح لهذا الرقم حتى تتم إعادة تشغيل الإعداد.",

  // ─── لافتات وأوصاف الخيارات ────────────────────────────────────────
  addNumberInfoBanner: "يتشارك كل رقم حد المراسلة على مستوى محفظتك؛ وتُقاس الجودة لكل رقم على حدة.",
  purposeOptionGeneralDescription: "بديل احتياطي لجميع الإشعارات",
  purposeOptionStudentsDescription: "تذكيرات الحصص والتقارير",
  purposeOptionAdvertisingDescription: "ردود الحملات الإعلانية",
  optInDefaultOffBanner: "إشعارات واتساب معطلة افتراضيًا؛ يفعّلها المستخدمون صراحةً.",

  // ─── تبويب الإعداد (الإعدادات ▸ واتساب ▸ الإعداد) ──────────────────
  tabConfig: "الإعداد",
  configTitle: "تهيئة Cloud API",
  configSubtitle: "إدارة بيانات اعتماد WhatsApp Cloud API من Meta المستخدمة على مستوى المنصة.",
  configSourceDb: "القيم مخزّنة في قاعدة البيانات.",
  configSourceEnv: "لا توجد قيم مخزّنة بعد — تُستخدم متغيرات البيئة كبديل احتياطي.",
  configReadonlyNotice: "لديك صلاحية العرض فقط. التحرير متاح للمدراء ممن يملكون صلاحية الإدارة.",
  configAppId: "معرّف تطبيق Meta",
  configAppIdHelper: "المعرّف الرقمي لتطبيقك على Meta.",
  validationAppIdNumeric: "يجب أن يتكوّن معرّف تطبيق Meta من أرقام فقط.",
  validationMaxLength: "تتجاوز هذه القيمة الحد الأقصى المقبول لطول الحقل.",
  configAppSecret: "سر تطبيق Meta",
  configSecretStored: (masked: string) => `القيمة المخزّنة: ${masked} — اكتب سرًا جديدًا لاستبداله.`,
  configSecretNotSet: "لم يُخزَّن أي سر بعد. اكتب واحدًا لتخزينه.",
  configVerifyToken: "رمز التحقق (Verify Token)",
  configVerifyTokenHelper: "يُشارك مع Meta للتحقق من اشتراك الـ webhook.",
  configGenerateToken: "إنشاء",
  configGenerateTokenHint: "أنشئ مرشّحًا آمنًا لرمز التحقق، ثم احفظ التغييرات لتطبيقه.",
  configTokenGenerated: "تم إنشاء رمز تحقق جديد. احفظ التغييرات لتطبيقه.",
  configTokenGenerateError: "تعذّر إنشاء رمز تحقق. يرجى المحاولة مرة أخرى.",
  configCopyToken: "نسخ رمز التحقق",
  configWebhookUrl: "عنوان URL لاستدعاء الـ Webhook",
  configWebhookUrlHelper: "عنوان للقراءة فقط يُشتق من نطاق المنصة.",
  configWebhookUrlGuidance:
    "في Meta Developer Console، افتح صفحة WhatsApp ▸ Configuration لتطبيقك، والصق هذا العنوان في خانة Callback URL، ثم اشترك في حقل messages.",
  configCopyWebhookUrl: "نسخ عنوان الـ Webhook",
  configPhoneNumberId: "معرّف رقم الهاتف",
  configPhoneNumberIdHelper: "معرّف رقم الهاتف الذي يرسل الرسائل ويستقبلها.",
  configWabaId: "معرّف WABA",
  configWabaIdHelper: "معرّف حساب WhatsApp Business المرتبط بالرقم.",
  configAccessToken: "رمز وصول دائم",
  configAccessTokenHelper: "رمز طويل الأمد يُستخدم لاستدعاءات Cloud API، ويُخزَّن بأمان ولا يظهر إلا مقنّعًا.",
  configEsConfigId: "معرّف إعداد التسجيل المدمج",
  configEsConfigIdHelper: "اختياري. يتيح الانضمام الذاتي عبر التسجيل المدمج في Meta.",
  configClearHint: "اتركه فارغًا لإزالة القيمة المخزّنة.",
  configSaveChanges: "حفظ التغييرات",
  configSaveSuccess: "تم حفظ إعدادات واتساب.",
  configSaveError: "تعذّر حفظ إعدادات واتساب.",
  configTestConnection: "اختبار الاتصال",
  configTestConnectionError: "تعذّر تنفيذ اختبار الاتصال. يرجى المحاولة مرة أخرى.",
  configConnectionPhoneNumber: "الرقم المتصل",
  configCopied: "تم النسخ إلى الحافظة.",
  configCopyFailed: "تعذّر النسخ إلى الحافظة.",
  configShowSecret: "إظهار القيمة",
  configHideSecret: "إخفاء القيمة",
};
