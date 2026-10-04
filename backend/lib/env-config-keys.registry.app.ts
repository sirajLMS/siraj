import type { EnvConfigKeyDescriptor } from "@/backend/lib/env-config-keys";

export const ENV_CONFIG_KEYS_APP: EnvConfigKeyDescriptor[] = [
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
];
