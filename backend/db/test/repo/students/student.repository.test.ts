import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { StudentRepository } from "@/backend/db/repo";
import { students } from "@/backend/db/schema";
import { setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { StudentStatus } from "@/backend/enum";
import { getServerTranslations } from "@/shared/locale/server-graphql";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

let tErrors: ErrorsLabels;
beforeAll(async () => {
  tErrors = await getServerTranslations("en", "errors");
});

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

async function makeStudent(
  tx: Parameters<typeof runInRollback>[0] extends (tx: infer T) => unknown ? T : never,
  prefix: string,
  overrides = {}
) {
  return setupStudent(
    tx,
    { name: `${prefix} P`, email: `${prefix.toLowerCase()}-${randomUUID()}@t.com` },
    {},
    overrides
  );
}

async function makeTeacher(
  tx: Parameters<typeof runInRollback>[0] extends (tx: infer T) => unknown ? T : never,
  prefix: string
) {
  return setupTeacher(tx, { name: `${prefix} T`, email: `${prefix.toLowerCase()}-t-${randomUUID()}@t.com` });
}

type Tx = Parameters<typeof runInRollback>[0] extends (tx: infer T) => unknown ? T : never;
type TestStudent = Awaited<ReturnType<typeof makeStudent>>["student"];

function testVersionMismatch(name: string, action: (tx: Tx, student: TestStudent) => Promise<unknown>) {
  test(name, async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, `VM_${name.slice(0, 6)}`);
      const error = await expectRepoError(() => action(tx, student));
      expect(error.message).toContain("Version mismatch");
    });
  });
}

describe("StudentRepository — setClassesRemaining", () => {
  test("throws studentNotFound for unknown studentId", async () => {
    await runInRollback(async tx => {
      const error = await expectRepoError(() =>
        StudentRepository.setClassesRemaining(randomUUID(), 5, tErrors, undefined, tx)
      );
      expect(error.message).toContain("not found");
    });
  });

  test("successfully sets classesRemaining to a valid value", async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, "Quota", { classesTotal: 10, classesRemaining: 5 });
      const result = await StudentRepository.setClassesRemaining(student.id, 8, tErrors, student.version, tx);
      expect(result.classesRemaining).toBe(8);
      expect(result.version).toBe(student.version + 1);
      const [updated] = await tx
        .select({ classesRemaining: students.classesRemaining, version: students.version })
        .from(students)
        .where(eq(students.id, student.id));
      expect(updated.classesRemaining).toBe(8);
      expect(updated.version).toBe(student.version + 1);
    });
  });

  testVersionMismatch("throws on version mismatch (optimistic locking)", (tx, student) =>
    StudentRepository.setClassesRemaining(student.id, 3, tErrors, student.version + 999, tx)
  );

  test("sets classesRemaining to 0 successfully", async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, "Zero", { classesTotal: 10, classesRemaining: 5 });
      const result = await StudentRepository.setClassesRemaining(student.id, 0, tErrors, student.version, tx);
      expect(result.classesRemaining).toBe(0);
    });
  });
});

describe("StudentRepository — reassignTeacher", () => {
  test("updates primaryTeacherId to the new teacher", async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, "Reassign", { status: StudentStatus.REGULAR });
      const { teacher: nt } = await makeTeacher(tx, "New");
      const result = await StudentRepository.reassignTeacher(student.id, nt.id, tErrors, undefined, tx);
      expect(result.id).toBe(student.id);
      expect(result.primaryTeacherId).toBe(nt.id);
      expect(result.version).toBe(student.version + 1);
    });
  });

  test("throws studentNotFound for unknown studentId", async () => {
    await runInRollback(async tx => {
      const { teacher } = await makeTeacher(tx, "Target");
      const error = await expectRepoError(() =>
        StudentRepository.reassignTeacher(randomUUID(), teacher.id, tErrors, undefined, tx)
      );
      expect(error.message).toContain("not found");
    });
  });

  testVersionMismatch("throws on version mismatch", async (tx, student) => {
    const { teacher } = await makeTeacher(tx, "VerRT");
    return StudentRepository.reassignTeacher(student.id, teacher.id, tErrors, student.version + 999, tx);
  });

  test("succeeds when expectedVersion matches", async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, "MatchR");
      const { teacher: nt } = await makeTeacher(tx, "MatchRT");
      const result = await StudentRepository.reassignTeacher(student.id, nt.id, tErrors, student.version, tx);
      expect(result.primaryTeacherId).toBe(nt.id);
    });
  });
});

describe("StudentRepository — changeStatus", () => {
  test("changes status from REGULAR to SUSPENDED", async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, "Suspend", { status: StudentStatus.REGULAR });
      const result = await StudentRepository.changeStatus(student.id, StudentStatus.SUSPENDED, tErrors, undefined, tx);
      expect(result.status).toBe(StudentStatus.SUSPENDED);
      expect(result.version).toBe(student.version + 1);
    });
  });

  test("changes status from REGULAR to ON_LEAVE", async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, "Leave", { status: StudentStatus.REGULAR });
      const result = await StudentRepository.changeStatus(student.id, StudentStatus.ON_LEAVE, tErrors, undefined, tx);
      expect(result.status).toBe(StudentStatus.ON_LEAVE);
    });
  });

  test("changes status from SUSPENDED back to REGULAR", async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, "Resume", { status: StudentStatus.REGULAR });
      await StudentRepository.changeStatus(student.id, StudentStatus.SUSPENDED, tErrors, undefined, tx);
      const result = await StudentRepository.changeStatus(student.id, StudentStatus.REGULAR, tErrors, undefined, tx);
      expect(result.status).toBe(StudentStatus.REGULAR);
    });
  });

  test("throws studentNotFound for unknown studentId", async () => {
    await runInRollback(async tx => {
      const error = await expectRepoError(() =>
        StudentRepository.changeStatus(randomUUID(), StudentStatus.SUSPENDED, tErrors, undefined, tx)
      );
      expect(error.message).toContain("not found");
    });
  });

  testVersionMismatch("throws on version mismatch", (tx, student) =>
    StudentRepository.changeStatus(student.id, StudentStatus.SUSPENDED, tErrors, student.version + 999, tx)
  );
});
