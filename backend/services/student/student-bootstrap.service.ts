import type { DBTransaction } from "@/backend/db/db.types";
import { StudentRepository } from "@/backend/db/repo";
import {
  StudentProgressRepository,
  type StudentProgressUpsertInput,
} from "@/backend/db/repo/students/student-progress.repository";
import type { StudentStatusHistoryRow } from "@/backend/db/repo/students/student-status-history.repository";
import {
  type CreateInitialStatusHistoryInput,
  StudentStatusHistoryRepository,
} from "@/backend/db/repo/students/student-status-history.repository";
import type { StudentStatus } from "@/backend/enum";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type { StudentEntity, StudentProgressSelectType } from "@/backend/types";

export type StudentUpsertByKeyInput = {
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

function assertNonProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Student bootstrap operations are not allowed in production.");
  }
}

export namespace StudentBootstrapService {
  export async function findByIdempotencyKeys(keys: string[], tx?: DBTransaction): Promise<StudentEntity[]> {
    return StudentRepository.findByIdempotencyKeys(keys, tx);
  }

  export async function upsertByIdempotencyKey(
    input: StudentUpsertByKeyInput,
    tx?: DBTransaction
  ): Promise<StudentEntity> {
    assertNonProduction();
    try {
      return await StudentRepository.upsertByIdempotencyKey(input, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      const [existing] = await StudentRepository.findByIdempotencyKeys([input.idempotencyKey], tx);
      if (!existing) throw error;
      return existing;
    }
  }

  export async function upsertManyByIdempotencyKey(
    inputs: readonly StudentUpsertByKeyInput[],
    tx?: DBTransaction
  ): Promise<StudentEntity[]> {
    assertNonProduction();
    const results: StudentEntity[] = [];
    for (const input of inputs) {
      const student = await upsertByIdempotencyKey(input, tx);
      results.push(student);
    }
    return results;
  }

  export async function ensureTeacherAssignment(
    studentId: string,
    teacherId: string,
    assignedAt: Date,
    tx?: DBTransaction
  ): Promise<void> {
    await StudentRepository.ensureTeacherAssignment(studentId, teacherId, assignedAt, tx);
  }

  export async function upsertManyStudentProgress(
    inputs: readonly StudentProgressUpsertInput[],
    tx?: DBTransaction
  ): Promise<StudentProgressSelectType[]> {
    if (inputs.length === 0) return [];
    try {
      return await StudentProgressRepository.upsertMany(inputs, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      const pairs = inputs.map(i => ({ studentId: i.studentId, classInstanceId: i.classInstanceId }));
      return StudentProgressRepository.findByStudentClassPairs(pairs, tx);
    }
  }

  export async function createManyInitialStatusHistory(
    inputs: readonly CreateInitialStatusHistoryInput[],
    tx?: DBTransaction
  ): Promise<StudentStatusHistoryRow[]> {
    return StudentStatusHistoryRepository.createManyIfMissing(inputs, tx);
  }
}
