import type { EnvConfigKeyDescriptor } from "@/backend/lib/env-config-keys";

export const ENV_CONFIG_KEYS_INTEGRATIONS: EnvConfigKeyDescriptor[] = [
  // ---------------------------------------------------------------------------
  // Branding & Appearance (AC-30)
  // ---------------------------------------------------------------------------
  {
    key: "NEXT_PUBLIC_APP_BRANDING",
    category: "branding",
    displayStrategy: "plain",
    description: {
      en: "JSON string of default appearance fields (colors, logo, site name/title/description, default color scheme). Parsed server-side at runtime as the tier-4 fallback when no DB row exists (AC-26). DB override applies at request time — NOT build-time-inlined into client bundles.",
      ar: "سلسلة JSON لحقول المظهر الافتراضية (الألوان، الشعار، اسم/عنوان/وصف الموقع، نظام الألوان الافتراضي). تُحلَّل من جهة الخادم وقت التشغيل كطبقة احتياطية رابعة عندما لا يوجد صف في قاعدة البيانات (AC-26). تجاوز قاعدة البيانات يُطبَّق وقت الطلب — وليس مُضمَّنًا في حزم العميل وقت البناء.",
    },
    isSecret: false,
    excludeFromDb: false,
  },
  {
    key: "APP_THEME_PRESET",
    category: "branding",
    displayStrategy: "plain",
    description: {
      en: "Built-in preset theme ID (e.g. emerald / ocean / sunset / rose / indigo / slate). Applied server-side at runtime as the preset-theme fallback (decision §14). DB override applies at request time.",
      ar: "معرّف سمة جاهزة مدمجة (مثل emerald / ocean / sunset / rose / indigo / slate). تُطبَّق من جهة الخادم وقت التشغيل كطبقة احتياطية للسمات الجاهزة (القرار §14). تجاوز قاعدة البيانات يُطبَّق وقت الطلب.",
    },
    isSecret: false,
    excludeFromDb: false,
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
];
