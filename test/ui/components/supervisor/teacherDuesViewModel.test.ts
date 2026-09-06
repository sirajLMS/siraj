import { describe, expect, test } from "bun:test";
import { groupDueIdsByPaymentId } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/useTeacherDuesViewModel";
import type { TeacherDueRow } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";

describe("useTeacherDuesViewModel - groupDueIdsByPaymentId correctness & performance", () => {
  test("correctly groups due IDs by payment ID in O(N + M) time", () => {
    // Generate 1000 due rows across 20 teacher payments
    const rows: TeacherDueRow[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `due-${i}`,
      teacherId: `teacher-${i % 10}`,
      teacherName: `Teacher ${i % 10}`,
      teacherUserId: `user-${i % 10}`,
      teacherAvatarUrl: "",
      classInstanceId: `instance-${i}`,
      classDate: "2026-03-01",
      studentId: `student-${i}`,
      studentName: `Student ${i}`,
      studentAvatarUrl: "",
      hours: "1",
      amount: "50.00",
      currency: "USD",
      status: "APPROVED",
      approvedAt: "2026-03-01",
      teacherPaymentId: `payment-${i % 20}`,
      rateSource: "BASE",
    }));

    const dueIdsToGroup = rows.map(r => r.id);

    const byPayment = groupDueIdsByPaymentId(dueIdsToGroup, rows);

    expect(byPayment.size).toBe(20);
    expect(byPayment.get("payment-0")?.length).toBe(50);
    expect(byPayment.get("payment-0")).toContain("due-0");
  });
});
