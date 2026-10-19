import { createdAtColumn, primaryKeyColumn } from "@/backend/db/schema/__shared__/columnHelpers";
import {
  bigintColumn,
  booleanColumn,
  createTable,
  index,
  textColumn,
  timestampColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { invoices } from "@/backend/db/schema/billing/billing";
import { classInstances, recurringSchedules } from "@/backend/db/schema/classes/scheduling";
import { complaints, learningResources } from "@/backend/db/schema/communications/communications";
import { parents } from "@/backend/db/schema/parents/parents";
import { students } from "@/backend/db/schema/students/students";
import { staffProfiles } from "@/backend/db/schema/teachers/staff";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";

export const storageFiles = createTable(
  "storage_file",
  {
    ...primaryKeyColumn(),
    path: textColumn("path").notNull().unique(),
    isProtected: booleanColumn("is_protected").notNull().default(false),
  },
  table => [index("storage_files_is_protected_idx").on(table.isProtected)]
);

/**
 * Junction tables replacing the polymorphic file_usage table.
 * Each entity that uses files now has its own junction table with proper foreign keys.
 * This ensures database-level referential integrity and automatic cascading deletes.
 */

export const userFiles = createTable(
  "user_files",
  {
    ...primaryKeyColumn(),
    fileId: uuidDefaultColumn("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    usageType: varcharColumn("usage_type", { length: 100 }).notNull(),
    ...createdAtColumn({ withDefaultNow: true }),
  },
  table => [index("user_files_file_id_idx").on(table.fileId), index("user_files_user_id_idx").on(table.userId)]
);

export const teacherFiles = createTable(
  "teacher_files",
  {
    ...primaryKeyColumn(),
    fileId: uuidDefaultColumn("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    teacherId: uuidDefaultColumn("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    usageType: varcharColumn("usage_type", { length: 100 }).notNull(),
    ...createdAtColumn({ withDefaultNow: true }),
  },
  table => [
    index("teacher_files_file_id_idx").on(table.fileId),
    index("teacher_files_teacher_id_idx").on(table.teacherId),
  ]
);

export const studentFiles = createTable(
  "student_files",
  {
    ...primaryKeyColumn(),
    fileId: uuidDefaultColumn("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    usageType: varcharColumn("usage_type", { length: 100 }).notNull(),
    ...createdAtColumn({ withDefaultNow: true }),
  },
  table => [
    index("student_files_file_id_idx").on(table.fileId),
    index("student_files_student_id_idx").on(table.studentId),
  ]
);

export const parentFiles = createTable(
  "parent_files",
  {
    ...primaryKeyColumn(),
    fileId: uuidDefaultColumn("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    parentId: uuidDefaultColumn("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    usageType: varcharColumn("usage_type", { length: 100 }).notNull(),
    ...createdAtColumn({ withDefaultNow: true }),
  },
  table => [index("parent_files_file_id_idx").on(table.fileId), index("parent_files_parent_id_idx").on(table.parentId)]
);

export const invoiceFiles = createTable(
  "invoice_files",
  {
    ...primaryKeyColumn(),
    fileId: uuidDefaultColumn("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    invoiceId: uuidDefaultColumn("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    usageType: varcharColumn("usage_type", { length: 100 }).notNull(),
    ...createdAtColumn({ withDefaultNow: true }),
  },
  table => [
    index("invoice_files_file_id_idx").on(table.fileId),
    index("invoice_files_invoice_id_idx").on(table.invoiceId),
  ]
);

export const complaintFiles = createTable(
  "complaint_files",
  {
    ...primaryKeyColumn(),
    fileId: uuidDefaultColumn("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    complaintId: uuidDefaultColumn("complaint_id")
      .notNull()
      .references(() => complaints.id, { onDelete: "cascade" }),
    usageType: varcharColumn("usage_type", { length: 100 }).notNull(),
    ...createdAtColumn({ withDefaultNow: true }),
  },
  table => [
    index("complaint_files_file_id_idx").on(table.fileId),
    index("complaint_files_complaint_id_idx").on(table.complaintId),
  ]
);

export const learningResourceFiles = createTable(
  "learning_resource_files",
  {
    ...primaryKeyColumn(),
    fileId: uuidDefaultColumn("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    learningResourceId: uuidDefaultColumn("learning_resource_id")
      .notNull()
      .references(() => learningResources.id, { onDelete: "cascade" }),
    usageType: varcharColumn("usage_type", { length: 100 }).notNull(),
    ...createdAtColumn({ withDefaultNow: true }),
  },
  table => [
    index("learning_resource_files_file_id_idx").on(table.fileId),
    index("learning_resource_files_res_id_idx").on(table.learningResourceId),
  ]
);

export const staffProfileFiles = createTable(
  "staff_profile_files",
  {
    ...primaryKeyColumn(),
    fileId: uuidDefaultColumn("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    staffProfileId: uuidDefaultColumn("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    usageType: varcharColumn("usage_type", { length: 100 }).notNull(),
    ...createdAtColumn({ withDefaultNow: true }),
  },
  table => [
    index("staff_profile_files_file_id_idx").on(table.fileId),
    index("staff_profile_files_staff_id_idx").on(table.staffProfileId),
  ]
);

export const recurringScheduleFiles = createTable(
  "recurring_schedule_files",
  {
    ...primaryKeyColumn(),
    fileId: uuidDefaultColumn("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    recurringScheduleId: uuidDefaultColumn("recurring_schedule_id")
      .notNull()
      .references(() => recurringSchedules.id, { onDelete: "cascade" }),
    usageType: varcharColumn("usage_type", { length: 100 }).notNull(),
    ...createdAtColumn({ withDefaultNow: true }),
  },
  table => [
    index("recurring_schedule_files_file_id_idx").on(table.fileId),
    index("recurring_schedule_files_sched_id_idx").on(table.recurringScheduleId),
  ]
);

export const classInstanceFiles = createTable(
  "class_instance_files",
  {
    ...primaryKeyColumn(),
    fileId: uuidDefaultColumn("file_id")
      .notNull()
      .references(() => storageFiles.id, { onDelete: "cascade" }),
    classInstanceId: uuidDefaultColumn("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    usageType: varcharColumn("usage_type", { length: 100 }).notNull(),
    ...createdAtColumn({ withDefaultNow: true }),
  },
  table => [
    index("class_instance_files_file_id_idx").on(table.fileId),
    index("class_instance_files_instance_id_idx").on(table.classInstanceId),
  ]
);

export const storageDirectories = createTable(
  "storage_directory",
  {
    ...primaryKeyColumn(),
    path: varcharColumn("path", { length: 1024 }).notNull().unique(),
    allowUploads: booleanColumn("allow_uploads").notNull().default(true),
    allowDelete: booleanColumn("allow_delete").notNull().default(true),
    allowMove: booleanColumn("allow_move").notNull().default(true),
    allowCreateSubDirs: booleanColumn("allow_create_sub_dirs").notNull().default(true),
    allowDeleteFiles: booleanColumn("allow_delete_files").notNull().default(true),
    allowMoveFiles: booleanColumn("allow_move_files").notNull().default(true),
    isProtected: booleanColumn("is_protected").notNull().default(false),
    protectChildren: booleanColumn("protect_children").notNull().default(false),
  },
  table => [
    index("storage_directories_is_protected_idx").on(table.isProtected),
    index("storage_directories_allow_uploads_idx").on(table.allowUploads),
  ]
);

export const signedUrls = createTable(
  "signed_url",
  {
    id: varcharColumn("id", { length: 64 }).primaryKey(), // UUID token
    filePath: varcharColumn("file_path", { length: 1024 }).notNull(),
    contentType: varcharColumn("content_type", { length: 255 }).notNull(),
    fileSize: bigintColumn("file_size").notNull(), // File size in bytes
    contentHash: varcharColumn("content_hash", { length: 128 }).notNull(), // base64 or hex encoded hash
    expiresAt: timestampColumn("expires_at").notNull(),
    // M2 fix: bind signed URL to the user who created it, so only the original
    // uploader can write via the token (prevents token-sharing attacks).
    uploadedByUserId: uuidDefaultColumn("uploaded_by_user_id").references(() => users.id, {
      onDelete: "cascade",
    }), // nullable for backfill
    ...createdAtColumn(),
    used: booleanColumn("used").notNull().default(false),
  },
  table => [
    index("signed_url_expires_at_idx").on(table.expiresAt),
    index("signed_url_used_expires_idx").on(table.used, table.expiresAt),
    index("signed_url_created_at_idx").on(table.createdAt),
    index("signed_url_file_path_idx").on(table.filePath),
    index("signed_url_content_hash_idx").on(table.contentHash),
    index("signed_url_uploaded_by_user_id_idx").on(table.uploadedByUserId),
  ]
);
