import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { NotificationEventType } from "@/shared/lib/enum";
import { testLogger } from "@/shared/lib/testlogger";
import type { TeacherEntity, UserReturnType } from "../../../types";
import { TeacherBankingRepository } from "../../repo/teacher-banking.repository";
import { teachers, users } from "../../schema";
import { runInRollback } from "../test-utils";

async function createTeacherWithAdmin(tx: DBTransaction): Promise<{
  teacher: TeacherEntity;
  teacherUser: UserReturnType;
  adminUser: UserReturnType;
}> {
  const now = new Date();

  const teacherUsers = (await tx
    .insert(users)
    .values({
      name: "Banking Teacher",
      email: `teacher-banking-${randomUUID()}@example.com`,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as UserReturnType[];
  const teacherUser = teacherUsers[0];

  const adminUsers = (await tx
    .insert(users)
    .values({
      name: "Banking Admin",
      email: `admin-banking-${randomUUID()}@example.com`,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as UserReturnType[];
  const adminUser = adminUsers[0];

  const [teacher] = (await tx
    .insert(teachers)
    .values({
      userId: teacherUser.id,
      status: "ACTIVATED",
      timezone: "UTC",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [TeacherEntity];

  return { teacher, teacherUser, adminUser };
}

describe("Teacher Banking Verification & Payments", () => {
  test("Requires admin verification before real payments can use new banking details", async () => {
    testLogger.info("Testing verification gate for real payments...");
    await runInRollback(async tx => {
      const { teacher, adminUser } = await createTeacherWithAdmin(tx);

      const banking = await TeacherBankingRepository.submitBankingDetails(
        {
          teacherId: teacher.id,
          beneficiaryName: "Teacher Name",
          bankName: "Pending Bank",
          accountNumber: "123456",
        },
        tx
      );

      expect(banking.verifiedAt).toBeNull();

      try {
        await TeacherBankingRepository.createTeacherPayment(
          {
            teacherId: teacher.id,
            amount: "100.00",
            currency: "USD",
            paymentDate: new Date(),
          },
          tx
        );
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error;
        expect(err.message).toContain("No verified active banking details");
      }

      const verified = await TeacherBankingRepository.verifyBankingDetails(
        {
          bankingDetailsId: banking.id,
        },
        tx,
        undefined,
        adminUser.id
      );

      expect(verified.verifiedAt).not.toBeNull();
      expect(verified.verifiedByUserId).toBe(adminUser.id);

      const payment = await TeacherBankingRepository.createTeacherPayment(
        {
          teacherId: teacher.id,
          amount: "100.00",
          currency: "USD",
          paymentDate: new Date(),
        },
        tx
      );

      expect(payment.isTestPayment).toBe(false);
      expect(payment.bankingDetailsHistoryId).toBe(banking.id);
    });
    testLogger.info("Verification gate test passed.");
  });

  test("Allows test payments against unverified active banking details", async () => {
    testLogger.info("Testing test payment against unverified details...");
    await runInRollback(async tx => {
      const { teacher } = await createTeacherWithAdmin(tx);

      const banking = await TeacherBankingRepository.submitBankingDetails(
        {
          teacherId: teacher.id,
          beneficiaryName: "Teacher Name",
          bankName: "Test Bank",
          accountNumber: "654321",
        },
        tx
      );

      const testPayment = await TeacherBankingRepository.createTeacherPayment(
        {
          teacherId: teacher.id,
          amount: "1.00",
          currency: "USD",
          paymentDate: new Date(),
          isTestPayment: true,
        },
        tx
      );

      expect(testPayment.isTestPayment).toBe(true);
      expect(testPayment.bankingDetailsHistoryId).toBe(banking.id);
    });
    testLogger.info("Test payment test passed.");
  });

  test("Links each payment to the banking details version active at payment time", async () => {
    testLogger.info("Testing payment-to-banking-details linkage...");
    await runInRollback(async tx => {
      const { teacher, adminUser } = await createTeacherWithAdmin(tx);

      const firstBanking = await TeacherBankingRepository.submitBankingDetails(
        {
          teacherId: teacher.id,
          beneficiaryName: "Teacher Name",
          bankName: "First Bank",
          accountNumber: "111111",
        },
        tx
      );

      await TeacherBankingRepository.verifyBankingDetails(
        {
          bankingDetailsId: firstBanking.id,
        },
        tx,
        undefined,
        adminUser.id
      );

      const firstPayment = await TeacherBankingRepository.createTeacherPayment(
        {
          teacherId: teacher.id,
          amount: "200.00",
          currency: "USD",
          paymentDate: new Date(),
        },
        tx
      );

      const secondBanking = await TeacherBankingRepository.submitBankingDetails(
        {
          teacherId: teacher.id,
          beneficiaryName: "Teacher Name",
          bankName: "Second Bank",
          accountNumber: "222222",
        },
        tx
      );

      await TeacherBankingRepository.verifyBankingDetails(
        {
          bankingDetailsId: secondBanking.id,
        },
        tx,
        undefined,
        adminUser.id
      );

      const secondPayment = await TeacherBankingRepository.createTeacherPayment(
        {
          teacherId: teacher.id,
          amount: "300.00",
          currency: "USD",
          paymentDate: new Date(),
        },
        tx
      );

      const firstLookup = await TeacherBankingRepository.getPaymentWithBankingDetails(firstPayment.id, tx);
      const secondLookup = await TeacherBankingRepository.getPaymentWithBankingDetails(secondPayment.id, tx);

      expect(firstLookup?.payment.bankingDetailsHistoryId).toBe(firstBanking.id);
      expect(firstLookup?.bankingDetails.bankName).toBe("First Bank");
      expect(secondLookup?.payment.bankingDetailsHistoryId).toBe(secondBanking.id);
      expect(secondLookup?.bankingDetails.bankName).toBe("Second Bank");
    });
    testLogger.info("Payment linkage test passed.");
  });

  test("Sends notification when banking details change", async () => {
    testLogger.info("Testing banking change notification...");
    await runInRollback(async tx => {
      const { teacher, teacherUser } = await createTeacherWithAdmin(tx);

      await TeacherBankingRepository.submitBankingDetails(
        {
          teacherId: teacher.id,
          beneficiaryName: "Teacher Name",
          bankName: "Notify Bank",
          accountNumber: "999999",
        },
        tx
      );

      const notifications = await TeacherBankingRepository.getBankingChangeNotifications(teacherUser.id, tx);

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].eventType).toBe(NotificationEventType.BANKING_DETAILS_CHANGED);
      expect(notifications[0].body).toContain("pending admin verification");
    });
    testLogger.info("Banking change notification test passed.");
  });
});
