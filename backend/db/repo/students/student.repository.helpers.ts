import type * as Types from "@/backend/types";

export type StudentCursor = { createdAt: string; id: string };

export function decodeStudentCursor(after: string): StudentCursor | null {
  try {
    const decoded = Buffer.from(after, "base64").toString("utf8");
    const parsed: unknown = JSON.parse(decoded);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "createdAt" in parsed &&
      "id" in parsed &&
      typeof parsed.createdAt === "string" &&
      typeof parsed.id === "string"
    ) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
  } catch {
    /* ignore invalid cursor */
  }
  return null;
}

export function encodeStudentCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString("base64");
}

export function buildStudentInsertInput(input: Types.StudentCreateInput): Types.StudentInsertType {
  return {
    parentId: input.parentId,
    userId: input.userId,
    primaryTeacherId: input.primaryTeacherId ?? null,
    name: input.name,
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    language: input.language,
    status: input.status,
    classesTotal: input.classesTotal ?? 0,
    classesRemaining: input.classesRemaining ?? 0,
    idempotencyKey: input.idempotencyKey,
    avatarUrl: input.avatarUrl ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function buildStudentUpdateInput(
  input: Types.PartialStudentUpdateInput,
  existingStudent: Types.StudentSelectType
): Types.StudentInsertType {
  return {
    id: input.id,
    parentId: input.parentId ?? existingStudent.parentId,
    userId: existingStudent.userId,
    primaryTeacherId:
      input.primaryTeacherId === null ? null : (input.primaryTeacherId ?? existingStudent.primaryTeacherId),
    name: input.name ?? existingStudent.name,
    dateOfBirth: input.dateOfBirth === null ? null : (input.dateOfBirth ?? existingStudent.dateOfBirth),
    gender: input.gender === null ? null : (input.gender ?? existingStudent.gender),
    language: input.language === null ? null : (input.language ?? existingStudent.language),
    timezoneOverride:
      input.timezoneOverride === null ? null : (input.timezoneOverride ?? existingStudent.timezoneOverride),
    status: input.status ?? existingStudent.status,
    classesTotal: input.classesTotal ?? existingStudent.classesTotal,
    classesRemaining: input.classesRemaining ?? existingStudent.classesRemaining,
    avatarUrl: input.avatarUrl === null ? null : (input.avatarUrl ?? existingStudent.avatarUrl),
    idempotencyKey: existingStudent.idempotencyKey,
    createdAt: existingStudent.createdAt,
    updatedAt: new Date(),
  };
}
