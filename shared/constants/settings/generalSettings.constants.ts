import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

export interface GeneralSettingDefinition {
  code: string;
  slug: string;
  label: string;
  description: string;
  dataType: SystemSettingDataType;
  category: SystemSettingCategory;
  defaultValue: string;
}

export const GENERAL_SETTINGS_DEFINITIONS: readonly GeneralSettingDefinition[] = [
  {
    code: "auth_max_attempts",
    slug: "auth-max-attempts",
    label: "Max Login Attempts",
    description: "Maximum failed login attempts before lockout",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Security,
    defaultValue: "5",
  },
  {
    code: "auth_lockout_minutes",
    slug: "auth-lockout-minutes",
    label: "Lockout Duration",
    description: "Lockout duration in minutes after max attempts",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Security,
    defaultValue: "15",
  },
  {
    code: "password_reset_expiry_hours",
    slug: "password-reset-expiry-hours",
    label: "Password Reset Expiry",
    description: "Password reset token expiry in hours",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Security,
    defaultValue: "24",
  },
  {
    code: "cache_default_ttl_seconds",
    slug: "cache-default-ttl-seconds",
    label: "Cache Default TTL",
    description: "Default cache TTL in seconds",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.System,
    defaultValue: "3600",
  },
  {
    code: "default_timezone",
    slug: "default-timezone",
    label: "Default Timezone",
    description: "Default timezone for the application",
    dataType: SystemSettingDataType.String,
    category: SystemSettingCategory.Scheduling,
    defaultValue: "UTC",
  },
  {
    code: "session_activation_window_before_minutes",
    slug: "session-activation-window",
    label: "Session Activation Window",
    description: "Minutes before session start when activation is allowed",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Scheduling,
    defaultValue: "15",
  },
  {
    code: "session_absent_waiting_minutes",
    slug: "session-absent-waiting",
    label: "Absent Waiting Time",
    description: "Minutes to wait before marking student absent",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Scheduling,
    defaultValue: "10",
  },
  {
    code: "session_missed_grace_minutes",
    slug: "session-missed-grace",
    label: "Missed Grace Period",
    description: "Grace period in minutes for missed sessions",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Scheduling,
    defaultValue: "5",
  },
  {
    code: "session_leave_reschedule_offset_days",
    slug: "session-leave-reschedule",
    label: "Leave Reschedule Offset",
    description: "Days offset for rescheduling leaves",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Scheduling,
    defaultValue: "7",
  },
  {
    code: "teacher_max_leaves",
    slug: "teacher-max-leaves",
    label: "Teacher Max Leaves",
    description: "Maximum monthly leaves for teachers",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Scheduling,
    defaultValue: "2",
  },
  {
    code: "student_max_leaves",
    slug: "student-max-leaves",
    label: "Student Max Leaves",
    description: "Maximum monthly leaves for students",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Scheduling,
    defaultValue: "2",
  },
  {
    code: "complaint_max_file_size_mb",
    slug: "complaint-max-file-size",
    label: "Complaint Max File Size",
    description: "Maximum file size in MB for complaints",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Communication,
    defaultValue: "10",
  },
  {
    code: "complaint_max_files_per_complaint",
    slug: "complaint-max-files",
    label: "Complaint Max Files",
    description: "Maximum files per complaint",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Communication,
    defaultValue: "3",
  },
  {
    code: "sms_rate_limit_per_hour",
    slug: "sms-rate-limit",
    label: "SMS Rate Limit",
    description: "Maximum SMS messages per hour",
    dataType: SystemSettingDataType.Integer,
    category: SystemSettingCategory.Communication,
    defaultValue: "100",
  },
  // New boolean/json settings from migration
  {
    code: "maintenance_mode",
    slug: "maintenance-mode",
    label: "Maintenance Mode",
    description: "Enable maintenance mode",
    dataType: SystemSettingDataType.Boolean,
    category: SystemSettingCategory.System,
    defaultValue: "false",
  },
  {
    code: "feature_flags",
    slug: "feature-flags",
    label: "Feature Flags",
    description: "Feature flags JSON",
    dataType: SystemSettingDataType.Json,
    category: SystemSettingCategory.System,
    defaultValue: '{"new_dashboard":false}',
  },
] as const;

export type GeneralSettingCode = (typeof GENERAL_SETTINGS_DEFINITIONS)[number]["code"];
