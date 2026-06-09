import { bigint, boolean, index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true, precision: 3 }),
  password: varchar("password", { length: 255 }).notNull(),
  rememberToken: varchar("remember_token", { length: 100 }),
  avatarFilePath: varchar("avatar_file_path", { length: 1024 }),
  isActive: boolean("is_active").notNull().default(true),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true, precision: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    ipAddress: varchar("ip_address", { length: 45 }),
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
    email: varchar("email", { length: 255 }).primaryKey(),
    token: varchar("token", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("password_reset_tokens_expires_at_idx").on(table.expiresAt)]
);
