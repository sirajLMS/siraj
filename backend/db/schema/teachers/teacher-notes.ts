import {
  booleanColumn,
  createTable,
  index,
  integerColumn,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";

export const teacherImportantNotes = createTable(
  "teacher_important_notes",
  {
    id: uuidColumn("id"),
    teacherId: uuidDefaultColumn("teacher_id").references(() => teachers.id, { onDelete: "restrict" }),
    title: varcharColumn("title", { length: 300 }).notNull(),
    body: textColumn("body"),
    isPublished: booleanColumn("is_published").notNull().default(false),
    priority: integerColumn("priority").notNull().default(0),
    startsAt: timestampColumn("starts_at"),
    expiresAt: timestampColumn("expires_at"),
    createdByUserId: uuidDefaultColumn("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
    index("teacher_important_notes_teacher_id_idx").on(table.teacherId),
    index("teacher_important_notes_is_published_idx").on(table.isPublished),
    index("teacher_important_notes_deleted_at_idx").on(table.deletedAt),
    index("teacher_important_notes_created_by_user_id_idx").on(table.createdByUserId),
  ]
);
