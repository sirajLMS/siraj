import {
  booleanColumn,
  createTable,
  index,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { classInstances, classStatusEvents } from "@/backend/db/schema/classes/scheduling";
import { notificationDeliveries } from "@/backend/db/schema/communications/communications";
import { students } from "@/backend/db/schema/students/students";

export const groupClasses = createTable(
  "group_classes",
  {
    id: uuidColumn("id"),
    classInstanceId: uuidDefaultColumn("class_instance_id")
      .notNull()
      .references(() => classInstances.id as never, { onDelete: "cascade" }),
    courseName: varcharColumn("course_name", { length: 255 }).notNull(),
    teacherName: varcharColumn("teacher_name", { length: 255 }).notNull(),
    classType: varcharColumn("class_type", { length: 50 }).notNull(),
    originalDate: timestampColumn("original_date"),
    rescheduledDate: timestampColumn("rescheduled_date"),
    timeSlot: varcharColumn("time_slot", { length: 100 }).notNull(),
    status: varcharColumn("status", { length: 50 }).notNull(),
    auditRemark: textColumn("audit_remark"),
    auditLoggedAt: timestampColumn("audit_logged_at").notNull(),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    index("group_classes_class_instance_id_idx").on(table.classInstanceId),
    index("group_classes_status_idx").on(table.status),
    index("group_classes_created_at_idx").on(table.createdAt),
    index("group_classes_audit_logged_at_idx").on(table.auditLoggedAt),
    index("group_classes_class_type_idx").on(table.classType),
    index("group_classes_original_date_idx").on(table.originalDate),
    index("group_classes_rescheduled_date_idx").on(table.rescheduledDate),
  ]
);

export const groupClassEnrollments = createTable(
  "group_class_enrollments",
  {
    id: uuidColumn("id"),
    groupClassId: uuidDefaultColumn("group_class_id")
      .notNull()
      .references(() => groupClasses.id as never, { onDelete: "cascade" }),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id as never, { onDelete: "restrict" }),
    studentIdNumber: varcharColumn("student_id_number", { length: 50 }),
    attendanceStatus: varcharColumn("attendance_status", { length: 20 }).notNull().default("pending"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    uniqueIndex("group_class_enrollments_unique_idx").on(table.groupClassId, table.studentId),
    index("group_class_enrollments_group_class_id_idx").on(table.groupClassId),
    index("group_class_enrollments_student_id_idx").on(table.studentId),
    index("group_class_enrollments_attendance_status_idx").on(table.attendanceStatus),
    index("group_class_enrollments_created_at_idx").on(table.createdAt),
  ]
);

export const classCommunications = createTable(
  "class_communications",
  {
    id: uuidColumn("id"),
    groupClassId: uuidDefaultColumn("group_class_id")
      .notNull()
      .references(() => groupClasses.id as never, { onDelete: "cascade" }),
    type: varcharColumn("type", { length: 20 }).notNull(),
    title: varcharColumn("title", { length: 255 }).notNull(),
    description: textColumn("description"),
    isActive: booleanColumn("is_active").notNull().default(true),
    isDelivered: booleanColumn("is_delivered"),
    notificationDeliveryId: uuidDefaultColumn("notification_delivery_id").references(() => notificationDeliveries.id as never, {
      onDelete: "set null",
    }),
    classStatusEventId: uuidDefaultColumn("class_status_event_id").references(() => classStatusEvents.id as never, {
      onDelete: "set null",
    }),
    timestamp: timestampColumn("timestamp"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
  },
  table => [
    index("class_communications_group_class_id_idx").on(table.groupClassId),
    index("class_communications_type_idx").on(table.type),
    index("class_communications_is_active_idx").on(table.isActive),
    index("class_communications_is_delivered_idx").on(table.isDelivered),
    index("class_communications_notification_delivery_id_idx").on(table.notificationDeliveryId),
    index("class_communications_class_status_event_id_idx").on(table.classStatusEventId),
    index("class_communications_timestamp_idx").on(table.timestamp),
    index("class_communications_created_at_idx").on(table.createdAt),
  ]
);
