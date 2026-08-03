/**
 * Canonical registry of environment keys eligible for DB override via the Settings page.
 *
 * The Settings → Environment Config tab lists every key declared in `environment.d.ts`
 * and allows a `super_admin` (with the `SETTINGS_EDIT_ENV` permission) to override the
 * value by writing a row to `system_settings` under the prefixed key `env::<ENV_KEY>`.
 * Resolution at runtime is DB-first / env-fallback (see `env-config-resolver.ts`).
 *
 * Exclusion rules (also enforced in the resolver):
 * - `excludeFromDb: true` keys are env-only, never DB-managed, and are filtered out of
 *   `listEnvConfigEntries()` so they never reach GraphQL or the frontend. This includes
 *   boot-critical secrets (`DATABASE_URL`, `JWT_SECRET`, …) and operational keys such as
 *   `ADMIN_EMAIL`, `ALLOWED_ORIGIN`, and `IS_DEMO`.
 * - `NODE_ENV` and the serverless-platform detection flags are purely operational
 *   and are not part of this registry.
 * - `NEXT_PUBLIC_*` keys are intentionally excluded from the registry when they
 *   ARE build-time-inlined into client bundles (DB overrides at runtime would
 *   NOT reach already-shipped client code — misleading and dangerous).
 */

/**
 * Discriminated-union category for env-config keys.
 * Mirrors `EnvConfigCategory` in `backend/types/shared/env-config.types.ts` (kept
 * duplicated here to avoid a circular dependency from the lib layer into the
 * service/types layer).
 */
export type EnvConfigCategory =
  | "email"
  | "sms"
  | "push"
  | "fx"
  | "cache"
  | "redis"
  | "storage"
  | "auth"
  | "app"
  | "meeting"
  | "billing"
  | "whatsapp"
  | "general"
  | "cron";

/**
 * How the UI should render the value in the Settings → Environment Config table.
 * - `plain`: full value visible at all times.
 * - `db_with_mask_only`: value stored verbatim in DB, but masked in the UI with an
 *   eye-toggle to reveal on demand (use for secrets — api keys, tokens, passwords).
 */
export type EnvConfigDisplayStrategy = "plain" | "db_with_mask_only";

/**
 * Descriptor for one env-config key.
 */
export interface EnvConfigKeyDescriptor {
  /** The env var name as declared in `environment.d.ts`. */
  key: string;
  /** Logical grouping used by the Settings UI to render collapsible sections. */
  category: EnvConfigCategory;
  /** UI rendering strategy. `db_with_mask_only` implies `isSecret: true`. */
  displayStrategy: EnvConfigDisplayStrategy;
  /** Bilingual description shown in the UI. */
  description: { en: string; ar: string };
  /** True if the value is sensitive. Always paired with `displayStrategy: "db_with_mask_only"`. */
  isSecret: boolean;
  /**
   * True if the key MUST NOT be DB-managed (boot-critical / chicken-and-egg secrets).
   * The UI renders these rows as read-only with `source: "env"`.
   */
  excludeFromDb: boolean;
  /**
   * True if the key must never be exposed via Settings GraphQL. Implies
   * `excludeFromDb: true` and is filtered in the env-config service layer.
   */
  serverOnly?: boolean;
  /** Optional default value (typically undefined — the env var itself is the fallback). */
  defaultValue?: string;
}

/**
 * Canonical registry of every env-config key surfaced by the Settings page.
 * Grouped by `category` for easy scanning; the resolver turns this into a `Map`
 * keyed by `key` for O(1) lookups.
 *
 * Keep this array in sync with `environment.d.ts` whenever new env keys are added.
 */
