import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import {
  complaintCategoryEnum,
  complaintStatusEnum,
  devicePlatformEnum,
  notificationChannelEnum,
  notificationDeliveryStatusEnum,
  notificationEventTypeEnum,
} from "./enums";
import { parents } from "./parents";
import { students } from "./students";
import { users } from "./users";

/**
 * User Notification Preferences table.
 * Controls granular opt-in/opt-out for various communication channels and events.
 *
 * Row-Level Security (RLS) Policies:
 * - Enabled on the `user_notification_preferences` table.
 * - Policies:
 *   - `notification_preferences_access_policy`: Ensures users can only view, insert, update, or delete their own preferences.
 */
export const userNotificationPreferences = pgTable(
  "user_notification_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull(),
    eventType: notificationEventTypeEnum("event_type").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("user_notification_preferences_user_id_idx").on(table.userId),
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
export const userDeviceTokens = pgTable(
  "user_device_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 512 }).notNull(),
    platform: devicePlatformEnum("platform").notNull(),
    deviceName: varchar("device_name", { length: 255 }),
    isActive: boolean("is_active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("user_device_tokens_user_id_idx").on(table.userId),
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
export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceTokenId: uuid("device_token_id").references(() => userDeviceTokens.id, { onDelete: "set null" }),
    channel: notificationChannelEnum("channel").notNull(),
    eventType: notificationEventTypeEnum("event_type").notNull(),
    status: notificationDeliveryStatusEnum("status").notNull().default("PENDING"),
    title: varchar("title", { length: 255 }),
    body: text("body"),
    providerMessageId: varchar("provider_message_id", { length: 255 }),
    failureReason: text("failure_reason"),
    webhookPayload: jsonb("webhook_payload"),
    sentAt: timestamp("sent_at", { withTimezone: true, precision: 3 }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true, precision: 3 }),
    openedAt: timestamp("opened_at", { withTimezone: true, precision: 3 }),
    failedAt: timestamp("failed_at", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("notification_deliveries_user_id_idx").on(table.userId),
    index("notification_deliveries_status_idx").on(table.status),
    index("notification_deliveries_event_type_idx").on(table.eventType),
    index("notification_deliveries_channel_idx").on(table.channel),
    index("notification_deliveries_created_at_idx").on(table.createdAt),
    index("notification_deliveries_provider_message_id_idx").on(table.providerMessageId),
  ]
);

// NOTE: PostgreSQL Row-Level Security (RLS) policies are active on this table.
// Soft-deleted records (deleted_at IS NOT NULL) are automatically filtered out for SELECT/UPDATE.
export const complaints = pgTable(
  "complaints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "restrict" }),
    studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
    category: complaintCategoryEnum("category").notNull(),
    submitterEmail: varchar("submitter_email", { length: 255 }).notNull(),
    body: text("body").notNull(),
    status: complaintStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [index("complaints_status_idx").on(table.status), index("complaints_parent_id_idx").on(table.parentId)]
);

export const complaintResponses = pgTable(
  "complaint_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    complaintId: uuid("complaint_id")
      .notNull()
      .references(() => complaints.id, { onDelete: "cascade" }),
    responderUserId: uuid("responder_user_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    emailSent: boolean("email_sent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("complaint_responses_complaint_id_idx").on(table.complaintId)]
);

export const suggestions = pgTable(
  "suggestions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "restrict" }),
    submitterName: varchar("submitter_name", { length: 255 }).notNull(),
    body: text("body").notNull(),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("suggestions_parent_id_idx").on(table.parentId)]
);

// NOTE: PostgreSQL Row-Level Security (RLS) policies are active on this table.
// Soft-deleted records (deleted_at IS NOT NULL) are automatically filtered out for SELECT/UPDATE.
export const learningResources = pgTable(
  "learning_resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    // NOTE: Tech debt: filePath doesn't have a strict FK to storage_files.path. It relies on application-level integrity and file_usage polymorphic refs.
    filePath: varchar("file_path", { length: 1024 }).notNull(),
    uploadedByUserId: uuid("uploaded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [index("learning_resources_deleted_at_idx").on(table.deletedAt)]
);
