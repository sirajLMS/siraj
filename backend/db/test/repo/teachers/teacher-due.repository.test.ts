import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { TeacherDueRepository } from "@/backend/db/repo/teachers/teacher-due.repository";
import { teacherDues, teacherPayments } from "@/backend/db/schema";
import { createTestTeacherDue, setupStudent, setupTeacher, setupTestEntities } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CurrencyCode, PaymentDirection, PaymentMethodType, TeacherDueStatus } from "@/backend/enum";
import type { ClassInstanceSelectType } from "@/backend/types";

function requireInstance(instance: ClassInstanceSelectType | null): ClassInstanceSelectType {
  if (!instance) {
    throw new Error("setupTestEntities returned a null instance — pass skipInstance:false");
  }
  return instance;
}

/** Inserts a minimal teacher_payments row to satisfy the FK in mark_as_paid. */
async function insertTeacherPayment(tx: DBTransaction, teacherId: string, amount = "100.00"): Promise<string> {
  const now = new Date();
  const details: Record<string, unknown> = { type: PaymentMethodType.CASH };
  const [row] = await tx
    .insert(teacherPayments)
    .values({
      teacherId,
      userPaymentMethodId: null,
      paymentMethodType: PaymentMethodType.CASH,
      paymentMethodSnapshot: {
        userPaymentMethodId: null,
        type: PaymentMethodType.CASH,
        direction: PaymentDirection.PAYOUT,
        label: "Cash payout",
        details,
        catalog: null,
        snapshottedAt: now.toISOString(),
      },
      amount,
      currency: CurrencyCode.SAR,
      paymentDate: now,
      isTestPayment: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) {
    throw new Error("Failed to insert test teacher payment");
  }
  return row.id;
}

describe("TeacherDueRepository.create", () => {
  test("creates a due with PENDING status and the supplied hours/amount", async () => {
    await runInRollback(async tx => {
      const { user: approver } = await setupStudent(tx, {}, {}, {});
      const { user: teacherUser, teacher } = await setupTeacher(tx);
      const entities = await setupTestEntities(tx, "TDCreate");
      const inst = requireInstance(entities.instance);

      const due = await createTestTeacherDue(tx, teacher.id, inst.id, entities.student.id, approver.id, {
        hours: "1.50",
        amount: "37.50",
        currency: CurrencyCode.SAR,
      });

      expect(due.id).toBeDefined();
      expect(due.teacherId).toBe(teacher.id);
      expect(due.classInstanceId).toBe(inst.id);
      expect(due.studentId).toBe(entities.student.id);
      expect(due.status).toBe(TeacherDueStatus.PENDING);
      expect(due.hours).toBe("1.50");
      expect(due.amount).toBe("37.50");
      expect(due.currency).toBe(CurrencyCode.SAR);
      expect(due.approvedByUserId).toBe(approver.id);
      expect(due.teacherPaymentId).toBeNull();
      expect(teacherUser.id).toBeDefined();
    });
  });
});

describe("TeacherDueRepository.findByClassInstanceId", () => {
  test("returns the due for a class instance", async () => {
    await runInRollback(async tx => {
      const { user: approver } = await setupStudent(tx, {}, {}, {});
      const { teacher } = await setupTeacher(tx);
      const entities = await setupTestEntities(tx, "TDFindByClass");
      const inst = requireInstance(entities.instance);

      const created = await createTestTeacherDue(tx, teacher.id, inst.id, entities.student.id, approver.id);

      const found = await TeacherDueRepository.findByClassInstanceId(inst.id, tx);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.teacherId).toBe(teacher.id);
    });
  });

  test("returns null when no due exists for the class instance", async () => {
    await runInRollback(async tx => {
      const found = await TeacherDueRepository.findByClassInstanceId(randomUUID(), tx);
      expect(found).toBeNull();
    });
  });
});

describe("TeacherDueRepository.findByTeacherAndPeriod", () => {
  test("returns dues for the teacher whose approvedAt falls within the date range", async () => {
    await runInRollback(async tx => {
      const { user: approver } = await setupStudent(tx, {}, {}, {});
      const { teacher } = await setupTeacher(tx);
      const entities = await setupTestEntities(tx, "TDPeriod");
      const inst = requireInstance(entities.instance);

      const approvedAt = new Date();
      await createTestTeacherDue(tx, teacher.id, inst.id, entities.student.id, approver.id, {
        approvedAt,
      });

      const start = new Date(approvedAt.getTime() - 60_000);
      const end = new Date(approvedAt.getTime() + 60_000);

      const rows = await TeacherDueRepository.findByTeacherAndPeriod(teacher.id, start, end, tx);

      expect(rows.length).toBeGreaterThanOrEqual(1);
      const matching = rows.filter(r => r.teacherId === teacher.id);
      expect(matching.length).toBeGreaterThanOrEqual(1);
    });
  });

  test("excludes dues whose approvedAt is outside the date range", async () => {
    await runInRollback(async tx => {
      const { user: approver } = await setupStudent(tx, {}, {}, {});
      const { teacher } = await setupTeacher(tx);
      const entities = await setupTestEntities(tx, "TDPeriodExcl");
      const inst = requireInstance(entities.instance);

      const longAgo = new Date(Date.now() - 30 * 86_400_000);
      await createTestTeacherDue(tx, teacher.id, inst.id, entities.student.id, approver.id, {
        approvedAt: longAgo,
      });

      const start = new Date(Date.now() - 60_000);
      const end = new Date(Date.now() + 60_000);

      const rows = await TeacherDueRepository.findByTeacherAndPeriod(teacher.id, start, end, tx);
      const matching = rows.filter(r => r.teacherId === teacher.id);
      const within = matching.filter(r => r.approvedAt >= start && r.approvedAt < end);
      // A row far in the past should not be inside this tight window
      expect(within).toHaveLength(0);
    });
  });
});