export const ENV_CONFIG_KEYS: EnvConfigKeyDescriptor[] = [
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
    description: {
      en: "Connection URL for the local/self-hosted Redis instance.",
      ar: "رابط الاتصال بنسخة Redis المحلية أو المستضافة ذاتيًا.",
    },
    isSecret: false,
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

  // ---------------------------------------------------------------------------
  // Push notifications
  // ---------------------------------------------------------------------------
  {
    key: "PUSH_PROVIDER",
    category: "push",
    displayStrategy: "plain",
    description: {
      en: "Active push-notification provider.",
      ar: "مزوّد الإشعارات الفورية النشط.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "FIREBASE_PROJECT_ID",
    category: "push",
    displayStrategy: "plain",
    description: {
      en: "Firebase project ID for FCM push notifications.",
      ar: "معرّف مشروع Firebase لإشعارات FCM.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "FIREBASE_PRIVATE_KEY",
    category: "push",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Firebase service-account private key (PEM) for FCM push notifications.",
      ar: "مفتاح حساب خدمة Firebase الخاص (PEM) لإشعارات FCM.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "FIREBASE_CLIENT_EMAIL",
    category: "push",
    displayStrategy: "plain",
    description: {
      en: "Firebase service-account client email for FCM push notifications.",
      ar: "بريد حساب خدمة Firebase لإشعارات FCM.",
    },
    isSecret: false,
    excludeFromDb: false,
  },

  // ---------------------------------------------------------------------------
  // Misc / app-wide
  // ---------------------------------------------------------------------------
  {
    key: "ALLOWED_ORIGIN",
    category: "app",
    displayStrategy: "plain",
    description: {
      en: "Allowed CORS origin for browser requests.",
      ar: "الأصل المسموح به لطلبات CORS من المتصفح.",
    },
    isSecret: false,
    excludeFromDb: true,
    serverOnly: true,
  },
  {
    key: "GRAPHQL_PATH",
    category: "app",
    displayStrategy: "plain",
    description: {
      en: "Mount path of the GraphQL endpoint.",
      ar: "مسار تثبيت نقطة GraphQL.",
    },
    isSecret: false,
    excludeFromDb: true,
    serverOnly: true,
  },
  {
    key: "SIGNED_URL_CLEANUP_STRATEGY",
    category: "app",
    displayStrategy: "plain",
    description: {
      en: "Strategy for cleaning up expired signed URLs (lazy / cron / both / disabled).",
      ar: "استراتيجية تنظيف روابط التحميل المنتهية (lazy / cron / both / disabled).",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "SIGNED_URL_CLEANUP_CRON_SCHEDULE",
    category: "app",
    displayStrategy: "plain",
    description: {
      en: "Cron expression for the signed-URL cleanup job (used when strategy includes `cron`).",
      ar: "تعبير cron لمهمة تنظيف روابط التحميل (يُستخدم عندما تتضمّن الاستراتيجية `cron`).",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "CRON_SECRET",
    category: "app",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Shared secret required to invoke cron-only HTTP endpoints.",
      ar: "سرّ مشترك مطلوب لاستدعاء نقاط النهاية المخصّصة لـ cron فقط.",
    },
    isSecret: true,
    excludeFromDb: true,
  },
  {
    key: "CRON_QUEUE_BACKEND",
    category: "cron",
    displayStrategy: "plain",
    description: {
      en: "Queue backend for cron job execution (PG_BOSS, BULLMQ_POSTGRES, BULLMQ_REDIS, CUSTOM_SQL).",
      ar: "خلفية قائمة الانتظار لتنفيذ مهام cron (PG_BOSS, BULLMQ_POSTGRES, BULLMQ_REDIS, CUSTOM_SQL).",
    },
    isSecret: false,
    excludeFromDb: false,
    defaultValue: "PG_BOSS",
  },
  {
    key: "CRON_QUEUE_MAX_BATCH",
    category: "cron",
    displayStrategy: "plain",
    description: {
      en: "Maximum number of cron runs the ticker claims per invocation.",
      ar: "الحد الأقصى لعدد عمليات تشغيل cron التي يطالب بها المؤشّر لكل استدعاء.",
    },
    isSecret: false,
    excludeFromDb: false,
    defaultValue: "25",
  },
  {
    key: "CRON_QUEUE_WORKER_CONCURRENCY",
    category: "cron",
    displayStrategy: "plain",
    description: {
      en: "Number of concurrent jobs the in-process worker can execute.",
      ar: "عدد المهام المتزامنة التي يمكن للعامل داخل العملية تنفيذها.",
    },
    isSecret: false,
    excludeFromDb: false,
    defaultValue: "1",
  },
  {
    key: "CRON_QUEUE_WORKER_TIMEOUT",
    category: "cron",
    displayStrategy: "plain",
    description: {
      en: "Maximum duration in milliseconds for the standalone cron worker before it exits (default: 270000 = 4.5 minutes).",
      ar: "الحد الأقصى لمدة عامل cron المستقل بالميلي ثانية قبل أن يخرج (الافتراضي: 270000 = 4.5 دقيقة).",
    },
    isSecret: false,
    excludeFromDb: false,
    defaultValue: "270000",
  },
  {
    key: "CRON_EXECUTION_MODE",
    category: "cron",
    displayStrategy: "plain",
    description: {
      en: "Cron execution mode: vercel (Pro, every-min ticker) | vercel-daily (Hobby, daily only) | external (cron-job.org/QStash/GitHub Actions) | standalone (separate worker)",
      ar: "وضع تنفيذ cron: vercel (Pro، تِكر كل دقيقة) | vercel-daily (Hobby، يومي فقط) | external (cron-job.org/QStash/GitHub Actions) | standalone (عامل منفصل)",
    },
    isSecret: false,
    excludeFromDb: false,
    defaultValue: "vercel-daily",
  },
  {
    key: "CRON_FX_REFRESH_SCHEDULE",
    category: "cron",
    displayStrategy: "plain",
    description: {
      en: "Cron schedule for FX rate refresh (default: 0 6 * * * = daily 06:00 UTC)",
      ar: "جدول cron لتحديث أسعار الصرف (الافتراضي: 0 6 * * * = يومياً 06:00 UTC)",
    },
    isSecret: false,
    excludeFromDb: false,
    defaultValue: "0 6 * * *",
  },
  {
    key: "CRON_CLASS_REMINDERS_SCHEDULE",
    category: "cron",
    displayStrategy: "plain",
    description: {
      en: "Cron schedule for class reminders (default: 0 6 * * * = daily 06:00 UTC)",
      ar: "جدول cron لتذكيرات الحصص (الافتراضي: 0 6 * * * = يومياً 06:00 UTC)",
    },
    isSecret: false,
    excludeFromDb: false,
    defaultValue: "0 6 * * *",
  },
  {
    key: "CRON_TICKER_SCHEDULE",
    category: "cron",
    displayStrategy: "plain",
    description: {
      en: "Cron schedule for ticker (default: * * * * * = every minute). Only used in 'vercel' mode.",
      ar: "جدول cron للمؤشر (الافتراضي: * * * * * = كل دقيقة). يستخدم فقط في وضع 'vercel'.",
    },
    isSecret: false,
    excludeFromDb: false,
    defaultValue: "* * * * *",
  },
  {
    key: "CRON_EXTERNAL_ENABLED",
    category: "cron",
    displayStrategy: "plain",
    description: {
      en: "Enable external cron scheduler integration. When true, documents the external endpoint for services like cron-job.org, QStash, GitHub Actions.",
      ar: "تفعيل تكامل المجدول الخارجي. عند التفعيل، يوثق نقطة النهاية الخارجية للخدمات مثل cron-job.org و QStash و GitHub Actions.",
    },
    isSecret: false,
    excludeFromDb: false,
    defaultValue: "false",
  },
  {
    key: "CRON_EXTERNAL_ENDPOINT",
    category: "cron",
    displayStrategy: "plain",
    description: {
      en: "External cron endpoint path (default: /api/cron/ticker). The endpoint that external schedulers will call.",
      ar: "مسار نقطة نهاية cron الخارجية (الافتراضي: /api/cron/ticker). نقطة النهاية التي ستستدعيها المجدولات الخارجية.",
    },
    isSecret: false,
    excludeFromDb: false,
    defaultValue: "/api/cron/ticker",
  },
  {
    key: "CRON_EXTERNAL_SCHEDULE",
    category: "cron",
    displayStrategy: "plain",
    description: {
      en: "Cron schedule for external scheduler (default: * * * * * = every minute). Used by external services like cron-job.org, QStash, GitHub Actions.",
      ar: "جدول cron للمجدول الخارجي (الافتراضي: * * * * * = كل دقيقة). يستخدم من قبل الخدمات الخارجية مثل cron-job.org و QStash و GitHub Actions.",
    },
    isSecret: false,
    excludeFromDb: false,
    defaultValue: "* * * * *",
  },
  {
    key: "CRON_EXTERNAL_SECRET",
    category: "cron",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Secret for external cron authentication (default: CRON_SECRET). Used in Authorization: Bearer header.",
      ar: "سر المصادقة لـ cron الخارجي (الافتراضي: CRON_SECRET). يستخدم في رأس Authorization: Bearer.",
    },
    isSecret: true,
    excludeFromDb: false,
    defaultValue: "",
  },
  {
    key: "ENABLE_LOGGING",
    category: "app",
    displayStrategy: "plain",
    description: {
      en: "Server-side master switch for verbose server logging and the /api/logs client-log ingestion route.",
      ar: "المفتاح الرئيسي من جهة الخادم لتفعيل السجلات المطوّلة ومسار استقبال سجلات العميل /api/logs.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "NEXT_PUBLIC_ENABLE_USERS_DIRECTORY",
    category: "app",
    displayStrategy: "plain",
    description: {
      en: 'Enables the consolidated Users directory at `/users` (set to "true" or "false"). DB override applies at runtime for navigation and page redirects.',
      ar: 'يفعّل دليل المستخدمين الموحّد على `/users` (اضبطه على "true" أو "false"). تطبيق قاعدة البيانات يعمل وقت التشغيل للتنقل وإعادة التوجيه.',
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "IS_DEMO",
    category: "app",
    displayStrategy: "plain",
    description: {
      en: 'Authoritative server-side gate for the demoLogin mutation. Must be "true" for demo login to work.',
      ar: 'بوابة الخادم المعتمدة لتفعيل demoLogin. يجب ضبطها على "true" ليعمل تسجيل الدخول التجريبي.',
    },
    isSecret: false,
    excludeFromDb: true,
    serverOnly: true,
  },
  {
    key: "GOOGLE_FONTS_API_KEY",
    category: "app",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Google Fonts developer API key used by the font-loader utilities.",
      ar: "مفتاح Google Fonts API الذي يستخدمه محمّل الخطوط.",
    },
    isSecret: true,
    excludeFromDb: true,
    serverOnly: true,
  },

  // ---------------------------------------------------------------------------
  // Boot-critical / chicken-and-egg secrets — display only, NEVER DB-overridden
  // ---------------------------------------------------------------------------
  {
    key: "DATABASE_URL",
    category: "auth",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Postgres connection string. Boot-critical: needed to read system_settings, so cannot itself be DB-managed.",
      ar: "رابط اتصال Postgres. حرج عند الإقلاع: يلزم لقراءة system_settings، لذا لا يمكن إدارته من قاعدة البيانات نفسها.",
    },
    isSecret: true,
    excludeFromDb: true,
  },
  {
    key: "DATABASE_ENCRYPTION_KEY",
    category: "auth",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Key used by field-encryption.ts to encrypt/decrypt DB column values. Boot-critical secret.",
      ar: "المفتاح المستخدم في field-encryption.ts لتشفير/فك تشفير أعمدة قاعدة البيانات. سرّ حرج عند الإقلاع.",
    },
    isSecret: true,
    excludeFromDb: true,
  },
  {
    key: "JWT_SECRET",
    category: "auth",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "JWT signing secret. Boot-critical — read before any DB session is established.",
      ar: "سرّ توقيع JWT. حرج عند الإقلاع — يُقرأ قبل إنشاء أي جلسة قاعدة بيانات.",
    },
    isSecret: true,
    excludeFromDb: true,
  },
  {
    key: "GRAPHQL_ENCRYPTION_KEY",
    category: "auth",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Key used to encrypt/decrypt GraphQL response payloads. Boot-critical secret.",
      ar: "مفتاح تشفير/فك تشفير حمولات استجابة GraphQL. سرّ حرج عند الإقلاع.",
    },
    isSecret: true,
    excludeFromDb: true,
  },

  // ---------------------------------------------------------------------------
  // Meeting Integrations (Zoom S2S, Google Meet DWD, Microsoft Teams Graph)
  // ---------------------------------------------------------------------------
  {
    key: "ZOOM_ACCOUNT_ID",
    category: "meeting",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Zoom Server-to-Server OAuth account ID.",
      ar: "معرّف حساب Zoom لمصادقة Server-to-Server OAuth.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "ZOOM_CLIENT_ID",
    category: "meeting",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Zoom Server-to-Server OAuth client ID.",
      ar: "معرّف العميل لـ Zoom Server-to-Server OAuth.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "ZOOM_CLIENT_SECRET",
    category: "meeting",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Zoom Server-to-Server OAuth client secret.",
      ar: "سرّ العميل لـ Zoom Server-to-Server OAuth.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "GOOGLE_MEET_SERVICE_ACCOUNT_JSON",
    category: "meeting",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Google service-account JSON key for Google Meet (Domain-Wide Delegation).",
      ar: "مفتاح JSON لحساب خدمة Google لـ Google Meet (تفويض على مستوى النطاق).",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "ZOOM_REQUIRED_SCOPES",
    category: "meeting",
    displayStrategy: "plain",
    description: {
      en: "Comma-separated OAuth scopes required for Zoom Server-to-Server OAuth.",
      ar: "نطاقات OAuth المطلوبة لـ Zoom Server-to-Server OAuth مفصولة بفواصل.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "GOOGLE_MEET_IMPERSONATE_SUBJECT",
    category: "meeting",
    displayStrategy: "plain",
    description: {
      en: "Google Workspace user email to impersonate for Meet space creation.",
      ar: "بريد مستخدم Google Workspace لانتحال صلاحياته لإنشاء مساحات Meet.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "GOOGLE_MEET_CLIENT_ID",
    category: "meeting",
    displayStrategy: "plain",
    description: {
      en: "Google Meet OAuth client ID.",
      ar: "معرّف عميل OAuth لـ Google Meet.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "GOOGLE_MEET_CLIENT_SECRET",
    category: "meeting",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Google Meet OAuth client secret.",
      ar: "سرّ عميل OAuth لـ Google Meet.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "MS_TEAMS_TENANT_ID",
    category: "meeting",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Microsoft Teams (Entra ID) tenant ID for client-credentials OAuth.",
      ar: "معرّف مستأجر Microsoft Teams (Entra ID) لمصادقة client-credentials.",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "MS_TEAMS_CLIENT_ID",
    category: "meeting",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Microsoft Teams (Entra ID) app registration client ID.",
      ar: "معرّف العميل لتسجيل تطبيق Microsoft Teams (Entra ID).",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "MS_TEAMS_CLIENT_SECRET",
    category: "meeting",
    displayStrategy: "db_with_mask_only",
    description: {
      en: "Microsoft Teams (Entra ID) app registration client secret.",
      ar: "سرّ العميل لتسجيل تطبيق Microsoft Teams (Entra ID).",
    },
    isSecret: true,
    excludeFromDb: false,
  },
  {
    key: "MS_TEAMS_ORGANIZER_USER_ID",
    category: "meeting",
    displayStrategy: "plain",
    description: {
      en: "Entra user object ID of the Teams meeting organizer.",
      ar: "معرّف كائن مستخدم Entra لمنظّم اجتماع Teams.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "MS_TEAMS_REQUIRED_SCOPES",
    category: "meeting",
    displayStrategy: "plain",
    description: {
      en: "Comma-separated OAuth scopes required for Microsoft Teams client-credentials OAuth.",
      ar: "نطاقات OAuth المطلوبة لـ Microsoft Teams client-credentials مفصولة بفواصل.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "OAUTH_REDIRECT_BASE_URL",
    category: "meeting",
    displayStrategy: "plain",
    description: {
      en: "Base URL for per-teacher OAuth callback redirects.",
      ar: "الرابط الأساسي لإعادة توجيه OAuth لكل معلّم.",
    },
    isSecret: false,
    excludeFromDb: false,
  },

  // WhatsApp
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
];

export { HIDDEN_ENV_CONFIG_KEYS } from "@/shared/constants/env-config-keys";

export function isEnvConfigKeyExposedInSettings(descriptor: EnvConfigKeyDescriptor): boolean {
  return !descriptor.excludeFromDb;
}
