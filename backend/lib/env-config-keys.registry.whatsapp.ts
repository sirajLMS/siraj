import type { EnvConfigKeyDescriptor } from "@/backend/lib/env-config-keys";

export const ENV_CONFIG_KEYS_WHATSAPP: EnvConfigKeyDescriptor[] = [
  // WhatsApp
  // ---------------------------------------------------------------------------
  // PERMANENT POLICY — WhatsApp env keys are `.env`-only, forever:
  // they must NEVER be seeded into the database by any db seeder (not even as
  // empty `env::WHATSAPP_*` placeholder rows). `backend/db/seeds/shared/system-settings.ts`
  // enforces this with a `category !== "whatsapp"` filter; do not remove that
  // filter and do not flip these entries' `excludeFromDb` to bypass it.
  // ---------------------------------------------------------------------------
  {
    key: "WHATSAPP_PROVIDER",
    category: "whatsapp",
    displayStrategy: "plain",
    description: {
      en: "WhatsApp API provider (cloud_api).",
      ar: "مزوّد واجهة برمجة تطبيقات واتساب (cloud_api).",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "WHATSAPP_APP_ID",
    category: "whatsapp",
    displayStrategy: "plain",
    description: {
      en: "WhatsApp App ID for webhook validation.",
      ar: "معرّف تطبيق واتساب للتحقق من webhook.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "WHATSAPP_ACCESS_TOKEN",
    category: "whatsapp",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Access token for Meta WhatsApp Cloud API Graph calls.",
      ar: "رمز الوصول لواجهة Meta WhatsApp Cloud API Graph.",
    },
    isSecret: true,
    excludeFromDb: true,
  },
  {
    key: "WHATSAPP_PHONE_NUMBER_ID",
    category: "whatsapp",
    displayStrategy: "plain",
    description: {
      en: "Default phone number ID for the WhatsApp Business account.",
      ar: "معرّف رقم الهاتف الافتراضي لحساب واتساب للأعمال.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "WHATSAPP_APP_SECRET",
    category: "whatsapp",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "App secret used for webhook HMAC verification.",
      ar: "سرّ التطبيق المستخدم للتحقق من HMAC في webhook.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "WHATSAPP_VERIFY_TOKEN",
    category: "whatsapp",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Verify token for WhatsApp webhook GET verification.",
      ar: "رمز التحقق لـ GET webhook في واتساب.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "WHATSAPP_WABA_ID",
    category: "whatsapp",
    displayStrategy: "plain",
    description: {
      en: "Default WhatsApp Business Account ID for account sync.",
      ar: "معرّف حساب واتساب للأعمال الافتراضي لمزامنة الحساب.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "WHATSAPP_TEST_TO_PHONE",
    category: "whatsapp",
    displayStrategy: "plain",
    description: {
      en: "Recipient phone number for WhatsApp integration tests (digits only).",
      ar: "رقم هاتف المستلم لاختبارات تكامل واتساب (أرقام فقط).",
    },
    isSecret: false,
    excludeFromDb: true,
  },
  {
    key: "WHATSAPP_TEST_TEMPLATE_NAME",
    category: "whatsapp",
    displayStrategy: "plain",
    description: {
      en: "Template name for WhatsApp integration tests (e.g., hello_world).",
      ar: "اسم القالب لاختبارات تكامل واتساب (مثل hello_world).",
    },
    isSecret: false,
    excludeFromDb: true,
  },
  {
    key: "WHATSAPP_TEST_TEMPLATE_LANGUAGE",
    category: "whatsapp",
    displayStrategy: "plain",
    description: {
      en: "Template language code for WhatsApp integration tests (e.g., en_US).",
      ar: "رمز لغة القالب لاختبارات تكامل واتساب (مثل en_US).",
    },
    isSecret: false,
    excludeFromDb: true,
  },
  {
    key: "WHATSAPP_API_VERSION",
    category: "whatsapp",
    displayStrategy: "plain",
    description: {
      en: "WhatsApp Cloud API version (e.g., v21.0).",
      ar: "نسخة واجهة برمجة WhatsApp Cloud API (مثل v21.0).",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "WHATSAPP_GRAPH_API_VERSION",
    category: "whatsapp",
    displayStrategy: "plain",
    description: {
      en: "Meta Graph API version used for WhatsApp Cloud API calls (e.g., v25.0).",
      ar: "نسخة واجهة Meta Graph API المستخدمة لنداءات WhatsApp Cloud API (مثل v25.0).",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "WHATSAPP_ES_CONFIG_ID",
    category: "whatsapp",
    displayStrategy: "plain",
    description: {
      en: "Facebook Login for Business configuration ID used by WhatsApp Embedded Signup.",
      ar: "معرّف إعداد تسجيل الدخول عبر فيسبوك للأعمال المستخدم في تسجيل واتساب المضمّن.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "WHATSAPP_WEBHOOK_BASE_URL",
    category: "whatsapp",
    displayStrategy: "plain",
    description: {
      en: "Base URL for WhatsApp webhooks.",
      ar: "عنوان URL الأساسي لـ webhook الخاص بـ واتساب.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  // ---------------------------------------------------------------------------
  // Self-Service Reschedule (F2)
  // ---------------------------------------------------------------------------
  {
    key: "SELF_SERVICE_RESCHEDULE_LOCK_HOURS",
    category: "app",
    displayStrategy: "plain",
    description: {
      en: "Minimum hours before session start for self-service delay/cancel requests. Within this window, actions are disabled.",
      ar: "الحد الأدنى من الساعات قبل بدء الجلسة لطلبات التأجيل/الإلغاء الذاتية. ضمن هذه النافذة، يتم تعطيل الإجراءات.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
];