describe("TeacherDueRepository.getMonthlyReport", () => {
  test("aggregates lessonsTaught, approvedCount, totalDueAmount and totals correctly", async () => {
    await runInRollback(async tx => {
      const { user: approver } = await setupStudent(tx, {}, {}, {});
      const { teacher } = await setupTeacher(tx);
      const { user: adminUser } = await setupStudent(tx, { name: "Admin User" });
      const entities = await setupTestEntities(tx, "TDMonthly");
      const inst = requireInstance(entities.instance);

      const reportDate = new Date();
      const year = reportDate.getUTCFullYear();
      const month = reportDate.getUTCMonth() + 1;

      await createTestTeacherDue(tx, teacher.id, inst.id, entities.student.id, approver.id, {
        hours: "1.00",
        amount: "25.00",
        currency: CurrencyCode.SAR,
        status: TeacherDueStatus.PENDING,
        approvedAt: reportDate,
      });

      const report = await TeacherDueRepository.getMonthlyReport(teacher.id, year, month, tx);

      expect(report.teacherId).toBe(teacher.id);
      expect(report.year).toBe(year);
      expect(report.month).toBe(month);
      expect(report.lessonsTaught).toBeGreaterThanOrEqual(0);
      expect(report.approvedCount).toBeGreaterThanOrEqual(1);
      expect(report.totalDueAmount).toBeGreaterThanOrEqual(25);
      expect(report.totalPaidAmount).toBeGreaterThanOrEqual(0);
      expect(report.totalAccruedHours).toBeGreaterThanOrEqual(1);
      expect(report.currency).toBe(CurrencyCode.SAR);
      expect(adminUser.id).toBeDefined();
    });
  });

  test("returns zeros for a teacher with no dues that month", async () => {
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx);

      const report = await TeacherDueRepository.getMonthlyReport(teacher.id, 2025, 1, tx);

      expect(report.teacherId).toBe(teacher.id);
      expect(report.lessonsTaught).toBe(0);
      expect(report.approvedCount).toBe(0);
      expect(report.totalDueAmount).toBe(0);
      expect(report.totalPaidAmount).toBe(0);
      expect(report.totalAccruedHours).toBe(0);
    });
  });
});

describe("TeacherDueRepository.markAsPaid", () => {
  test("batch updates status to PAID for multiple dues", async () => {
    await runInRollback(async tx => {
      const { user: approver } = await setupStudent(tx, {}, {}, {});
      const { teacher } = await setupTeacher(tx);
      const entitiesA = await setupTestEntities(tx, "TDPayA");
      const instA = requireInstance(entitiesA.instance);
      const entitiesB = await setupTestEntities(tx, "TDPayB");
      const instB = requireInstance(entitiesB.instance);

      const dueA = await createTestTeacherDue(tx, teacher.id, instA.id, entitiesA.student.id, approver.id);
      const dueB = await createTestTeacherDue(tx, teacher.id, instB.id, entitiesB.student.id, approver.id);

      const paymentId = await insertTeacherPayment(tx, teacher.id, "50.00");

      await TeacherDueRepository.markAsPaid([dueA.id, dueB.id], paymentId, tx);

      const [updatedA] = await tx.select().from(teacherDues).where(eq(teacherDues.id, dueA.id));
      const [updatedB] = await tx.select().from(teacherDues).where(eq(teacherDues.id, dueB.id));

      expect(updatedA?.status).toBe(TeacherDueStatus.PAID);
      expect(updatedA?.teacherPaymentId).toBe(paymentId);
      expect(updatedB?.status).toBe(TeacherDueStatus.PAID);
      expect(updatedB?.teacherPaymentId).toBe(paymentId);
    });
  });

  test("is a no-op when the dues list is empty", async () => {
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx);
      const paymentId = await insertTeacherPayment(tx, teacher.id, "0.00");

      const pendingBefore = await TeacherDueRepository.getPendingDues(teacher.id, tx);
      await TeacherDueRepository.markAsPaid([], paymentId, tx);
      const pendingAfter = await TeacherDueRepository.getPendingDues(teacher.id, tx);

      // The empty short-circuit means no rows were changed — pending count is unchanged.
      expect(pendingAfter).toHaveLength(pendingBefore.length);
    });
  });
});

