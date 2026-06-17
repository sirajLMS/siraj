import { db } from "@/backend/db/drizzleDb";
import { classInstances } from "@/backend/db/schema/scheduling";
import logger from "@/backend/lib/logger";
import type { RecurringScheduleEntity, StudentEntity, TeacherEntity } from "@/backend/types";

function generateInstancesData(
  defaultClass: RecurringScheduleEntity,
  defaultTeacher: TeacherEntity,
  defaultStudent: StudentEntity,
  now: Date
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const createTime = (hours: number) => {
    const start = new Date(today);
    start.setHours(hours, 0, 0, 0);
    const end = new Date(today);
    end.setHours(hours + 1, 0, 0, 0);
    return { start, end };
  };

  const t1 = createTime(10);
  const t2 = createTime(12);
  const t3 = createTime(14);

  return [
    {
      recurringScheduleId: defaultClass.id,
      teacherId: defaultTeacher.id,
      studentId: defaultStudent.id,
      scheduledStartAt: t1.start,
      scheduledEndAt: t1.end,
      durationMinutes: 60,
      executionState: "NOT_ACTIVATED" as const,
      outcome: "PENDING" as const,
      classType: "REGULAR" as const,
      idempotencyKey: "demo_instance_scheduled_today",
      createdAt: now,
      updatedAt: now,
    },
    {
      recurringScheduleId: defaultClass.id,
      teacherId: defaultTeacher.id,
      studentId: defaultStudent.id,
      scheduledStartAt: t2.start,
      scheduledEndAt: t2.end,
      durationMinutes: 60,
      executionState: "COMPLETED" as const,
      outcome: "TAKEN" as const,
      classType: "TRIAL" as const,
      actualStartAt: t2.start,
      actualEndAt: t2.end,
      idempotencyKey: "demo_instance_completed_today",
      createdAt: now,
      updatedAt: now,
    },
    {
      recurringScheduleId: defaultClass.id,
      teacherId: defaultTeacher.id,
      studentId: defaultStudent.id,
      scheduledStartAt: t3.start,
      scheduledEndAt: t3.end,
      durationMinutes: 60,
      executionState: "COMPLETED" as const,
      outcome: "ABSENT" as const,
      classType: "REGULAR" as const,
      actualStartAt: t3.start,
      actualEndAt: t3.end,
      idempotencyKey: "demo_instance_cancelled_today",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export async function seedOrGet(
  classesList: RecurringScheduleEntity[],
  teachersList: TeacherEntity[],
  studentsList: StudentEntity[]
) {
  logger.info("Seeding system class instances...");
  const now = new Date();

  if (!classesList?.length || !teachersList?.length || !studentsList?.length) {
    throw new Error("Missing required seed data for class instances.");
  }

  const instancesData = generateInstancesData(classesList[0], teachersList[0], studentsList[0], now);
  const results = [];

  for (const instance of instancesData) {
    const [inserted] = await db
      .insert(classInstances)
      .values(instance)
      .onConflictDoUpdate({
        target: classInstances.idempotencyKey,
        set: {
          scheduledStartAt: instance.scheduledStartAt,
          scheduledEndAt: instance.scheduledEndAt,
          executionState: instance.executionState,
          outcome: instance.outcome,
          updatedAt: now,
        },
      })
      .returning();
    results.push(inserted);
  }

  logger.info("System class instances seeded.");
  return results;
}
