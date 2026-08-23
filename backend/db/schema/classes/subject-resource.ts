import {
  createTable,
  integerColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { classSubjects } from "@/backend/db/schema/classes/class-subject";
import { learningResources } from "@/backend/db/schema/communications/communications";

export const subjectResources = createTable(
  "subject_resources",
  {
    id: uuidColumn("id"),
    subjectId: uuidDefaultColumn("subject_id")
      .notNull()
      .references(() => classSubjects.id, { onDelete: "cascade" }),
    learningResourceId: uuidDefaultColumn("learning_resource_id")
      .notNull()
      .references(() => learningResources.id, { onDelete: "cascade" }),
    resourceType: varcharColumn("resource_type", { length: 50 }),
    sortOrder: integerColumn("sort_order").notNull().default(0),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
  },
  table => [
    uniqueIndex("subject_resources_subject_id_learning_resource_id_idx").on(table.subjectId, table.learningResourceId),
  ]
);
