import { boolean, index, pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { appPermissionEnum } from "./enums";
import { users } from "./users";

/**
 * System and custom permissions.
 * NOTE: The isSystem field defaults to false. The database enforces a trigger constraint
 * (trg_protect_system_permissions) preventing the creation of any new system permissions (is_system = true)
 * or converting an existing custom permission to a system permission. System permissions are immutable.
 */
export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: appPermissionEnum("key").notNull().unique(),
    resource: varchar("resource", { length: 100 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    isSystem: boolean("is_system").notNull().default(false),
  },
  table => [index("permissions_key_idx").on(table.key)]
);

export const permissionGroups = pgTable("permission_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
});

export const groupPermissions = pgTable(
  "group_permissions",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => permissionGroups.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  table => [
    primaryKey({ columns: [table.groupId, table.permissionId] }),
    index("group_permissions_group_id_idx").on(table.groupId),
  ]
);

export const userPermissionGroups = pgTable(
  "user_permission_groups",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => permissionGroups.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true, precision: 3 }).notNull(),
    assignedByUserId: uuid("assigned_by_user_id").references(() => users.id, { onDelete: "set null" }),
  },
  table => [
    primaryKey({ columns: [table.userId, table.groupId] }),
    index("user_permission_groups_user_id_idx").on(table.userId),
  ]
);

export const userPermissionOverrides = pgTable(
  "user_permission_overrides",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    state: varchar("state", { length: 20 }).notNull(), // 'GRANTED' | 'DENIED'
    assignedByUserId: uuid("assigned_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    primaryKey({ columns: [table.userId, table.permissionId] }),
    index("user_permission_overrides_user_id_idx").on(table.userId),
  ]
);
