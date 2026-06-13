import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SoftDeleteRepository } from "@/backend/db/repo/soft-delete.repository";
import { TeacherAvailabilityRepository } from "@/backend/db/repo/teacher-availability.repository";
import { classInstances, students, teacherAssignments } from "@/backend/db/schema";
import type * as Types from "@/backend/types";

// Extract the transaction type from Drizzle
type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export namespace SchedulingRepository {
  /**
   * Helper to acquire an advisory lock for a teacher and student
   * to prevent concurrent overlap and quota race conditions.
   */
  async function acquireLocks(tx: DBTransaction, teacherId: string, studentId: string) {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('booking_teacher_' || ${teacherId}::text))`);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('booking_student_' || ${studentId}::text))`);
  }

  /**
   * Validates if a teacher is officially assigned to a student for a given time.
   */
  async function validateTeacherAssignment(tx: DBTransaction, studentId: string, teacherId: string, startTime: Date) {
    const assignments = await tx
      .select({ id: teacherAssignments.id })
      .from(teacherAssignments)
      .where(
        and(
          eq(teacherAssignments.studentId, studentId),
          eq(teacherAssignments.teacherId, teacherId),
          or(isNull(teacherAssignments.endedAt), sql`${teacherAssignments.endedAt} >= ${startTime}`)
        )
      )
      .limit(1);

    if (assignments.length === 0) {
      throw new Error(
        `Teacher ${teacherId} is not assigned to student ${studentId} for the scheduled time ${startTime.toISOString()}`
      );
    }
  }

  /**
   * Parameters for overlap checking
   */
  interface OverlapCheckParams {
    studentId: string;
    teacherId: string;
    startTime: Date;
    endTime: Date;
    zoomUrl?: string | null;
    excludeId?: string;
  }

  /**
   * Checks for overlapping class instances for the teacher, student, or zoom URL.
   */
  async function checkOverlaps(tx: DBTransaction, params: OverlapCheckParams) {
    const { studentId, teacherId, startTime, endTime, zoomUrl, excludeId } = params;
    const overlapCondition = sql`(${classInstances.scheduledStartAt}, ${classInstances.scheduledEndAt}) OVERLAPS (${startTime}, ${endTime})`;

    const teacherOverlaps = await tx
      .select({ id: classInstances.id })
      .from(classInstances)
      .where(
        and(
          eq(classInstances.teacherId, teacherId),
          isNull(classInstances.deletedAt),
          overlapCondition,
          excludeId ? ne(classInstances.id, excludeId) : undefined
        )
      )
      .limit(1);
    if (teacherOverlaps.length > 0) throw new Error("Teacher is already booked for this time period");

    const studentOverlaps = await tx
      .select({ id: classInstances.id })
      .from(classInstances)
      .where(
        and(
          eq(classInstances.studentId, studentId),
          isNull(classInstances.deletedAt),
          overlapCondition,
          excludeId ? ne(classInstances.id, excludeId) : undefined
        )
      )
      .limit(1);
    if (studentOverlaps.length > 0) throw new Error("Student is already booked for this time period");

    if (zoomUrl) {
      const zoomOverlaps = await tx
        .select({ id: classInstances.id })
        .from(classInstances)
        .where(
          and(
            eq(classInstances.zoomMeetingUrl, zoomUrl),
            isNull(classInstances.deletedAt),
            overlapCondition,
            excludeId ? ne(classInstances.id, excludeId) : undefined
          )
        )
        .limit(1);
      if (zoomOverlaps.length > 0) throw new Error("Zoom meeting URL is already in use for this time period");
    }
  }

  /**
   * Helper to adjust student class quota when booking details change.
   */
  async function adjustQuotaOnUpdate(
    t: DBTransaction,
    existing: Types.ClassInstanceEntity,
    input: Partial<Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">>,
    isBeingSoftDeleted: boolean
  ) {
    const studentId = input.studentId ?? existing.studentId;
    const wasDeducted = existing.quotaDeducted && existing.deletedAt === null;
    const effectiveNewDeducted = (input.quotaDeducted ?? existing.quotaDeducted) && !isBeingSoftDeleted;

    if (!wasDeducted && effectiveNewDeducted) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
        .where(eq(students.id, studentId));
    } else if (wasDeducted && !effectiveNewDeducted) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
        .where(eq(students.id, studentId));
    } else if (wasDeducted && effectiveNewDeducted && input.studentId && input.studentId !== existing.studentId) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
        .where(eq(students.id, existing.studentId));
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
        .where(eq(students.id, input.studentId));
    }
  }

  export const createClassInstance = async (
    input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
    tx?: DBTransaction
  ): Promise<Types.ClassInstanceEntity> => {
    const runner = async (t: DBTransaction) => {
      await acquireLocks(t, input.teacherId, input.studentId);
      await validateTeacherAssignment(t, input.studentId, input.teacherId, input.scheduledStartAt);
      await TeacherAvailabilityRepository.validateBookingAvailability(
        input.teacherId,
        input.scheduledStartAt,
        input.scheduledEndAt,
        t
      );
      await checkOverlaps(t, {
        studentId: input.studentId,
        teacherId: input.teacherId,
        startTime: input.scheduledStartAt,
        endTime: input.scheduledEndAt,
        zoomUrl: input.zoomMeetingUrl,
      });

      if (input.quotaDeducted) {
        await t
          .update(students)
          .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
          .where(eq(students.id, input.studentId));
      }

      const [created] = await t
        .insert(classInstances)
        .values({
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return created;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const updateClassInstance = async (
    id: string,
    input: Partial<Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">>,
    tx?: DBTransaction
  ): Promise<Types.ClassInstanceEntity> => {
    const runner = async (t: DBTransaction) => {
      const results = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
      if (results.length === 0) throw new Error(`Class instance ${id} not found`);
      const existing = results[0];

      const studentId = input.studentId ?? existing.studentId;
      const teacherId = input.teacherId ?? existing.teacherId;
      const startTime = input.scheduledStartAt ?? existing.scheduledStartAt;
      const endTime = input.scheduledEndAt ?? existing.scheduledEndAt;
      const zoomUrl = input.zoomMeetingUrl !== undefined ? input.zoomMeetingUrl : existing.zoomMeetingUrl;
      const isBeingSoftDeleted = input.deletedAt !== undefined && input.deletedAt !== null;

      await acquireLocks(t, teacherId, studentId);

      if (!isBeingSoftDeleted) {
        await validateTeacherAssignment(t, studentId, teacherId, startTime);
        await TeacherAvailabilityRepository.validateBookingAvailability(teacherId, startTime, endTime, t);
        await checkOverlaps(t, {
          studentId,
          teacherId,
          startTime,
          endTime,
          zoomUrl,
          excludeId: id,
        });
      }

      await adjustQuotaOnUpdate(t, existing, input, isBeingSoftDeleted);

      const [updated] = await t
        .update(classInstances)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(classInstances.id, id))
        .returning();

      return updated;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const deleteClassInstance = async (id: string, tx?: DBTransaction): Promise<Types.ClassInstanceEntity> => {
    const runner = async (t: DBTransaction) => {
      const results = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
      if (results.length === 0) throw new Error(`Class instance ${id} not found`);
      const existing = results[0];

      if (existing.quotaDeducted && existing.deletedAt === null) {
        await t
          .update(students)
          .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
          .where(eq(students.id, existing.studentId));
      }

      const { entity: deleted } = await SoftDeleteRepository.softDeleteClassInstance(id, null, t);
      return deleted;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const rescheduleClassInstance = async (
    originalClassId: string,
    input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
    tx?: DBTransaction
  ): Promise<Types.ClassInstanceEntity> => {
    const runner = async (t: DBTransaction) => {
      const results = await t.select().from(classInstances).where(eq(classInstances.id, originalClassId)).limit(1);
      if (results.length === 0) throw new Error("Original class not found");
      const original = results[0];
      if (original.id === input.id) throw new Error("A class cannot be rescheduled to itself");
      if (original.executionState === "COMPLETED" || original.outcome === "TAKEN") {
        throw new Error("Cannot reschedule a completed or taken class");
      }
      if (original.isRescheduled) {
        throw new Error("Cannot reschedule a class that has already been rescheduled");
      }

      const newInstanceInput: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt"> = {
        ...input,
        originalClassId: originalClassId,
        isRescheduled: false,
        quotaDeducted: false,
        rateAmount: input.rateAmount ?? original.rateAmount,
        rateCurrency: input.rateCurrency ?? original.rateCurrency,
      };

      await acquireLocks(t, newInstanceInput.teacherId, newInstanceInput.studentId);
      await validateTeacherAssignment(
        t,
        newInstanceInput.studentId,
        newInstanceInput.teacherId,
        newInstanceInput.scheduledStartAt
      );
      await TeacherAvailabilityRepository.validateBookingAvailability(
        newInstanceInput.teacherId,
        newInstanceInput.scheduledStartAt,
        newInstanceInput.scheduledEndAt,
        t
      );
      await checkOverlaps(t, {
        studentId: newInstanceInput.studentId,
        teacherId: newInstanceInput.teacherId,
        startTime: newInstanceInput.scheduledStartAt,
        endTime: newInstanceInput.scheduledEndAt,
        zoomUrl: newInstanceInput.zoomMeetingUrl,
      });

      const [created] = await t
        .insert(classInstances)
        .values({
          ...newInstanceInput,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await t
        .update(classInstances)
        .set({
          isRescheduled: true,
          quotaDeducted: false,
          outcome: "PENDING",
          executionState: "NOT_ACTIVATED",
          updatedAt: new Date(),
        })
        .where(eq(classInstances.id, originalClassId));

      if (original.quotaDeducted && original.deletedAt === null) {
        await t
          .update(students)
          .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
          .where(eq(students.id, original.studentId));
      }

      return created;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };
}
