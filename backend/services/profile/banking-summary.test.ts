import { describe, expect, test } from "bun:test";
import { buildMaskedBankingSummary } from "@/backend/services/profile/banking-summary";
import type { TeacherBankingDetailsHistorySelectType } from "@/backend/types/teacher.types";

const baseRecord: TeacherBankingDetailsHistorySelectType = {
  id: "banking-record-1",
  teacherId: "teacher-1",
  beneficiaryName: "Julian Academic",
  bankName: "First National",
  accountNumber: "12345678",
  routingNumber: "98761234",
  swiftBic: "FNABUS33",
  iban: "GB82WEST12345698765432",
  validFrom: new Date("2023-01-01T00:00:00.000Z"),
  validUntil: null,
  verifiedAt: new Date("2023-10-12T00:00:00.000Z"),
  verifiedByUserId: "admin-1",
  createdAt: new Date("2023-01-01T00:00:00.000Z"),
  updatedAt: new Date("2023-10-12T00:00:00.000Z"),
};

describe("buildMaskedBankingSummary", () => {
  test("masks sensitive banking fields", () => {
    const summary = buildMaskedBankingSummary(baseRecord, "Admin Sarah");

    expect(summary.beneficiaryName).not.toBe(baseRecord.beneficiaryName);
    expect(summary.bankName).not.toBe(baseRecord.bankName);
    expect(summary.accountNumber).toBe("****5678");
    expect(summary.routingNumber).toBe("****1234");
    expect(summary.swiftBic).not.toBe(baseRecord.swiftBic);
    expect(summary.iban).toBe("****5432");
    expect(summary.verifiedByName).toBe("Admin Sarah");
    expect(summary.verifiedAt).toBe("2023-10-12T00:00:00.000Z");
  });
});

describe("ProfileService banking scope rules", () => {
  test("own scope must not expose banking summary via service helper contract", async () => {
    const { loadTeacherBankingSummary } = await import("@/backend/services/profile/banking-summary");
    const summary = await loadTeacherBankingSummary("actor-1", "own", "teacher", "teacher-1");
    expect(summary).toBeNull();
  });
});