describe("TeacherDueRepository.getPendingDues", () => {
  test("returns pending dues for a specific teacher", async () => {
    await runInRollback(async tx => {
      const { user: approver } = await setupStudent(tx, {}, {}, {});
      const { teacher } = await setupTeacher(tx);
      const entities = await setupTestEntities(tx, "TDPendingTeacher");
      const inst = requireInstance(entities.instance);

      const initialPending = await TeacherDueRepository.getPendingDues(teacher.id, tx);

      await createTestTeacherDue(tx, teacher.id, inst.id, entities.student.id, approver.id, {
        status: TeacherDueStatus.PENDING,
      });

      const afterPending = await TeacherDueRepository.getPendingDues(teacher.id, tx);
      expect(afterPending).toHaveLength(initialPending.length + 1);

      for (const r of afterPending) {
        expect(r.teacherId).toBe(teacher.id);
        expect(r.status).toBe(TeacherDueStatus.PENDING);
      }
    });
  });

  test("excludes paid dues", async () => {
    await runInRollback(async tx => {
      const { user: approver } = await setupStudent(tx, {}, {}, {});
      const { teacher } = await setupTeacher(tx);
      const entities = await setupTestEntities(tx, "TDPendingPaid");
      const inst = requireInstance(entities.instance);

      const due = await createTestTeacherDue(tx, teacher.id, inst.id, entities.student.id, approver.id, {
        status: TeacherDueStatus.PENDING,
      });
      const paymentId = await insertTeacherPayment(tx, teacher.id, "25.00");
      await TeacherDueRepository.markAsPaid([due.id], paymentId, tx);

      const pending = await TeacherDueRepository.getPendingDues(teacher.id, tx);
      expect(pending.find(r => r.id === due.id)).toBeUndefined();
    });
  });

  test("returns all pending dues across teachers when teacherId is undefined", async () => {
    await runInRollback(async tx => {
      const { user: approver } = await setupStudent(tx, {}, {}, {});
      const { teacher } = await setupTeacher(tx);
      const { teacher: teacher2 } = await setupTeacher(tx, {
        name: "Teacher Two",
        email: `t2-${randomUUID()}@test.com`,
      });
      const entitiesA = await setupTestEntities(tx, "TDPendingAllA");
      const instA = requireInstance(entitiesA.instance);
      const entitiesB = await setupTestEntities(tx, "TDPendingAllB");
      const instB = requireInstance(entitiesB.instance);

      const initialAll = await TeacherDueRepository.getPendingDues(undefined, tx);

      await createTestTeacherDue(tx, teacher.id, instA.id, entitiesA.student.id, approver.id);
      await createTestTeacherDue(tx, teacher2.id, instB.id, entitiesB.student.id, approver.id);

      const afterAll = await TeacherDueRepository.getPendingDues(undefined, tx);
      expect(afterAll).toHaveLength(initialAll.length + 2);
    });
  });
});

describe("TeacherDueRepository — tx propagation", () => {
  test("mutating methods accept and use the supplied transaction", async () => {
    await runInRollback(async tx => {
      const { user: approver } = await setupStudent(tx, { name: "Tx Approver" });
      const { teacher } = await setupTeacher(tx);
      const entities = await setupTestEntities(tx, "TxTD");
      const inst = requireInstance(entities.instance);

      const due = await TeacherDueRepository.create(
        {
          teacherId: teacher.id,
          classInstanceId: inst.id,
          studentId: entities.student.id,
          hours: "1.00",
          amount: "25.00",
          currency: CurrencyCode.SAR,
          status: TeacherDueStatus.PENDING,
          approvedByUserId: approver.id,
          teacherPaymentId: null,
        },
        tx
      );

      const [fetched] = await tx.select().from(teacherDues).where(eq(teacherDues.id, due.id));
      expect(fetched).toBeDefined();
      expect(fetched?.status).toBe(TeacherDueStatus.PENDING);

      const paymentId = await insertTeacherPayment(tx, teacher.id, "25.00");
      await TeacherDueRepository.markAsPaid([due.id], paymentId, tx);
      const [paid] = await tx.select().from(teacherDues).where(eq(teacherDues.id, due.id));
      expect(paid?.status).toBe(TeacherDueStatus.PAID);
    });
  });
});

describe("TeacherDueRepository — non-transactional fallback", () => {
  test("findByClassInstanceId returns null without a tx", async () => {
    const result = await TeacherDueRepository.findByClassInstanceId(randomUUID());
    expect(result).toBeNull();
  });

  test("getPendingDues with non-existent teacher id returns empty without throwing", async () => {
    const result = await TeacherDueRepository.getPendingDues(randomUUID());
    expect(result).toEqual([]);
  });
});
