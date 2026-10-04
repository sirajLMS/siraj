import { randomUUID } from "node:crypto";
import { ParentRepository } from "@/backend/db/repo/parents";
import { StudentRepository } from "@/backend/db/repo/students";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { StudentStatus } from "@/backend/enum";
import type {
  DBTransaction,
  StudentOnboardingInput,
  StudentSelectType,
  UserCreateCoreInput,
  UserCreateProfileFieldsInput,
  UserReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Every student must have a login account (students.userId is NOT NULL), so
 * email + password are required before entering the transaction.
 */
export function resolveStudentCredentials(
  input: StudentOnboardingInput,
  tErrors: ErrorsLabels
): { email: string; password: string } {
  const email = input.email?.trim() ?? null;
  if (!email) {
    throw new Error(tErrors.studentEmailRequired);
  }
  const password = input.password ?? null;
  if (!password) {
    throw new Error(tErrors.studentPasswordRequired);
  }
  return { email, password };
}

export function buildStudentCoreInput(
  input: StudentOnboardingInput,
  email: string,
  password: string
): UserCreateCoreInput {
  return {
    name: input.name,
    email,
    password,
    ...(input.avatarUrl === undefined ? {} : { avatarUrl: input.avatarUrl }),
  };
}

export function buildStudentProfileFields(input: StudentOnboardingInput): UserCreateProfileFieldsInput {
  return {
    phone: input.phone ?? undefined,
    timezone: input.timezone ?? undefined,
    displayCurrency: input.displayCurrency ?? undefined,
  };
}

export function buildOnboardingPreChecks(input: StudentOnboardingInput, tErrors: ErrorsLabels): () => Promise<void> {
  return async () => {
    if (input.parentId) {
      const parent = await ParentRepository.getParentProfile(input.parentId);
      if (!parent) {
        throw new Error(tErrors.parentNotFound);
      }
    }
    if (input.primaryTeacherId) {
      const teacher = await TeacherRepository.findById(input.primaryTeacherId);
      if (!teacher) {
        throw new Error(tErrors.teacherNotFound(input.primaryTeacherId));
      }
    }
  };
}

export function buildStudentExtensionCreator(
  input: StudentOnboardingInput,
  tErrors: ErrorsLabels
): (createdUser: UserReturnType, txObj: DBTransaction) => Promise<StudentSelectType> {
  return async (createdUser, txObj) =>
    StudentRepository.create(
      {
        parentId: input.parentId ?? null,
        userId: createdUser.id,
        name: input.name,
        dateOfBirth: input.dateOfBirth ?? null,
        gender: input.gender ?? null,
        language: input.language ?? null,
        status: input.status ?? StudentStatus.ON_TRIAL,
        primaryTeacherId: input.primaryTeacherId ?? null,
        classesTotal: input.classesTotal ?? 0,
        classesRemaining: input.classesRemaining ?? 0,
        idempotencyKey: randomUUID(),
        ...(input.avatarUrl === undefined ? {} : { avatarUrl: input.avatarUrl }),
      },
      tErrors,
      txObj
    );
}

export function buildPrimaryTeacherAssignment(
  input: StudentOnboardingInput,
  actorUserId: string
): (_createdUser: UserReturnType, student: StudentSelectType, txObj: DBTransaction) => Promise<void> {
  return async (_createdUser, student, txObj) => {
    if (input.primaryTeacherId) {
      await StudentRepository.createTeacherAssignment(
        {
          studentId: student.id,
          teacherId: input.primaryTeacherId,
          assignedByUserId: actorUserId,
        },
        txObj
      );
    }
  };
}
