import { sql } from "drizzle-orm";
import { index, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { appLanguageEnum, genderEnum, studentStatusEnum } from "./enums";
import { parents } from "./parents";
import { teachers } from "./teachers";

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    parentId: integer("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    primaryTeacherId: integer("primary_teacher_id").references(() => teachers.id, { onDelete: "set null" }),
    name: varchar("name", { length: 255 }).notNull(),
    dateOfBirth: timestamp("date_of_birth", { precision: 3 }),
    gender: genderEnum("gender"),
    language: appLanguageEnum("language"),
    status: studentStatusEnum("status").notNull(),
    classesTotal: integer("classes_total").notNull().default(0),
    classesRemaining: integer("classes_remaining").notNull().default(0),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
  },
  table => [
    index("students_parent_id_idx").on(table.parentId),
    index("students_primary_teacher_id_idx").on(table.primaryTeacherId),
    index("students_status_idx").on(table.status),
    index("idx_students_name_fts").using("gin", sql`to_tsvector('simple', ${table.name})`),
    index("idx_students_name_trgm").using("gist", table.name.op("gist_trgm_ops")),
  ]
);
