import { describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { UserRepository } from "@/backend/db/repo/users";
import { permissionGroups } from "@/backend/db/schema";
import { createTestUserWithDefaults, runInRollback } from "@/backend/db/test/test-utils";
import { Gender, SystemPermissionGroupSlug } from "@/backend/enum";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { TeacherOnboardingService } from "@/backend/services/teacher/teacher-onboarding.service";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { errorsEn } from "@/shared/locale/en/errors";

const tErrors = errorsEn;

function generateTestPassword(): string {
  return `TestPassword-${randomUUID().slice(0, 8)}!`;
}

describe("TeacherOnboardingService.createTeacher", () => {
  test("rejects unauthorized user", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);

    let error: unknown = null;
    try {
      await TeacherOnboardingService.createTeacher(
        "00000000-0000-0000-0000-000000000000",
        {
          name: "Test",
          email: "test@test.com",
          password: generateTestPassword(),
          timezone: "UTC",
        },
        tErrors
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    if (!(error instanceof Error)) throw new Error(String(error));
    expect(error.message).toContain("permissions");

    hasPermissionSpy.mockRestore();
  });

  test("creates teacher with full onboarding data", async () => {
    await runInRollback(async txContext => {
      await txContext.insert(permissionGroups).values({
        slug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
        name: "Teacher Default",
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing();

      const actor = await createTestUserWithDefaults(txContext);
      const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
      const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

      const result = await TeacherOnboardingService.createTeacher(
        actor.id,
        {
          name: "New Teacher",
          email: "newteacher@test.com",
          password: generateTestPassword(),
          timezone: IanaTimezone.America_New_York,
          nationality: "US",
          phone: "+1234567890",
          gender: Gender.MALE,
          hourlyRate: "30.00",
          rateCurrency: CurrencyCode.USD,
          initialPayoutMethod: {
            type: PaymentMethodType.BANK_TRANSFER,
            direction: PaymentDirection.PAYOUT,
            isDefault: true,
            label: "Primary payout",
            details: {
              beneficiaryName: "John Doe",
              bankName: "Test Bank",
              accountNumber: "123456789",
              iban: "US123456789",
            },
          },
        },
        tErrors,
        "en",
        txContext
      );

      expect(result.userId).toBeDefined();
      expect(result.teacherId).toBeDefined();
      expect(result.name).toBe("New Teacher");
      expect(result.email).toBe("newteacher@test.com");
      expect(result.status).toBe("ACTIVATED");

      hasPermissionSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });

  test("rejects duplicate email", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(true);

    let error: unknown = null;
    try {
      await TeacherOnboardingService.createTeacher(
        "00000000-0000-0000-0000-000000000000",
        {
          name: "Dup Teacher",
          email: "existing@test.com",
          password: generateTestPassword(),
          timezone: "UTC",
        },
        tErrors
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    if (!(error instanceof Error)) throw new Error(String(error));
    expect(error.message).toContain("email");

    hasPermissionSpy.mockRestore();
    existsByEmailSpy.mockRestore();
  });

  test("rolls back transaction on subsequent failure", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

    const createdEmail = "rollback-teacher@test.com";
    const listAllGroupsSpy = spyOn(PermissionManagementRepository, "listAllGroups").mockImplementation(async () => {
      throw new Error("Database failure");
    });

    let error: unknown = null;
    try {
      await TeacherOnboardingService.createTeacher(
        "00000000-0000-0000-0000-000000000000",
        {
          name: "Rollback Teacher",
          email: createdEmail,
          password: generateTestPassword(),
          timezone: "UTC",
        },
        tErrors
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();

    const exists = await UserRepository.existsByEmail(createdEmail);
    expect(exists).toBeFalse();

    hasPermissionSpy.mockRestore();
    existsByEmailSpy.mockRestore();
    listAllGroupsSpy.mockRestore();
  });
});
