import { bigint, boolean, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { invoices } from "@/backend/db/schema/billing/billing";
import { classInstances, recurringSchedules } from "@/backend/db/schema/classes/scheduling";
import { complaints, learningResources } from "@/backend/db/schema/communications/communications";
import { parents } from "@/backend/db/schema/parents/parents";
import { students } from "@/backend/db/schema/students/students";
import { staffProfiles } from "@/backend/db/schema/teachers/staff";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";

export const storageFiles = pgTable(
  "storage_file",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    path: text("path").notNull().unique(),
    isProtected: boolean("is_protected").notNull().default(false),
  },
  table => [index("storage_files_is_protected_idx").on(table.isProtected)]
);

/**
 * Junction tables replacing the polymorphic file_usage table.
 * Each entity that uses files now has its own junction table with proper foreign keys.
 * This ensures database-level referential integrity and automatic cascading deletes.
 */

export const userFiles = pgTable(
  "user_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    usageType: varchar("usage_type", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [index("user_files_file_id_idx").on(table.fileId), index("user_files_user_id_idx").on(table.userId)]
);

export const teacherFiles = pgTable(
  "teacher_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    usageType: varchar("usage_type", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("teacher_files_file_id_idx").on(table.fileId),
    index("teacher_files_teacher_id_idx").on(table.teacherId),
  ]
);

export const studentFiles = pgTable(
  "student_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    usageType: varchar("usage_type", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("student_files_file_id_idx").on(table.fileId),
    index("student_files_student_id_idx").on(table.studentId),
  ]
);

export const parentFiles = pgTable(
  "parent_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    usageType: varchar("usage_type", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [index("parent_files_file_id_idx").on(table.fileId), index("parent_files_parent_id_idx").on(table.parentId)]
);

export const invoiceFiles = pgTable(
  "invoice_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    usageType: varchar("usage_type", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("invoice_files_file_id_idx").on(table.fileId),
    index("invoice_files_invoice_id_idx").on(table.invoiceId),
  ]
);

export const complaintFiles = pgTable(
  "complaint_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    complaintId: uuid("complaint_id")
      .notNull()
      .references(() => complaints.id, { onDelete: "cascade" }),
    usageType: varchar("usage_type", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("complaint_files_file_id_idx").on(table.fileId),
    index("complaint_files_complaint_id_idx").on(table.complaintId),
  ]
);

export const learningResourceFiles = pgTable(
  "learning_resource_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    learningResourceId: uuid("learning_resource_id")
      .notNull()
      .references(() => learningResources.id, { onDelete: "cascade" }),
    usageType: varchar("usage_type", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("learning_resource_files_file_id_idx").on(table.fileId),
    index("learning_resource_files_res_id_idx").on(table.learningResourceId),
  ]
);

export const staffProfileFiles = pgTable(
  "staff_profile_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    staffProfileId: uuid("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    usageType: varchar("usage_type", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("staff_profile_files_file_id_idx").on(table.fileId),
    index("staff_profile_files_staff_id_idx").on(table.staffProfileId),
  ]
);

export const recurringScheduleFiles = pgTable(
  "recurring_schedule_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    recurringScheduleId: uuid("recurring_schedule_id")
      .notNull()
      .references(() => recurringSchedules.id, { onDelete: "cascade" }),
    usageType: varchar("usage_type", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("recurring_schedule_files_file_id_idx").on(table.fileId),
    index("recurring_schedule_files_sched_id_idx").on(table.recurringScheduleId),
  ]
);

export const classInstanceFiles = pgTable(
  "class_instance_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    classInstanceId: uuid("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    usageType: varchar("usage_type", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("class_instance_files_file_id_idx").on(table.fileId),
    index("class_instance_files_instance_id_idx").on(table.classInstanceId),
  ]
);

export const storageDirectories = pgTable(
  "storage_directory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    path: varchar("path", { length: 1024 }).notNull().unique(),
    allowUploads: boolean("allow_uploads").notNull().default(true),
    allowDelete: boolean("allow_delete").notNull().default(true),
    allowMove: boolean("allow_move").notNull().default(true),
    allowCreateSubDirs: boolean("allow_create_sub_dirs").notNull().default(true),
    allowDeleteFiles: boolean("allow_delete_files").notNull().default(true),
    allowMoveFiles: boolean("allow_move_files").notNull().default(true),
    isProtected: boolean("is_protected").notNull().default(false),
    protectChildren: boolean("protect_children").notNull().default(false),
  },
  table => [
    index("storage_directories_is_protected_idx").on(table.isProtected),
    index("storage_directories_allow_uploads_idx").on(table.allowUploads),
  ]
);

export const signedUrls = pgTable(
  "signed_url",
  {
    id: varchar("id", { length: 64 }).primaryKey(), // UUID token
    filePath: varchar("file_path", { length: 1024 }).notNull(),
    contentType: varchar("content_type", { length: 255 }).notNull(),
    fileSize: bigint("file_size", { mode: "bigint" }).notNull(), // File size in bytes
    contentHash: varchar("content_hash", { length: 128 }).notNull(), // base64 or hex encoded hash
    expiresAt: timestamp("expires_at", { withTimezone: true, precision: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    used: boolean("used").notNull().default(false),
  },
  table => [
    index("signed_url_expires_at_idx").on(table.expiresAt),
    index("signed_url_used_expires_idx").on(table.used, table.expiresAt),
    index("signed_url_created_at_idx").on(table.createdAt),
    index("signed_url_file_path_idx").on(table.filePath),
    index("signed_url_content_hash_idx").on(table.contentHash),
  ]
);
