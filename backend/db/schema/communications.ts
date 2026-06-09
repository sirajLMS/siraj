import { boolean, index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { complaintCategoryEnum, complaintStatusEnum } from "./enums";
import { parents } from "./parents";
import { students } from "./students";
import { users } from "./users";

export const complaints = pgTable(
  "complaints",
  {
    id: serial("id").primaryKey(),
    parentId: integer("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "restrict" }),
    studentId: integer("student_id").references(() => students.id, { onDelete: "set null" }),
    category: complaintCategoryEnum("category").notNull(),
    submitterEmail: varchar("submitter_email", { length: 255 }).notNull(),
    body: text("body").notNull(),
    status: complaintStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("complaints_status_idx").on(table.status), index("complaints_parent_id_idx").on(table.parentId)]
);

export const complaintResponses = pgTable(
  "complaint_responses",
  {
    id: serial("id").primaryKey(),
    complaintId: integer("complaint_id")
      .notNull()
      .references(() => complaints.id, { onDelete: "cascade" }),
    responderUserId: integer("responder_user_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    emailSent: boolean("email_sent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("complaint_responses_complaint_id_idx").on(table.complaintId)]
);

export const suggestions = pgTable(
  "suggestions",
  {
    id: serial("id").primaryKey(),
    parentId: integer("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "restrict" }),
    submitterName: varchar("submitter_name", { length: 255 }).notNull(),
    body: text("body").notNull(),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("suggestions_parent_id_idx").on(table.parentId)]
);

export const learningResources = pgTable(
  "learning_resources",
  {
    id: serial("id").primaryKey(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    // NOTE: Tech debt: filePath doesn't have a strict FK to storage_files.path. It relies on application-level integrity and file_usage polymorphic refs.
    filePath: varchar("file_path", { length: 1024 }).notNull(),
    uploadedByUserId: integer("uploaded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [index("learning_resources_deleted_at_idx").on(table.deletedAt)]
);
