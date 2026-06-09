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
      .references(() => parents.id, { onDelete: "cascade" }),
    studentId: integer("student_id").references(() => students.id, { onDelete: "set null" }),
    category: complaintCategoryEnum("category").notNull(),
    submitterEmail: varchar("submitter_email", { length: 255 }).notNull(),
    body: text("body").notNull(),
    status: complaintStatusEnum("status").notNull(),
    adminResponse: text("admin_response"),
    respondedByUserId: integer("responded_by_user_id").references(() => users.id, { onDelete: "set null" }),
    respondedAt: timestamp("responded_at", { precision: 3 }),
    responseEmailSent: boolean("response_email_sent").notNull().default(false),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
  },
  table => [index("complaints_status_idx").on(table.status), index("complaints_parent_id_idx").on(table.parentId)]
);

export const suggestions = pgTable(
  "suggestions",
  {
    id: serial("id").primaryKey(),
    parentId: integer("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    submitterName: varchar("submitter_name", { length: 255 }).notNull(),
    body: text("body").notNull(),
    emailSentAt: timestamp("email_sent_at", { precision: 3 }),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
  },
  table => [index("suggestions_parent_id_idx").on(table.parentId)]
);

export const learningResources = pgTable(
  "learning_resources",
  {
    id: serial("id").primaryKey(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    filePath: varchar("file_path", { length: 1024 }).notNull(),
    uploadedByUserId: integer("uploaded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
    deletedAt: timestamp("deleted_at", { precision: 3 }),
  },
  table => [index("learning_resources_deleted_at_idx").on(table.deletedAt)]
);
