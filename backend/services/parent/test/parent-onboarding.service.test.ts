import { beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { UserRepository } from "@/backend/db/repo/users";
import { createTestUserWithDefaults, runInRollback } from "@/backend/db/test/test-utils";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ParentOnboardingService } from "@/backend/services/parent/parent-onboarding.service";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

let tErrors: ErrorsLabels;

function generateTestPassword(): string {
  return `TestPass-${randomUUID().slice(0, 8)}!`;
}

beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

describe("ParentOnboardingService.createParent", () => {
  test("rejects unauthorized user", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);
    let error: unknown = null;
    try {
      await ParentOnboardingService.createParent(
        "[CARD_REDACTED]-[CARD_REDACTED]",
        {
          name: "Test",
          email: "[EMAIL_REDACTED]",
          password: generateTestPassword(),
        },
        tErrors
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toContain("permissions");
    }
    hasPermissionSpy.mockRestore();
  });

  test("creates parent with billing configuration", async () => {
    await runInRollback(async txContext => {
      const actor = await createTestUserWithDefaults(txContext);
      const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
      const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

      const result = await ParentOnboardingService.createParent(
        actor.id,
        {
          name: "New Parent",
          email: `newparent-${randomUUID()}@test.com`,
          password: generateTestPassword(),
          phone: "+[PHONE_REDACTED]",
          invoiceType: "MONTHLY",
          feeAmount: "500.00",
          initialPayinMethod: {
            type: PaymentMethodType.CASH,
            direction: PaymentDirection.PAYIN,
            isDefault: true,
            details: { note: "Front desk" },
          },
          currency: CurrencyCode.USD,
          timezone: "America/Chicago",
        },
        tErrors,
        txContext
      );

      expect(result.userId).toBeDefined();
      expect(result.parentId).toBeDefined();
      expect(result.invoiceType).toBe("MONTHLY");
      expect(result.currency).toBe(CurrencyCode.USD);

      hasPermissionSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });

  test("rejects duplicate email", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(true);

    let error: unknown = null;
    try {
      await ParentOnboardingService.createParent(
        "[CARD_REDACTED]-[CARD_REDACTED]",
        {
          name: "Dup Parent",
          email: "[EMAIL_REDACTED]",
          password: generateTestPassword(),
        },
        tErrors
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toContain("email");
    }

    hasPermissionSpy.mockRestore();
    existsByEmailSpy.mockRestore();
  });

  test("rolls back transaction on subsequent failure", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

    const createdEmail = "[EMAIL_REDACTED]";
    const listAllGroupsSpy = spyOn(PermissionManagementRepository, "listAllGroups").mockRejectedValue(
      new Error("Database failure")
    );

    let error: unknown = null;
    try {
      await ParentOnboardingService.createParent(
        "[CARD_REDACTED]-[CARD_REDACTED]",
        {
          name: "Rollback Parent",
          email: createdEmail,
          password: generateTestPassword(),
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
