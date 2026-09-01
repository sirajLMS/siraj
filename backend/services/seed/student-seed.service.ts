/**
 * Seed-only student record provisioning.
 *
 * Idempotent student upserts (by idempotency key), teacher assignments, progress,
 * and status history for demo data. Used by `bun db seed` and `ensureDemoUsers`.
 *
 * **Not a production domain service** — student onboarding in production uses
 * dedicated services under `backend/services/student/`. Writes blocked on real
 * production via {@link assertSeedWriteAllowed}.
 *
 * @see backend/db/seeds/students/
 */

import { StudentRepository } from "@/backend/db/repo/students";
import { StudentProgressRepository } from "@/backend/db/repo/students/student-progress.repository";
import { StudentStatusHistoryRepository } from "@/backend/db/repo/students/student-status-history.repository";
import { assertSeedWriteAllowed } from "@/backend/lib/bootstrap-gate";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type {
  CreateInitialStatusHistoryInput,
  DBTransaction,
  SeedStudentInput,
  StudentProgressSelectType,
  StudentProgressUpsertInput,
  StudentSelectType,
  StudentStatusHistorySelectType,
} from "@/backend/types";

export namespace StudentSeedService {
  /** Idempotently upsert one demo student row (seed / test-helper). */
  export async function seedStudentByKey(input: SeedStudentInput, tx?: DBTransaction): Promise<StudentSelectType> {
    assertSeedWriteAllowed("Student seed writes");
    try {
      return await StudentRepository.upsertByIdempotencyKey(input, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      const [existing] = await StudentRepository.findByIdempotencyKeys([input.idempotencyKey], tx);
      if (!existing) throw error;
      return existing;
    }
  }

  /** Seed-only primary teacher assignment for demo students. */
  export async function seedTeacherAssignment(
    studentId: string,
    teacherId: string,
    assignedAt: Date,
    tx?: DBTransaction
  ): Promise<void> {
    assertSeedWriteAllowed("Student seed writes");
    await StudentRepository.ensureTeacherAssignment(studentId, teacherId, assignedAt, tx);
  }

  /** Idempotently seed student progress rows for demo class instances. */
  export async function seedManyStudentProgress(
    inputs: readonly StudentProgressUpsertInput[],
    tx?: DBTransaction
  ): Promise<StudentProgressSelectType[]> {
    assertSeedWriteAllowed("Student seed writes");
    if (inputs.length === 0) return [];
    try {
      return await StudentProgressRepository.upsertMany(inputs, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      const pairs = inputs
        .filter((i): i is StudentProgressUpsertInput & { studentId: string; classInstanceId: string } =>
          Boolean(i.studentId && i.classInstanceId)
        )
        .map(i => ({ studentId: i.studentId, classInstanceId: i.classInstanceId }));
      return StudentProgressRepository.findByStudentClassPairs(pairs, tx);
    }
  }

  /** Idempotently seed initial status history rows for demo students. */
  export async function seedManyInitialStatusHistory(
    inputs: readonly CreateInitialStatusHistoryInput[],
    tx?: DBTransaction
  ): Promise<StudentStatusHistorySelectType[]> {
    assertSeedWriteAllowed("Student seed writes");
    return StudentStatusHistoryRepository.createManyIfMissing(inputs, tx);
  }
}
