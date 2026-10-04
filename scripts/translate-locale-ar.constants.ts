export const LOCALE_ROOT = "shared/locale";
export const EN_ROOT = `${LOCALE_ROOT}/en`;
export const AR_ROOT = `${LOCALE_ROOT}/ar`;
export const DEFAULT_BASE_URL = "http://localhost:20128/v1";
export const DEFAULT_MODEL = "nvidia/moonshotai/kimi-k3";
export const DEFAULT_OUT_PREFIX = "scratch/locale-ar";
/** Entries translated per API call. Keep small: generation time is roughly
 *  proportional to OUTPUT size, and the remote NIM throughput lets big batches
 *  (60 entries ≈ 12k+ tokens) overrun the request timeout. */
export const CHUNK_SIZE = 30;
export const MAX_TOKENS_FLOOR = 4096;
export const MAX_TOKENS_CEILING = 12288;
export const TEMPERATURE = 0.2;
export const REQUEST_TIMEOUT_MS = 480_000;
export const RETRY_DELAYS_MS = [2000, 5000];

export const EXPORT_CONST_REGEX = /export\s+const\s+[A-Za-z_$][\w$]*/;

export const KEY_REGEX = /^(?:[A-Za-z_$][\w$]*|"[^"]+"|'[^']+')/;
export const ARROW_REGEX = /=>/;

export const RETURN_REGEX = /\breturn\b/g;
export const IF_REGEX = /\bif\s*\(/g;

/**
 * Terminology glossary sent with every request. Keys are English source terms,
 * values are the canonical Arabic renderings used across the app.
 * Grounded in existing ar/ files (grep counts measured 2026-08-30).
 */
export const GLOSSARY: ReadonlyArray<readonly [string, string]> = [
  ["Student", "طالب"],
  ["Teacher", "معلم"],
  ["Parent", "ولي أمر"],
  ["Staff", "موظف"],
  ["Super Admin / System Administrator", "مدير النظام"],
  ["Supervisor", "مشرف"],
  ["Sign in / Login", "تسجيل الدخول"],
  ["Email", "البريد الإلكتروني"],
  ["Password", "كلمة المرور"],
  ["Dashboard", "لوحة التحكم"],
  ["Class (teaching session)", "حصة"],
  ["Schedule", "جدول"],
  ["Attendance", "الحضور"],
  ["Invoice", "فاتورة"],
  ["Subscription", "اشتراك"],
  ["Balance / credits", "الرصيد"],
  ["Notification", "إشعار"],
  ["Profile", "الملف الشخصي"],
  ["Status", "الحالة"],
  ["Filters", "الفلاتر"],
  ["Identifier / ID", "معرّف (always with shadda, never معرف)"],
  ["Payin / money collected from parents", "التحصيل"],
  ["Payout / money sent to teachers", "الصرف"],
  ["National ID", "الرقم القومي"],
  ["Advance class type (booked in advance)", "حصة مسبقة / مسبقة"],
  ["Trial class type", "حصة تجريبية / تجريبية (feminine for classes)"],
  ["Regular class type", "حصة عادية / عادية (feminine for classes)"],
  ["Person trial status badge", "تجريبي (masculine for people)"],
];
