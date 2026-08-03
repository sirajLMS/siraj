import { dashboardSettingsEnvironmentEn } from "@/shared/locale/en/dashboard/settings/environment";
import { dashboardSettingsGeneralEn } from "@/shared/locale/en/dashboard/settings/general";
import { dashboardSettingsMeetingIntegrationsEn } from "@/shared/locale/en/dashboard/settings/meeting-integrations";
import { dashboardSettingsSessionEn } from "@/shared/locale/en/dashboard/settings/session";
import { dashboardSettingsSiteContentEn } from "@/shared/locale/en/dashboard/settings/siteContent";
import { dashboardSettingsTimezonesEn } from "@/shared/locale/en/dashboard/settings/timezones";
import type { SettingsLabels } from "@/shared/locale/types/dashboard/settings";

const auditEntityTypes = {
  SYSTEM: "System",
  SYSTEM_SETTING: "System setting",
  SITE_CONTENT: "Site content",
  SESSION_CONFIG: "Session config",
  ENV_CONFIG: "Environment config",
  PERMISSION: "Permission",
  PERMISSION_GROUP: "Permission group",
  USER_PERMISSION: "User permission",
  EXCHANGE_RATE: "Exchange rate",
  WHATSAPP_ACCOUNT: "WhatsApp account",
  USER: "User",
  STUDENT: "Student",
  TEACHER: "Teacher",
  PARENT: "Parent",
  INVOICE: "Invoice",
  PAYMENT: "Payment",
} as const;

const auditActions = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  UPSERT: "Upsert",
  STATUS_CHANGE: "Status change",
  GRANT: "Grant",
  REVOKE: "Revoke",
  ASSIGN: "Assign",
  UNASSIGN: "Unassign",
  APPROVE: "Approve",
  REJECT: "Reject",
  ACTIVATE: "Activate",
  DEACTIVATE: "Deactivate",
  RESTORE: "Restore",
} as const;

export const dashboardSettingsEn: SettingsLabels = {
  title: "Settings",
  subtitle: "Manage system configuration, environment variables, and platform defaults.",
  comingSoon: "Coming soon",
  tabs: {
    general: "General",
    environment: "Environment",
    session: "Session",
    audit: "Audit",
    siteContent: "Site Content",
    timezones: "Timezones",
    meetingIntegrations: "Meeting Integrations",
  },
  audit: {
    emptyMessage: "No audit log entries match the current filters.",
    filters: {
      entityType: "Entity type",
      action: "Action",
      dateRange: "Date range",
      fromDate: "From",
      toDate: "To",
      all: "All",
    },
    columns: {
      createdAt: "Date",
      entityType: "Entity type",
      action: "Action",
      description: "Description",
      actor: "Actor",
      entityId: "Entity ID",
    },
    entityTypes: auditEntityTypes,
    actions: auditActions,
  },
  environment: dashboardSettingsEnvironmentEn,
  general: dashboardSettingsGeneralEn,
  meetingIntegrations: dashboardSettingsMeetingIntegrationsEn,
  session: dashboardSettingsSessionEn,
  siteContent: dashboardSettingsSiteContentEn,
  timezones: dashboardSettingsTimezonesEn,
};
