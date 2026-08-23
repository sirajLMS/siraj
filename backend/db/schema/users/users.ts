import { sql } from "drizzle-orm";
import { createdAtColumn, primaryKeyColumn, timestampColumns } from "@/backend/db/schema/__shared__/columnHelpers";
import {
  bigintColumn,
  booleanColumn,
  checkConstraint,
  createTable,
  index,
  inetColumn,
  integerColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { accountStatusEnum, currencyCodeEnum } from "@/backend/db/schema/enums";
import { AccountStatus } from "@/backend/enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

// NOTE: PostgreSQL Row-Level Security (RLS) policies are active on this table.
// Soft-deleted records (deleted_at IS NOT NULL) are automatically filtered out for SELECT/UPDATE.
// On SQLite, RLS is not available — soft-delete filtering is handled at the repo layer.
export const users = createTable(
  "users",
  {
    ...primaryKeyColumn(),
    ...timestampColumns(),
    deletedAt: timestampColumn("deleted_at"),
    name: varcharColumn("name", { length: 255 }).notNull(),
    email: varcharColumn("email", { length: 255 }).notNull().unique(),
    emailVerifiedAt: timestampColumn("email_verified_at"),
    password: varcharColumn("password", { length: 255 }).notNull(),
    rememberTokenHash: varcharColumn("remember_token_hash", { length: 255 }),
    avatarFilePath: varcharColumn("avatar_file_path", { length: 1024 }),
    avatarUrl: varcharColumn("avatar_url", { length: 1024 }),
    phone: varcharColumn("phone", { length: 50 }),
    status: accountStatusEnum("status").notNull().default(AccountStatus.ACTIVATED),
    isSuperAdmin: booleanColumn("is_super_admin").notNull().default(false),
    timezone: varcharColumn("timezone", { length: 100 }).notNull().default(IanaTimezone.UTC),
    displayCurrency: currencyCodeEnum("display_currency").$type<CurrencyCode>(),
    lastLoginAt: timestampColumn("last_login_at"),
  },
  table => [
    // PG-only CHECK: calls the is_valid_timezone() UDF. SQLite cannot register
    // JS UDFs via libsql — timezone validation is handled at the app layer.
    checkConstraint("users_timezone_chk", sql`is_valid_timezone(${table.timezone})`, null),
    index("users_status_idx").on(table.status),
    index("users_last_login_at_idx").on(table.lastLoginAt),
    index("users_created_at_idx").on(table.createdAt),
    index("users_updated_at_idx").on(table.updatedAt),
    index("users_deleted_at_idx").on(table.deletedAt),
    index("users_display_currency_idx").on(table.displayCurrency),
    index("users_timezone_idx").on(table.timezone),
    index("users_is_super_admin_idx").on(table.isSuperAdmin),
    index("users_phone_idx").on(table.phone),
    index("users_name_idx").on(table.name),
    index("users_status_deleted_at_idx").on(table.status, table.deletedAt),
    index("users_status_created_at_idx").on(table.status, table.createdAt),
  ]
);

export const sessions = createTable(
  "sessions",
  {
    hashedId: varcharColumn("hashed_id", { length: 255 }).primaryKey(),
    userId: uuidDefaultColumn("user_id").references(() => users.id, { onDelete: "cascade" }),
    ipAddress: inetColumn("ip_address"),
    userAgent: textColumn("user_agent"),
    payload: textColumn("payload").notNull(),
    lastActivity: bigintColumn("last_activity").notNull(),
  },
  table => [
    index("sessions_user_id_index").on(table.userId),
    index("sessions_last_activity_index").on(table.lastActivity),
  ]
);

export const sessionMetadata = createTable(
  "session_metadata",
  {
    ...primaryKeyColumn(),
    ...createdAtColumn(),
    lastActivityAt: timestampColumn("last_activity_at").notNull(),
    expiresAt: timestampColumn("expires_at").notNull(),
    sessionId: varcharColumn("session_id", { length: 255 }).notNull().unique(),
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceType: varcharColumn("device_type", { length: 50 }),
    deviceName: varcharColumn("device_name", { length: 255 }),
    ipAddress: inetColumn("ip_address"),
    userAgent: textColumn("user_agent"),
  },
  table => [
    index("session_metadata_user_id_idx").on(table.userId),
    index("session_metadata_expires_at_idx").on(table.expiresAt),
    index("session_metadata_device_type_idx").on(table.deviceType),
    index("session_metadata_session_id_idx").on(table.sessionId),
  ]
);

export const sessionConfig = createTable("session_config", {
  ...primaryKeyColumn(),
  ...timestampColumns(),
  roleName: varcharColumn("role_name", { length: 100 }).notNull().unique(),
  ttlSeconds: integerColumn("ttl_seconds").notNull().default(604800),
  maxConcurrentSessions: integerColumn("max_concurrent_sessions").notNull().default(5),
});

export const passwordResetTokens = createTable(
  "password_reset_tokens",
  {
    ...primaryKeyColumn(),
    ...createdAtColumn(),
    email: varcharColumn("email", { length: 255 }).notNull(),
    hashedToken: varcharColumn("hashed_token", { length: 255 }).notNull(),
    expiresAt: timestampColumn("expires_at").notNull(),
  },
  table => [
    index("password_reset_tokens_email_idx").on(table.email),
    index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
    index("password_reset_tokens_token_idx").on(table.hashedToken),
  ]
);

export const authRateLimits = createTable(
  "auth_rate_limits",
  {
    ...primaryKeyColumn(),
    ...timestampColumns(),
    ipAddress: inetColumn("ip_address"),
    email: varcharColumn("email", { length: 255 }),
    attempts: integerColumn("attempts").notNull().default(1),
    lockedUntil: timestampColumn("locked_until"),
  },
  table => [
    index("auth_rate_limits_ip_idx").on(table.ipAddress),
    index("auth_rate_limits_email_idx").on(table.email),
    uniqueIndex("auth_rate_limits_ip_email_unique_idx").on(table.ipAddress, table.email),
  ]
);
