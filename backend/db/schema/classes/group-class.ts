import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { classInstances, classStatusEvents } from "@/backend/db/schema/classes/scheduling";
import { notificationDeliveries } from "@/backend/db/schema/communications/communications";
import { students } from "@/backend/db/schema/students/students";

export const groupClasses = pgTable(
  "group_classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classInstanceId: uuid("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    courseName: varchar("course_name", { length: 255 }).notNull(),
    teacherName: varchar("teacher_name", { length: 255 }).notNull(),
    classType: varchar("class_type", { length: 50 }).notNull(),
    originalDate: timestamp("original_date", { withTimezone: true, precision: 3 }),
    rescheduledDate: timestamp("rescheduled_date", { withTimezone: true, precision: 3 }),
    timeSlot: varchar("time_slot", { length: 100 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    auditRemark: text("audit_remark"),
    auditLoggedAt: timestamp("audit_logged_at", { withTimezone: true, precision: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("group_classes_class_instance_id_idx").on(table.classInstanceId),
    index("group_classes_status_idx").on(table.status),
  ]
);

export const groupClassEnrollments = pgTable(
  "group_class_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupClassId: uuid("group_class_id")
      .notNull()
      .references(() => groupClasses.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    studentIdNumber: varchar("student_id_number", { length: 50 }),
    attendanceStatus: varchar("attendance_status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    uniqueIndex("group_class_enrollments_unique_idx").on(table.groupClassId, table.studentId),
    index("group_class_enrollments_group_class_id_idx").on(table.groupClassId),
    index("group_class_enrollments_student_id_idx").on(table.studentId),
  ]
);

export const classCommunications = pgTable(
  "class_communications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupClassId: uuid("group_class_id")
      .notNull()
      .references(() => groupClasses.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    isDelivered: boolean("is_delivered"),
    notificationDeliveryId: uuid("notification_delivery_id").references(() => notificationDeliveries.id, {
      onDelete: "set null",
    }),
    classStatusEventId: uuid("class_status_event_id").references(() => classStatusEvents.id, {
      onDelete: "set null",
    }),
    timestamp: timestamp("timestamp", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("class_communications_group_class_id_idx").on(table.groupClassId),
    index("class_communications_type_idx").on(table.type),
  ]
);
