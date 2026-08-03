import { dashboardSettingsEnvironmentAr } from "@/shared/locale/ar/dashboard/settings/environment";
import { dashboardSettingsGeneralAr } from "@/shared/locale/ar/dashboard/settings/general";
import { dashboardSettingsSessionAr } from "@/shared/locale/ar/dashboard/settings/session";
import { dashboardSettingsSiteContentAr } from "@/shared/locale/ar/dashboard/settings/siteContent";
import { dashboardSettingsTimezonesAr } from "@/shared/locale/ar/dashboard/settings/timezones";
import type { SettingsLabels } from "@/shared/locale/types/dashboard/settings";

const auditEntityTypes = {
  SYSTEM: "النظام",
  SYSTEM_SETTING: "إعداد النظام",
  SITE_CONTENT: "محتوى الموقع",
  SESSION_CONFIG: "إعداد الجلسة",
  ENV_CONFIG: "إعداد البيئة",
  PERMISSION: "صلاحية",
  PERMISSION_GROUP: "مجموعة صلاحيات",
  USER_PERMISSION: "صلاحية المستخدم",
  EXCHANGE_RATE: "سعر الصرف",
  WHATSAPP_ACCOUNT: "حساب واتساب",
  USER: "مستخدم",
  STUDENT: "طالب",
  TEACHER: "معلم",
  PARENT: "ولي أمر",
  INVOICE: "فاتورة",
  PAYMENT: "دفعة",
} as const;

const auditActions = {
  CREATE: "إنشاء",
  UPDATE: "تحديث",
  DELETE: "حذف",
  UPSERT: "إدراج/تحديث",
  STATUS_CHANGE: "تغيير الحالة",
  GRANT: "منح",
  REVOKE: "سحب",
  ASSIGN: "تعيين",
  UNASSIGN: "إلغاء التعيين",
  APPROVE: "موافقة",
  REJECT: "رفض",
  ACTIVATE: "تفعيل",
  DEACTIVATE: "تعطيل",
  RESTORE: "استعادة",
} as const;

export const dashboardSettingsAr: SettingsLabels = {
  title: "الإعدادات",
  subtitle: "إدارة إعدادات النظام، متغيرات البيئة، والإعدادات الافتراضية للمنصة.",
  comingSoon: "قريباً",
  tabs: {
    general: "عام",
    environment: "البيئة",
    session: "الجلسة",
    audit: "التدقيق",
    siteContent: "محتوى الموقع",
    timezones: "المناطق الزمنية",
  },
  audit: {
    emptyMessage: "لا توجد سجلات تدقيق تطابق عوامل التصفية الحالية.",
    filters: {
      entityType: "نوع الكيان",
      action: "الإجراء",
      dateRange: "نطاق التاريخ",
      fromDate: "من",
      toDate: "إلى",
      all: "الكل",
    },
    columns: {
      createdAt: "التاريخ",
      entityType: "نوع الكيان",
      action: "الإجراء",
      description: "الوصف",
      actor: "الفاعل",
      entityId: "معرف الكيان",
    },
    entityTypes: auditEntityTypes,
    actions: auditActions,
  },
  environment: dashboardSettingsEnvironmentAr,
  general: dashboardSettingsGeneralAr,
  session: dashboardSettingsSessionAr,
  siteContent: dashboardSettingsSiteContentAr,
  timezones: dashboardSettingsTimezonesAr,
};
