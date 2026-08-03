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
import type { DBTransaction } from "@/backend/db/db.types";
import { StudentRepository } from "@/backend/db/repo";
import {
  StudentProgressRepository,
  type StudentProgressUpsertInput,
} from "@/backend/db/repo/students/student-progress.repository";
import {
  type CreateInitialStatusHistoryInput,
  StudentStatusHistoryRepository,
  type StudentStatusHistoryRow,
} from "@/backend/db/repo/students/student-status-history.repository";
import type { StudentStatus } from "@/backend/enum";
import { assertSeedWriteAllowed } from "@/backend/lib/bootstrap-gate";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type { StudentProgressSelectType, StudentSelectType } from "@/backend/types";

export type SeedStudentInput = {
  parentId: string;
  userId: string;
  primaryTeacherId: string;
  name: string;
  avatarUrl: string | null;
  status: StudentStatus;
  classesTotal: number;
  classesRemaining: number;
  timezoneOverride: string | null;
  idempotencyKey: string;
};

export namespace StudentSeedService {
  /** Read helper — find seed students by stable idempotency keys. */
  export async function findByIdempotencyKeys(keys: string[], tx?: DBTransaction): Promise<StudentSelectType[]> {
    return StudentRepository.findByIdempotencyKeys(keys, tx);
  }

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

  /** Idempotently upsert many demo students. */
  export async function seedManyStudentsByKey(
    inputs: readonly SeedStudentInput[],
    tx?: DBTransaction
  ): Promise<StudentSelectType[]> {
    assertSeedWriteAllowed("Student seed writes");
    const results: StudentSelectType[] = [];
    for (const input of inputs) {
      results.push(await seedStudentByKey(input, tx));
    }
    return results;
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
      const pairs = inputs.map(i => ({ studentId: i.studentId, classInstanceId: i.classInstanceId }));
      return StudentProgressRepository.findByStudentClassPairs(pairs, tx);
    }
  }

  /** Idempotently seed initial status history rows for demo students. */
  export async function seedManyInitialStatusHistory(
    inputs: readonly CreateInitialStatusHistoryInput[],
    tx?: DBTransaction
  ): Promise<StudentStatusHistoryRow[]> {
    assertSeedWriteAllowed("Student seed writes");
    return StudentStatusHistoryRepository.createManyIfMissing(inputs, tx);
  }
}
