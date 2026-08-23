import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  booleanColumn,
  createTable,
  index,
  jsonbColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import {
  complaintCategoryEnum,
  complaintStatusEnum,
  devicePlatformEnum,
  notificationChannelEnum,
  notificationDeliveryStatusEnum,
  notificationEventTypeEnum,
  suggestionStatusEnum,
} from "@/backend/db/schema/enums";
import { parents } from "@/backend/db/schema/parents/parents";
import { students } from "@/backend/db/schema/students/students";
import { users } from "@/backend/db/schema/users/users";
import type { NotificationMetadata } from "@/backend/types";

/**
 * User Notification Preferences table.
 * Controls granular opt-in/opt-out for various communication channels and events.
 *
 * Row-Level Security (RLS) Policies:
 * - Enabled on the `user_notification_preferences` table.
 * - Policies:
 *   - `notification_preferences_access_policy`: Ensures users can only view, insert, update, or delete their own preferences.
 */
export const userNotificationPreferences = createTable(
  "user_notification_preferences",
  {
    id: uuidColumn("id"),
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .references(() => users.id as never, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull(),
    eventType: notificationEventTypeEnum("event_type").notNull(),
    enabled: booleanColumn("enabled").notNull().default(true),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    index("user_notification_preferences_user_id_idx").on(table.userId),
    index("user_notification_preferences_channel_idx").on(table.channel),
    index("user_notification_preferences_event_type_idx").on(table.eventType),
    index("user_notification_preferences_enabled_idx").on(table.enabled),
    uniqueIndex("user_notification_preferences_unique_idx").on(table.userId, table.channel, table.eventType),
  ]
);

/**
 * User Device Tokens table.
 * Stores mobile and web push notification tokens per user device.
 *
 * Row-Level Security (RLS) Policies:
 * - Enabled on the `user_device_tokens` table.
 * - Policies:
 *   - `user_device_tokens_access_policy`: Ensures users can only manage their own tokens.
 */
export const userDeviceTokens = createTable(
  "user_device_tokens",
  {
    id: uuidColumn("id"),
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .references(() => users.id as never, { onDelete: "cascade" }),
    token: varcharColumn("token", { length: 512 }).notNull(),
    platform: devicePlatformEnum("platform").notNull(),
    deviceName: varcharColumn("device_name", { length: 255 }),
    isActive: booleanColumn("is_active").notNull().default(true),
    lastUsedAt: timestampColumn("last_used_at"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    index("user_device_tokens_user_id_idx").on(table.userId),
    index("user_device_tokens_is_active_idx").on(table.isActive),
    index("user_device_tokens_last_used_at_idx").on(table.lastUsedAt),
    index("user_device_tokens_user_id_is_active_idx").on(table.userId, table.isActive),
    uniqueIndex("user_device_tokens_token_unique_idx").on(table.token),
  ]
);

/**
 * Notification Deliveries table.
 * Tracks the lifecycle of each notification from creation through delivery and engagement.
 *
 * Row-Level Security (RLS) Policies:
 * - Enabled on the `notification_deliveries` table.
 * - Policies:
 *   - `notification_deliveries_access_policy`: Ensures users can only view their own deliveries.
 */
export const notificationDeliveries = createTable(
  "notification_deliveries",
  {
    id: uuidColumn("id"),
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .references(() => users.id as never, { onDelete: "cascade" }),
    deviceTokenId: uuidDefaultColumn("device_token_id").references(() => userDeviceTokens.id as never, {
      onDelete: "set null",
    }),
    channel: notificationChannelEnum("channel").notNull(),
    eventType: notificationEventTypeEnum("event_type").notNull(),
    status: notificationDeliveryStatusEnum("status").notNull().default("PENDING"),
    title: varcharColumn("title", { length: 255 }),
    body: textColumn("body"),
    providerMessageId: varcharColumn("provider_message_id", { length: 255 }),
    failureReason: textColumn("failure_reason"),
    webhookPayload: jsonbColumn("webhook_payload"),
    metadata: jsonbColumn<NotificationMetadata | null>("metadata"),
    sentAt: timestampColumn("sent_at"),
    deliveredAt: timestampColumn("delivered_at"),
    openedAt: timestampColumn("opened_at"),
    failedAt: timestampColumn("failed_at"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    index("notification_deliveries_user_id_idx").on(table.userId),
    index("notification_deliveries_status_idx").on(table.status),
    index("notification_deliveries_event_type_idx").on(table.eventType),
    index("notification_deliveries_channel_idx").on(table.channel),
    index("notification_deliveries_created_at_idx").on(table.createdAt),
    uniqueIndex("notification_deliveries_provider_message_id_unique")
      .on(table.providerMessageId)
      .where(sql`${table.providerMessageId} IS NOT NULL`),
    index("notification_deliveries_device_token_id_idx").on(table.deviceTokenId),
    index("notification_deliveries_sent_at_idx").on(table.sentAt),
    index("notification_deliveries_delivered_at_idx").on(table.deliveredAt),
    index("notification_deliveries_failed_at_idx").on(table.failedAt),
    index("notification_deliveries_opened_at_idx").on(table.openedAt),
    index("notification_deliveries_user_id_status_created_at_idx").on(table.userId, table.status, table.createdAt),
    index("notification_deliveries_status_created_at_idx").on(table.status, table.createdAt),
  ]
);

// NOTE: PostgreSQL Row-Level Security (RLS) policies are active on this table.
// Soft-deleted records (deleted_at IS NOT NULL) are automatically filtered out for SELECT/UPDATE.
// On SQLite, RLS is not available — soft-delete filtering is handled at the repo layer.
export const complaints = createTable(
  "complaints",
  {
    id: uuidColumn("id"),
    parentId: uuidDefaultColumn("parent_id")
      .notNull()
      .references(() => parents.id as never, { onDelete: "restrict" }),
    studentId: uuidDefaultColumn("student_id").references(() => students.id as never, { onDelete: "set null" }),
    category: complaintCategoryEnum("category").notNull(),
    submitterEmail: varcharColumn("submitter_email", { length: 255 }).notNull(),
    body: textColumn("body").notNull(),
    status: complaintStatusEnum("status").notNull(),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
    index("complaints_status_idx").on(table.status),
    index("complaints_parent_id_idx").on(table.parentId),
    index("complaints_student_id_idx").on(table.studentId),
    index("complaints_category_idx").on(table.category),
    index("complaints_created_at_idx").on(table.createdAt),
    index("complaints_updated_at_idx").on(table.updatedAt),
  ]
);

export const complaintResponses = createTable(
  "complaint_responses",
  {
    id: uuidColumn("id"),
    complaintId: uuidDefaultColumn("complaint_id")
      .notNull()
      .references(() => complaints.id as never, { onDelete: "cascade" }),
    responderUserId: uuidDefaultColumn("responder_user_id").references(() => users.id as never, {
      onDelete: "set null",
    }),
    body: textColumn("body").notNull(),
    emailSent: booleanColumn("email_sent").notNull().default(false),
    createdAt: timestampColumn("created_at").notNull(),
  },
  table => [
    index("complaint_responses_complaint_id_idx").on(table.complaintId),
    index("complaint_responses_responder_user_id_idx").on(table.responderUserId),
    index("complaint_responses_created_at_idx").on(table.createdAt),
    index("complaint_responses_email_sent_idx").on(table.emailSent),
  ]
);

// NOTE: PostgreSQL Row-Level Security (RLS) policies are active on this table.
// Soft-deleted records (deleted_at IS NOT NULL) are automatically filtered out for SELECT/UPDATE.
// On SQLite, RLS is not available — soft-delete filtering is handled at the repo layer.
export const suggestions = createTable(
  "suggestions",
  {
    id: uuidColumn("id"),
    parentId: uuidDefaultColumn("parent_id")
      .notNull()
      .references(() => parents.id as never, { onDelete: "restrict" }),
    submitterName: varcharColumn("submitter_name", { length: 255 }).notNull(),
    body: textColumn("body").notNull(),
    status: suggestionStatusEnum("status").notNull().default("PENDING"),
    // Self-referential FK: duplicateOfId → suggestions.id (ON DELETE SET NULL).
    // Originally declared as a standalone foreignKey() in extras; converted to inline
    // .references() for cross-dialect compatibility (standalone foreignKey() is PG-only).
    duplicateOfId: uuidDefaultColumn("duplicate_of_id").references((): AnyPgColumn => suggestions.id as never, {
      onDelete: "set null",
    }),
    adminResponse: textColumn("admin_response"),
    reviewedByUserId: uuidDefaultColumn("reviewed_by_user_id").references(() => users.id as never, {
      onDelete: "set null",
    }),
    reviewedAt: timestampColumn("reviewed_at"),
    emailSentAt: timestampColumn("email_sent_at"),
    createdAt: timestampColumn("created_at").notNull(),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
    index("suggestions_parent_id_idx").on(table.parentId),
    index("suggestions_status_idx").on(table.status),
    index("suggestions_duplicate_of_id_idx").on(table.duplicateOfId),
    index("suggestions_reviewed_by_user_id_idx").on(table.reviewedByUserId),
    index("suggestions_deleted_at_idx").on(table.deletedAt),
    index("suggestions_active_created_at_idx")
      .on(table.createdAt)
      .where(sql`${table.deletedAt} IS NULL`),
    index("suggestions_created_at_idx").on(table.createdAt),
    index("suggestions_reviewed_at_idx").on(table.reviewedAt),
    index("suggestions_email_sent_at_idx").on(table.emailSentAt),
  ]
);

// NOTE: PostgreSQL Row-Level Security (RLS) policies are active on this table.
// Soft-deleted records (deleted_at IS NOT NULL) are automatically filtered out for SELECT/UPDATE.
// On SQLite, RLS is not available — soft-delete filtering is handled at the repo layer.
export const learningResources = createTable(
  "learning_resources",
  {
    id: uuidColumn("id"),
    displayName: varcharColumn("display_name", { length: 255 }).notNull(),
    // NOTE: Tech debt: filePath doesn't have a strict FK to storage_files.path. It relies on application-level integrity and file_usage polymorphic refs.
    filePath: varcharColumn("file_path", { length: 1024 }).notNull(),
    uploadedByUserId: uuidDefaultColumn("uploaded_by_user_id")
      .notNull()
      .references(() => users.id as never, { onDelete: "cascade" }),
    createdAt: timestampColumn("created_at").notNull(),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
    index("learning_resources_deleted_at_idx").on(table.deletedAt),
    index("learning_resources_uploaded_by_user_id_idx").on(table.uploadedByUserId),
    index("learning_resources_created_at_idx").on(table.createdAt),
    index("learning_resources_display_name_idx").on(table.displayName),
  ]
);
