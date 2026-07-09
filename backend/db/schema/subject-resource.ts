import { integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { classSubjects } from "@/backend/db/schema/class-subject";
import { learningResources } from "@/backend/db/schema/communications";

export const subjectResources = pgTable(
  "subject_resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => classSubjects.id, { onDelete: "cascade" }),
    learningResourceId: uuid("learning_resource_id")
      .notNull()
      .references(() => learningResources.id, { onDelete: "cascade" }),
    resourceType: varchar("resource_type", { length: 50 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    uniqueIndex("subject_resources_subject_id_learning_resource_id_idx").on(table.subjectId, table.learningResourceId),
  ]
);
