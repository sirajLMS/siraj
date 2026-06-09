import { bigint, boolean, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const storageFiles = pgTable("storage_file", {
  id: uuid("id").defaultRandom().primaryKey(),
  path: text("path").notNull().unique(),
  isProtected: boolean("is_protected").notNull().default(false),
});

// NOTE: PostgreSQL triggers enforce referential integrity and handle automatic cascading deletes.
// The trigger 'trg_validate_file_usage' validates reference_table and reference_id.
// Cascade delete triggers 'trg_cascade_file_usage_*' clean up usages when parent records are deleted.
export const fileUsages = pgTable("file_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  filePath: varchar("file_path", { length: 1024 }).notNull(),
  usageType: varchar("usage_type", { length: 100 }).notNull(),
  referenceId: uuid("reference_id").notNull(),
  referenceTable: varchar("reference_table", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
});

export const storageDirectories = pgTable("storage_directory", {
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
});

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
  ]
);
