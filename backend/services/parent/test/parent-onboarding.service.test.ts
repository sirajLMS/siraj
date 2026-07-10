import { describe, expect, spyOn, test } from "bun:test";
import { PermissionManagementRepository, UserRepository } from "@/backend/db/repo";
import { createTestUser, runInRollback } from "@/backend/db/test/test-utils";
import { CurrencyCode } from "@/backend/enum";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ParentOnboardingService } from "@/backend/services/parent/parent-onboarding.service";

describe("ParentOnboardingService.createParent", () => {
  test("rejects unauthorized user", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);

    let error: unknown = null;
    try {
      await ParentOnboardingService.createParent("00000000-0000-0000-0000-000000000000", {
        name: "Test",
        email: "test@test.com",
        password: "TestPassword1!",
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("permissions");
    hasPermissionSpy.mockRestore();
  });

  test("creates parent with billing configuration", async () => {
    await runInRollback(async txContext => {
      const actor = await createTestUser(txContext);
      const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
      const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

      const result = await ParentOnboardingService.createParent(
        actor.id,
        {
          name: "New Parent",
          email: "newparent@test.com",
          password: "TestPassword1!",
          phone: "+1234567890",
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
        "en",
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
      await ParentOnboardingService.createParent("00000000-0000-0000-0000-000000000000", {
        name: "Dup Parent",
        email: "existing@test.com",
        password: "TestPassword1!",
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("email");

    hasPermissionSpy.mockRestore();
    existsByEmailSpy.mockRestore();
  });

  test("rolls back transaction on subsequent failure", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

    const createdEmail = "rollback-parent@test.com";
    const listAllGroupsSpy = spyOn(PermissionManagementRepository, "listAllGroups").mockRejectedValue(
      new Error("Database failure")
    );

    let error: unknown = null;
    try {
      await ParentOnboardingService.createParent("00000000-0000-0000-0000-000000000000", {
        name: "Rollback Parent",
        email: createdEmail,
        password: "TestPassword1!",
      });
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
