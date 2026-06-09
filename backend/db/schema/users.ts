import {
  bigint,
  boolean,
  index,
  inet,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true, precision: 3 }),
  password: varchar("password", { length: 255 }).notNull(),
  rememberTokenHash: varchar("remember_token_hash", { length: 255 }),
  avatarFilePath: varchar("avatar_file_path", { length: 1024 }),
  isActive: boolean("is_active").notNull().default(true),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true, precision: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
});

export const sessions = pgTable(
  "sessions",
  {
    hashedId: varchar("hashed_id", { length: 255 }).primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    payload: text("payload").notNull(),
    lastActivity: bigint("last_activity", { mode: "bigint" }).notNull(),
  },
  table => [
    index("sessions_user_id_index").on(table.userId),
    index("sessions_last_activity_index").on(table.lastActivity),
  ]
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    hashedToken: varchar("hashed_token", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("password_reset_tokens_email_idx").on(table.email),
    index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
    index("password_reset_tokens_token_idx").on(table.hashedToken),
  ]
);

export const authRateLimits = pgTable(
  "auth_rate_limits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ipAddress: inet("ip_address"),
    email: varchar("email", { length: 255 }),
    attempts: integer("attempts").notNull().default(1),
    lockedUntil: timestamp("locked_until", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("auth_rate_limits_ip_idx").on(table.ipAddress),
    index("auth_rate_limits_email_idx").on(table.email),
    uniqueIndex("auth_rate_limits_ip_email_unique_idx").on(table.ipAddress, table.email),
  ]
);
