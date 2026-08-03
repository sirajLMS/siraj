import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export const whatsappAr: WhatsappLabels = {
  // ─── Page / Tab labels ──────────────────────────────────────────────
  pageTitle: "إعدادات واتساب",
  tabNumbers: "الأرقام",
  tabTemplates: "القوالب",
  tabOptIn: "الموافقة",

  // ─── Numbers tab ─────────────────────────────────────────────────────
  numbersTitle: "أرقام واتساب",
  numbersSubtitle: "إدارة أرقام واتساب التجارية عبر Cloud API وبيانات الاعتماد.",
  addAccount: "إضافة رقم",
  editAccount: "تعديل الرقم",
  editToken: "تعديل الرمز",
  editPin: "تعديل رمز PIN",
  cancel: "إلغاء",
  save: "حفظ",
  deleteAccount: "حذف الرقم",
  deleteConfirm: "هل أنت متأكد من حذف رقم واتساب هذا؟ لا يمكن التراجع عن هذا الإجراء.",
  wabaId: "معرف WABA",
  phoneNumberId: "معرف رقم الهاتف",
  displayPhoneNumber: "رقم الهاتف المعروض",
  displayName: "الاسم المعروض",
  accessToken: "رمز الوصول",
  accessTokenPlaceholder: "أدخل رمز الوصول من Meta",
  twoStepPin: "رمز التحقق بخطوتين",
  twoStepPinPlaceholder: "أدخل رمز PIN مكوّن من 6 أرقام",
  isActive: "نشط",
  qualityRating: "تقييم الجودة",
  messagingTier: "حد المراسلة",
  throughputLevel: "مستوى الإنتاجية",
  lastWebhookAt: "آخر webhook مستلم",
  syncFromMeta: "مزامنة من Meta",
  syncSuccess: "تمت مزامنة حسابات واتساب بنجاح من Meta.",
  syncNoChange: "لم يتم اكتشاف أي تغييرات من Meta.",
  syncError: "فشلت المزامنة من Meta. يرجى التحقق من بيانات الاعتماد والمحاولة مرة أخرى.",
  noAccounts: 'لا توجد أرقام واتساب مُعدة. انقر على "إضافة رقم" للبدء.',

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

  // ─── Opt-in toggle + consent copy (REQ-10) ──────────────────────────
  optInTitle: "الموافقة على إشعارات واتساب",
  optInSubtitle: "اختر ما إذا كنت ترغب في تلقي الإشعارات عبر واتساب.",
  optInToggle: "تلقّي الإشعارات عبر واتساب",
  optInConsentBody:
    "بتمكين هذا الخيار، فإنك توافق على تلقي الإشعارات والتحديثات عبر واتساب. يمكنك إلغاء الاشتراك في أي وقت. قد تُطبق رسوم الرسائل القياسية.",
  optInEnabled: "تم تفعيل إشعارات واتساب",
  optInDisabled: "تم تعطيل إشعارات واتساب",

  // ─── Snackbar / notification messages ──────────────────────────────
  deleteSuccess: "تم حذف رقم واتساب بنجاح.",
  deleteError: "فشل حذف رقم واتساب.",
  saveSuccess: "تم حفظ رقم واتساب بنجاح.",
  saveError: "فشل حفظ رقم واتساب.",
  optInError: "فشل تحديث تفضيل الموافقة على واتساب.",
  isInactive: "غير نشط",

  // ─── Delivery-failure keys (14.5) ──────────────────────────────────
  deliveryFailed: "فشل تسليم رسالة واتساب",
  deliveryFailedWithReason: (reason: string) => `فشل تسليم رسالة واتساب: ${reason}`,
};
