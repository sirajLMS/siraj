import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { StudentRepository } from "@/backend/db/repo/students";
import { students, users } from "@/backend/db/schema";
import { createTestUser, setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { StudentStatus } from "@/backend/enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

let tErrors: ErrorsLabels;
beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  if (errorCaught instanceof Error) return errorCaught;
  throw new Error(String(errorCaught));
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
      expect(error.message).toContain("version mismatch");
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

describe("StudentRepository — credit-hours parallel balance methods", () => {
  test("addCreditHours bumps both credit-hours facets and the optimistic-lock version", async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, "AddHrs");

      const result = await StudentRepository.addCreditHours(student.id, tErrors, 4.5, undefined, tx);

      expect(Number(result.creditHoursRemaining ?? "0")).toBe(4.5);
      expect(Number(result.creditHoursTotal ?? "0")).toBe(4.5);
      expect(result.version).toBe(student.version + 1);
    });
  });

  test("addCreditHours throws studentNotFound for an unknown studentId", async () => {
    await runInRollback(async tx => {
      const error = await expectRepoError(() =>
        StudentRepository.addCreditHours(randomUUID(), tErrors, 2, undefined, tx)
      );
      expect(error.message).toContain("not found");
    });
  });

  testVersionMismatch("addCreditHours throws on version mismatch", (tx, student) =>
    StudentRepository.addCreditHours(student.id, tErrors, 2, student.version + 999, tx)
  );

  test("deductCreditHours down to exactly zero succeeds (boundary: remaining === amount)", async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, "ZeroOut");
      await StudentRepository.addCreditHours(student.id, tErrors, 2.5, undefined, tx);

      const result = await StudentRepository.deductCreditHours(student.id, tErrors, 2.5, undefined, tx);

      expect(Number(result.creditHoursRemaining ?? "0")).toBe(0);
      // Clawbacks never touch the historical total.
      expect(Number(result.creditHoursTotal ?? "0")).toBe(2.5);
    });
  });

  test("deductCreditHours throws studentNotFound for an unknown studentId", async () => {
    await runInRollback(async tx => {
      const error = await expectRepoError(() =>
        StudentRepository.deductCreditHours(randomUUID(), tErrors, 1, undefined, tx)
      );
      expect(error.message).toContain("not found");
    });
  });

  testVersionMismatch("deductCreditHours throws on version mismatch", (tx, student) =>
    StudentRepository.deductCreditHours(student.id, tErrors, 1, student.version + 999, tx)
  );

  test("getCreditHourBalance reflects persisted facets and defaults to zeros for unknown students", async () => {
    await runInRollback(async tx => {
      const { student } = await makeStudent(tx, "HrsBal");
      await StudentRepository.addCreditHours(student.id, tErrors, 7, undefined, tx);
      await StudentRepository.deductCreditHours(student.id, tErrors, 1.5, undefined, tx);

      const balance = await StudentRepository.getCreditHourBalance(student.id, tx);
      expect(balance.studentId).toBe(student.id);
      expect(Number(balance.creditHoursTotal)).toBe(7);
      expect(Number(balance.creditHoursRemaining)).toBe(5.5);

      const missing = await StudentRepository.getCreditHourBalance(randomUUID(), tx);
      expect(typeof missing.studentId).toBe("string");
      expect(missing.creditHoursTotal).toBe("0");
      expect(missing.creditHoursRemaining).toBe("0");
    });
  });

  describe("findActiveById", () => {
    test("returns the student while the linked user is active", async () => {
      await runInRollback(async tx => {
        const { student } = await makeStudent(tx, "ActiveLookup");

        const found = await StudentRepository.findActiveById(student.id, tx);
        expect(found?.id).toBe(student.id);
      });
    });

    test("returns null after the linked user is soft-deleted", async () => {
      await runInRollback(async tx => {
        const studentUser = await createTestUser(tx, { name: "SoftGone StudentUser" });
        const { student } = await makeStudent(tx, "SoftGone", { userId: studentUser.id });

        await tx.update(users).set({ deletedAt: new Date() }).where(eq(users.id, studentUser.id));

        expect(await StudentRepository.findById(student.id, tx)).not.toBeNull();
        expect(await StudentRepository.findActiveById(student.id, tx)).toBeNull();
      });
    });

    test("returns null for an unknown id", async () => {
      await runInRollback(async tx => {
        expect(await StudentRepository.findActiveById(randomUUID(), tx)).toBeNull();
      });
    });
  });
});
