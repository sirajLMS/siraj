import { index, integer, pgTable, primaryKey, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerifiedAt: timestamp("email_verified_at", { precision: 3 }),
  password: varchar("password", { length: 255 }).notNull(),
  rememberToken: varchar("remember_token", { length: 100 }),
  createdAt: timestamp("created_at", { precision: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
});

export const roles = pgTable("roles", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  t => [primaryKey({ columns: [t.userId, t.roleId] })]
);

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: integer("userId"),
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    payload: text("payload").notNull(),
    lastActivity: integer("lastActivity").notNull(),
  },
  table => [
    index("sessions_user_id_index").on(table.userId),
    index("sessions_last_activity_index").on(table.lastActivity),
  ]
);

export const passwordResetTokens = pgTable("passwordResetTokens", {
  email: varchar("email", { length: 255 }).primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { precision: 3 }),
});
