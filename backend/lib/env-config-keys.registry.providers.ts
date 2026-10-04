import type { EnvConfigKeyDescriptor } from "@/backend/lib/env-config-keys";

export const ENV_CONFIG_KEYS_PROVIDERS: EnvConfigKeyDescriptor[] = [
  // ---------------------------------------------------------------------------
  // Auth / Admin (secret)
  // ---------------------------------------------------------------------------
  {
    key: "ADMIN_EMAIL",
    category: "auth",
    displayStrategy: "plain",
    description: {
      en: "Default super-admin email used by the bootstrap seeder to grant the first privileged account.",
      ar: "بريد المشرف الافتراضي الذي يستخدمه المحمّل لمنح حساب الامتياز الأول.",
    },
    isSecret: false,
    excludeFromDb: true,
    serverOnly: true,
  },
  {
    key: "ADMIN_PASSWORD",
    category: "auth",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Initial password for the bootstrap super-admin account. Rotating this does NOT rotate live user passwords.",
      ar: "كلمة مرور حساب المشرف الافتراضي. تغييرها لا يغيّر كلمات مرور المستخدمين الحاليين.",
    },
    isSecret: true,
    excludeFromDb: true,
    serverOnly: true,
  },

  // ---------------------------------------------------------------------------
  // Storage / GCP
  // ---------------------------------------------------------------------------
  {
    key: "STORAGE_PROVIDER",
    category: "storage",
    displayStrategy: "plain",
    description: {
      en: "Active storage backend for uploaded files.",
      ar: "مزوّد التخزين الفعلي للملفات المرفوعة.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "LOCAL_STORAGE_PATH",
    category: "storage",
    displayStrategy: "plain",
    description: {
      en: "Local filesystem path where uploads are written when STORAGE_PROVIDER=local.",
      ar: "مسار نظام الملفات المحلي حيث تُكتب الملفات عندما STORAGE_PROVIDER=local.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "GCP_PROJECT_ID",
    category: "storage",
    displayStrategy: "plain",
    description: {
      en: "Google Cloud project ID used by the GCP storage backend.",
      ar: "معرّف مشروع Google Cloud المستخدم من قِبل مزوّد تخزين GCP.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "GCP_BUCKET_NAME",
    category: "storage",
    displayStrategy: "plain",
    description: {
      en: "Google Cloud Storage bucket name used by the GCP storage backend.",
      ar: "اسم حاوية Google Cloud Storage المستخدمة من قِبل مزوّد تخزين GCP.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "GCP_SECRET_VERSION",
    category: "storage",
    displayStrategy: "plain",
    description: {
      en: "Version string for the GCP Secret Manager secret that holds the storage service-account credentials.",
      ar: "إصدار السرّ في GCP Secret Manager الذي يحتوي على بيانات اعتماد حساب خدمة التخزين.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "GCP_SECRET_ID",
    category: "storage",
    displayStrategy: "plain",
    description: {
      en: "Identifier of the GCP Secret Manager secret holding storage service-account credentials.",
      ar: "معرّف سرّ GCP Secret Manager الذي يحوي بيانات اعتماد حساب خدمة التخزين.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "BLOB_READ_WRITE_TOKEN",
    category: "storage",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Read/write token for Vercel Blob storage access.",
      ar: "رمز القراءة/الكتابة للوصول إلى تخزين Vercel Blob.",
    },
    isSecret: true,
    excludeFromDb: false,
  },

  // ---------------------------------------------------------------------------
  // FX Ingestion
  // ---------------------------------------------------------------------------
  {
    key: "FX_PROVIDER",
    category: "fx",
    displayStrategy: "plain",
    description: {
      en: "Active exchange-rate provider. Mirror of the existing `fx_provider` system setting.",
      ar: "مزوّد أسعار الصرف النشط. مرآة لإعداد `fx_provider` في system_settings.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "OPENEXCHANGERATES_APP_ID",
    category: "fx",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "App ID for the OpenExchangeRates FX provider.",
      ar: "معرّف التطبيق لمزوّد OpenExchangeRates.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "FIXER_API_KEY",
    category: "fx",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "API key for the Fixer.io FX provider.",
      ar: "مفتاح API لمزوّد Fixer.io.",
    },
    isSecret: true,
    excludeFromDb: false,
  },

  // ---------------------------------------------------------------------------
  // Redis
  // ---------------------------------------------------------------------------
  {
    key: "REDIS_PROVIDER",
    category: "redis",
    displayStrategy: "plain",
    description: {
      en: "Active Redis backend (local or upstash).",
      ar: "مزوّد Redis النشط (محلي أو Upstash).",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "REDIS_URL",
    category: "redis",
    displayStrategy: "plain",
    maskUrlCredentials: true,
    description: {
      en: "Connection URL for the local/self-hosted Redis instance. Stored encrypted at rest; credentials are masked in the Settings list and the audit trail.",
      ar: "رابط الاتصال بنسخة Redis المحلية أو المستضافة ذاتيًا. يُخزَّن مشفّرًا؛ تُخفى بيانات الاعتماد في قائمة الإعدادات وسجل التدقيق.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "UPSTASH_REDIS_REST_URL",
    category: "redis",
    displayStrategy: "plain",
    description: {
      en: "REST URL for the Upstash Redis provider.",
      ar: "رابط REST لمزوّد Upstash Redis.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "UPSTASH_REDIS_REST_TOKEN",
    category: "redis",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "REST token for the Upstash Redis provider.",
      ar: "رمز REST لمزوّد Upstash Redis.",
    },
    isSecret: true,
    excludeFromDb: false,
  },

  // ---------------------------------------------------------------------------
  // Cache
  // ---------------------------------------------------------------------------
  {
    key: "CACHE_PROVIDER",
    category: "cache",
    displayStrategy: "plain",
    description: {
      en: "Active cache backend (redis or postgres).",
      ar: "مزوّد الكاش النشط (redis أو postgres).",
    },
    isSecret: false,
    excludeFromDb: false,
  },

  // ---------------------------------------------------------------------------
  // Email
  // ---------------------------------------------------------------------------
  {
    key: "EMAIL_PROVIDER",
    category: "email",
    displayStrategy: "plain",
    description: {
      en: "Active transactional email provider.",
      ar: "مزوّد البريد الإلكتروني النشط.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "RESEND_API_KEY",
    category: "email",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "API key for the Resend email provider.",
      ar: "مفتاح API لمزوّد Resend.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "RESEND_FROM_EMAIL",
    category: "email",
    displayStrategy: "plain",
    description: {
      en: "Default `From:` address for outbound transactional email via Resend.",
      ar: "عنوان `From:` الافتراضي للبريد الصادر عبر Resend.",
    },
    isSecret: false,
    excludeFromDb: false,
  },

  // ---------------------------------------------------------------------------
  // SMS
  // ---------------------------------------------------------------------------
  {
    key: "SMS_PROVIDER",
    category: "sms",
    displayStrategy: "plain",
    description: {
      en: "Active SMS provider.",
      ar: "مزوّد الرسائل النصية النشط.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "TWILIO_ACCOUNT_SID",
    category: "sms",
    displayStrategy: "plain",
    description: {
      en: "Twilio account SID.",
      ar: "معرّف حساب Twilio.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "TWILIO_AUTH_TOKEN",
    category: "sms",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Twilio auth token.",
      ar: "رمز مصادقة Twilio.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "TWILIO_FROM_NUMBER",
    category: "sms",
    displayStrategy: "plain",
    description: {
      en: "Originating phone number for outbound SMS via Twilio.",
      ar: "رقم المرسِل الافتراضي للرسائل النصية الصادرة عبر Twilio.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
];
