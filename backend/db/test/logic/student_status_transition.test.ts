import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { StudentRepository } from "@/backend/db/repo";
import { StudentStatus } from "@/shared/lib/enum";
import { setupStudent } from "../entity-setup";
import { runInRollback } from "../test-utils";

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

function getFullErrorMessage(error: Error): string {
  const cause = error.cause as { message?: string } | undefined;
  return `${error.message} ${cause?.message ?? ""}`;
}

async function setupRegularStudent(tx: Parameters<typeof runInRollback>[0] extends (tx: infer T) => unknown ? T : never) {
  const { student } = await setupStudent(
    tx,
    { name: "Trans P", email: `trans-${randomUUID()}@t.com` },
    {},
    { name: "Trans S", status: StudentStatus.REGULAR }
  );
  return student;
}

async function chainTransition(
  tx: Parameters<typeof runInRollback>[0] extends (tx: infer T) => unknown ? T : never,
  studentId: string,
  steps: string[],
  finalTarget: string
) {
  for (const step of steps) {
    await StudentRepository.changeStatus(studentId, step, undefined, tx);
  }
  return expectRepoError(() => StudentRepository.changeStatus(studentId, finalTarget, undefined, tx));
}

describe("fn_enforce_student_status_transition DB trigger", () => {
  describe("Valid transitions from REGULAR", () => {
    for (const target of ["SUSPENDED", "ON_LEAVE", "DEACTIVATED", "GRADUATED"] as const) {
      test(`REGULAR → ${target}: allowed`, async () => {
        await runInRollback(async tx => {
          const student = await setupRegularStudent(tx);
          const result = await StudentRepository.changeStatus(student.id, target, undefined, tx);
          expect(result.status).toBe(target);
        });
      });
    }
  });

  describe("Valid transitions back to REGULAR", () => {
    for (const from of ["SUSPENDED", "ON_LEAVE", "DEACTIVATED"] as const) {
      test(`${from} → REGULAR: allowed`, async () => {
        await runInRollback(async tx => {
          const student = await setupRegularStudent(tx);
          await StudentRepository.changeStatus(student.id, from, undefined, tx);
          const result = await StudentRepository.changeStatus(student.id, "REGULAR", undefined, tx);
          expect(result.status).toBe("REGULAR");
        });
      });
    }
  });

  describe("Valid transitions from ON_TRIAL", () => {
    for (const [target, label] of [["REGULAR", "activate"], ["DEACTIVATED", "deactivate"]] as const) {
      test(`ON_TRIAL → ${target}: allowed`, async () => {
        await runInRollback(async tx => {
          const { student } = await setupStudent(
            tx,
            { name: `Trial ${label} P`, email: `trial-${label}-${randomUUID()}@t.com` },
            {},
            { status: StudentStatus.ON_TRIAL }
          );
          const result = await StudentRepository.changeStatus(student.id, target, undefined, tx);
          expect(result.status).toBe(target);
        });
      });
    }
  });

  describe("Valid secondary transitions", () => {
    for (const [via, target] of [["SUSPENDED", "DEACTIVATED"], ["ON_LEAVE", "DEACTIVATED"]] as const) {
      test(`REGULAR → ${via} → ${target}: allowed`, async () => {
        await runInRollback(async tx => {
          const student = await setupRegularStudent(tx);
          await StudentRepository.changeStatus(student.id, via, undefined, tx);
          const result = await StudentRepository.changeStatus(student.id, target, undefined, tx);
          expect(result.status).toBe(target);
        });
      });
    }
  });

  describe("Invalid transitions — DB trigger must reject", () => {
    test("GRADUATED → REGULAR: rejected", async () => {
      await runInRollback(async tx => {
        const student = await setupRegularStudent(tx);
        const error = await chainTransition(tx, student.id, ["GRADUATED"], "REGULAR");
        expect(getFullErrorMessage(error)).toContain("GRADUATED");
      });
    });

    test("GRADUATED → SUSPENDED: rejected", async () => {
      await runInRollback(async tx => {
        const student = await setupRegularStudent(tx);
        const error = await chainTransition(tx, student.id, ["GRADUATED"], "SUSPENDED");
        expect(getFullErrorMessage(error)).toContain("GRADUATED");
      });
    });

    test("ON_TRIAL → GRADUATED: rejected", async () => {
      await runInRollback(async tx => {
        const { student } = await setupStudent(
          tx,
          { name: "Trial Grad P", email: `tgrad-${randomUUID()}@t.com` },
          {},
          { status: StudentStatus.ON_TRIAL }
        );
        const error = await expectRepoError(() => StudentRepository.changeStatus(student.id, "GRADUATED", undefined, tx));
        expect(getFullErrorMessage(error)).toContain("Invalid status transition");
      });
    });

    test("SUSPENDED → GRADUATED: rejected", async () => {
      await runInRollback(async tx => {
        const student = await setupRegularStudent(tx);
        const error = await chainTransition(tx, student.id, ["SUSPENDED"], "GRADUATED");
        expect(getFullErrorMessage(error)).toContain("Invalid status transition");
      });
    });

    test("ON_LEAVE → GRADUATED: rejected", async () => {
      await runInRollback(async tx => {
        const student = await setupRegularStudent(tx);
        const error = await chainTransition(tx, student.id, ["ON_LEAVE"], "GRADUATED");
        expect(getFullErrorMessage(error)).toContain("Invalid status transition");
      });
    });

    test("REGULAR → ON_TRIAL: rejected", async () => {
      await runInRollback(async tx => {
        const student = await setupRegularStudent(tx);
        const error = await expectRepoError(() => StudentRepository.changeStatus(student.id, "ON_TRIAL", undefined, tx));
        expect(getFullErrorMessage(error)).toContain("Invalid status transition");
      });
    });

    test("DEACTIVATED → GRADUATED: rejected", async () => {
      await runInRollback(async tx => {
        const student = await setupRegularStudent(tx);
        const error = await chainTransition(tx, student.id, ["DEACTIVATED"], "GRADUATED");
        expect(getFullErrorMessage(error)).toContain("Invalid status transition");
      });
    });
  });
});
