export const SETTINGS_AUDIT_ENTITY_TYPE_OPTIONS = [
  "SYSTEM",
  "SYSTEM_SETTING",
  "SITE_CONTENT",
  "SESSION_CONFIG",
  "ENV_CONFIG",
  "PERMISSION",
  "PERMISSION_GROUP",
  "USER_PERMISSION",
  "EXCHANGE_RATE",
  "WHATSAPP_ACCOUNT",
  "USER",
  "STUDENT",
  "TEACHER",
  "PARENT",
  "INVOICE",
  "PAYMENT",
] as const;

export const SETTINGS_AUDIT_ACTION_OPTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "UPSERT",
  "STATUS_CHANGE",
  "GRANT",
  "REVOKE",
  "ASSIGN",
  "UNASSIGN",
  "APPROVE",
  "REJECT",
  "ACTIVATE",
  "DEACTIVATE",
  "RESTORE",
] as const;

export type SettingsAuditEntityTypeOption = (typeof SETTINGS_AUDIT_ENTITY_TYPE_OPTIONS)[number];
export type SettingsAuditActionOption = (typeof SETTINGS_AUDIT_ACTION_OPTIONS)[number];
