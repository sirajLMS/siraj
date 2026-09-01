import type { OAuthFlowLabels } from "@/shared/locale/types/dashboard/oauth-flow";

export const dashboardOAuthFlowAr: OAuthFlowLabels = {
  connectingTo: (provider: string) => `جارٍ الاتصال بـ ${provider}…`,
  redirectingToProvider: (provider: string) => `جارٍ إعادة توجيهك إلى ${provider}…`,
  connectionSuccessful: "تم الاتصال بنجاح!",
  connectionFailed: "فشل الاتصال. يرجى المحاولة مرة أخرى.",
  tokenExpired: "انتهت صلاحية جلستك.",
  tokenExpiringSoon: "ستنتهي صلاحية جلستك قريباً.",
  reconnectNow: "إعادة الاتصال الآن",
  remindMeLater: "ذكّرني لاحقاً",
  statusConnected: "متصل",
  statusNotConnected: "غير متصل",
  statusExpiring: "قارب الانتهاء",
  statusExpired: "منتهي",
  expiresInDays: (days: number) => {
    if (days === 1) return "ينتهي خلال يوم واحد";
    if (days === 2) return "ينتهي خلال يومين";
    return `ينتهي خلال ${days} أيام`;
  },
  statusAriaLabel: "حالة اتصال OAuth",
};
