import {
  booleanColumn,
  createTable,
  index,
  jsonbColumn,
  primaryKey,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { appPermissionEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";
import type { LocalizedString } from "@/shared/types";

/**
 * System and custom permissions.
 * NOTE: The isSystem field defaults to false. The database enforces a trigger constraint
 * (trg_protect_system_permissions) preventing the creation of any new system permissions (is_system = true)
 * or converting an existing custom permission to a system permission. System permissions are immutable.
 * description and category are JSONB locale maps (LocalizedString).
 */
export const permissions = createTable(
  "permissions",
  {
    id: uuidColumn("id"),
    key: appPermissionEnum("key").notNull().unique(),
    resource: varcharColumn("resource", { length: 100 }).notNull(),
    action: varcharColumn("action", { length: 100 }).notNull(),
    description: jsonbColumn<LocalizedString>("description").notNull(),
    category: jsonbColumn<LocalizedString>("category").notNull(),
    isSystem: booleanColumn("is_system").notNull().default(false),
  },
  table => [
    index("permissions_key_idx").on(table.key),
    index("permissions_resource_idx").on(table.resource),
    index("permissions_action_idx").on(table.action),
    index("permissions_is_system_idx").on(table.isSystem),
  ]
);

/**
 * Permission groups. name/description are JSONB locale maps.
 * Uniqueness is on slug only (name is localized and not unique).
 */
export const permissionGroups = createTable(
  "permission_groups",
  {
    id: uuidColumn("id"),
    name: jsonbColumn<LocalizedString>("name").notNull(),
    description: jsonbColumn<LocalizedString>("description"),
    isSystem: booleanColumn("is_system").notNull().default(false),
    slug: varcharColumn("slug", { length: 100 }).notNull().unique(),
    createdByUserId: uuidDefaultColumn("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("permission_groups_is_system_idx").on(table.isSystem),
    index("permission_groups_created_by_user_id_idx").on(table.createdByUserId),
    index("permission_groups_created_at_idx").on(table.createdAt),
    index("permission_groups_updated_at_idx").on(table.updatedAt),
  ]
);

export const groupPermissions = createTable(
  "group_permissions",
  {
    groupId: uuidDefaultColumn("group_id")
      .notNull()
      .references(() => permissionGroups.id, { onDelete: "cascade" }),
    permissionId: uuidDefaultColumn("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  table => [
    primaryKey({ columns: [table.groupId, table.permissionId] }),
    index("group_permissions_group_id_idx").on(table.groupId),
    index("group_permissions_permission_id_idx").on(table.permissionId),
  ]
);

export const userPermissionGroups = createTable(
  "user_permission_groups",
  {
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: uuidDefaultColumn("group_id")
      .notNull()
      .references(() => permissionGroups.id, { onDelete: "cascade" }),
    assignedAt: timestampColumn("assigned_at").notNull(),
    assignedByUserId: uuidDefaultColumn("assigned_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  table => [
    primaryKey({ columns: [table.userId, table.groupId] }),
    index("user_permission_groups_user_id_idx").on(table.userId),
    index("user_permission_groups_assigned_at_idx").on(table.assignedAt),
    index("user_permission_groups_assigned_by_user_id_idx").on(table.assignedByUserId),
  ]
);

export const userPermissionOverrides = createTable(
  "user_permission_overrides",
  {
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: uuidDefaultColumn("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    state: varcharColumn("state", { length: 20 }).notNull(), // 'GRANTED' | 'DENIED'
    assignedByUserId: uuidDefaultColumn("assigned_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
  },
  table => [
    primaryKey({ columns: [table.userId, table.permissionId] }),
    index("user_permission_overrides_user_id_idx").on(table.userId),
    index("user_permission_overrides_state_idx").on(table.state),
    index("user_permission_overrides_assigned_by_user_id_idx").on(table.assignedByUserId),
    index("user_permission_overrides_created_at_idx").on(table.createdAt),
  ]
);
