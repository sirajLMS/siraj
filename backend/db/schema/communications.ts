import { boolean, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { complaintCategoryEnum, complaintStatusEnum } from "./enums";
import { parents } from "./parents";
import { students } from "./students";
import { users } from "./users";

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
