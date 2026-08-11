import { beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { UserRepository } from "@/backend/db/repo";
import { NotificationChannel, NotificationEventType } from "@/backend/enum/notifications/notificationDeliveries.enum";
import { logger } from "@/backend/lib/logger";
import { AuthPasswordService } from "@/backend/services/auth/auth-password.service";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import { AuditService } from "@/backend/services/system/audit.service";
import type { AdminResetPasswordInput } from "@/backend/types/auth/auth.types";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale";

const ACTOR_ID = randomUUID();
const TARGET_ID = randomUUID();
function generateTestPassword(): string {
  return `TestPass-${randomUUID().slice(0, 8)}!`;
}

let testPassword: string;

let tErrors: ErrorsLabels;

beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
  testPassword = generateTestPassword();
});

function mockTargetUser() {
  return {
    id: TARGET_ID,
    name: "Target User",
    email: "target@example.com",
    password: randomUUID(),
    status: "ACTIVATED" as const,
    isSuperAdmin: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifiedAt: null,
    rememberTokenHash: null,
    avatarFilePath: null,
    avatarUrl: null,
    lastLoginAt: null,
    timezone: "UTC" as const,
    displayCurrency: null,
    phone: null,
  };
}

async function expectRejection(fn: () => Promise<unknown>): Promise<Error> {
  let error: unknown = null;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  expect(error).not.toBeNull();
  if (error instanceof Error) return error;
  return new Error(String(error));
}

type ErrorScenario =
  | { type: "permission"; hasPermission: false }
  | { type: "self" }
  | { type: "notFound" }
  | { type: "validation"; newPassword: string };

function setupErrorMocks(scenario: ErrorScenario) {
  const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(scenario.type !== "permission");
  const findUserSpy = spyOn(UserRepository, "findUserByIdOrThrow");
  if (scenario.type === "notFound") {
    findUserSpy.mockRejectedValue(new Error(tErrors.userNotFound(TARGET_ID)));
  } else {
    findUserSpy.mockResolvedValue(mockTargetUser());
  }
  const updatePasswordSpy = spyOn(UserRepository, "updatePassword");

  return {
    hasPermissionSpy,
    findUserSpy,
    updatePasswordSpy,
    restore: () => {
      hasPermissionSpy.mockRestore();
      findUserSpy.mockRestore();
      updatePasswordSpy.mockRestore();
    },
  };
}

function defaultInput(overrides: { userId?: string; newPassword?: string } = {}): AdminResetPasswordInput {
  return {
    userId: overrides.userId ?? TARGET_ID,
    newPassword: overrides.newPassword ?? testPassword,
    sendNotificationEmail: false,
  };
}

async function runErrorTest(
  scenario: ErrorScenario,
  expectedErrorFragment: string,
  checks: (spies: ReturnType<typeof setupErrorMocks>, error: Error) => void
): Promise<void> {
  const spies = setupErrorMocks(scenario);
  const overrides: { userId?: string; newPassword?: string } = {};
  if (scenario.type === "self") overrides.userId = ACTOR_ID;
  if (scenario.type === "validation") overrides.newPassword = "short";

  const targetArg = overrides.userId ?? TARGET_ID;
  const error = await expectRejection(() =>
    AuthPasswordService.adminResetPassword(ACTOR_ID, targetArg, defaultInput(overrides), "en")
  );
  expect(error.message).toContain(expectedErrorFragment);
  checks(spies, error);
  spies.restore();
}

function setupSuccessMocks(opts: { emailDispatchFails?: boolean } = {}) {
  const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
  const findUserSpy = spyOn(UserRepository, "findUserByIdOrThrow").mockResolvedValue(mockTargetUser());
  const updatePasswordSpy = spyOn(UserRepository, "updatePassword").mockResolvedValue(mockTargetUser());
  const auditSpy = spyOn(AuditService, "createManyAdminAuditLogs").mockResolvedValue([]);

  let emailSpy: ReturnType<typeof spyOn>;
  if (opts.emailDispatchFails) {
    emailSpy = spyOn(CommunicationService, "dispatch").mockRejectedValue(new Error("Email service down"));
  } else {
    emailSpy = spyOn(CommunicationService, "dispatch").mockResolvedValue({
      success: true,
      channel: NotificationChannel.EMAIL,
      messageId: "test-msg-id",
    } as Awaited<ReturnType<typeof CommunicationService.dispatch>>);
  }

  return {
    hasPermissionSpy,
    findUserSpy,
    updatePasswordSpy,
    auditSpy,
    emailSpy,
    restore: () => {
      hasPermissionSpy.mockRestore();
      findUserSpy.mockRestore();
      updatePasswordSpy.mockRestore();
      auditSpy.mockRestore();
      emailSpy.mockRestore();
    },
  };
}

describe("AuthPasswordService.adminResetPassword", () => {
  test("throws insufficientPermissions when actor lacks permission", async () => {
    await runErrorTest({ type: "permission", hasPermission: false }, tErrors.insufficientPermissions, spies => {
      expect(spies.findUserSpy).not.toHaveBeenCalled();
      expect(spies.updatePasswordSpy).not.toHaveBeenCalled();
    });
  });

  test("throws cannotResetOwnPasswordViaAdmin when actor resets own password", async () => {
    await runErrorTest({ type: "self" }, tErrors.auth.cannotResetOwnPasswordViaAdmin, spies => {
      expect(spies.findUserSpy).not.toHaveBeenCalled();
      expect(spies.updatePasswordSpy).not.toHaveBeenCalled();
    });
  });

  test("throws when target user is not found", async () => {
    await runErrorTest({ type: "notFound" }, TARGET_ID, spies => {
      expect(spies.updatePasswordSpy).not.toHaveBeenCalled();
    });
  });

  test("throws when password is too short (validation fails)", async () => {
    await runErrorTest({ type: "validation", newPassword: "short" }, tErrors.auth.passwordMinLength, spies => {
      expect(spies.updatePasswordSpy).not.toHaveBeenCalled();
    });
  });

  test("succeeds and sends email when sendNotificationEmail is true", async () => {
    const spies = setupSuccessMocks();

    const input: AdminResetPasswordInput = {
      userId: TARGET_ID,
      newPassword: testPassword,
      sendNotificationEmail: true,
    };

    const result = await AuthPasswordService.adminResetPassword(ACTOR_ID, TARGET_ID, input, "en");

    expect(result.success).toBe(true);
    expect(result.userId).toBe(TARGET_ID);
    expect(result.emailSent).toBe(true);
    expect(result.message).toBeDefined();
    expect(spies.emailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: TARGET_ID,
        channel: NotificationChannel.EMAIL,
        eventType: NotificationEventType.PASSWORD_RESET_BY_ADMIN,
      }),
      "en"
    );
    expect(spies.auditSpy).toHaveBeenCalled();
    expect(spies.updatePasswordSpy).toHaveBeenCalledWith(TARGET_ID, expect.any(String), undefined, "en");

    spies.restore();
  });

  test("succeeds and does not send email when sendNotificationEmail is false", async () => {
    const spies = setupSuccessMocks();

    const input: AdminResetPasswordInput = {
      userId: TARGET_ID,
      newPassword: testPassword,
      sendNotificationEmail: false,
    };

    const result = await AuthPasswordService.adminResetPassword(ACTOR_ID, TARGET_ID, input, "en");

    expect(result.success).toBe(true);
    expect(result.userId).toBe(TARGET_ID);
    expect(result.emailSent).toBe(false);
    expect(spies.emailSpy).not.toHaveBeenCalled();

    spies.restore();
  });

  test("succeeds even when email dispatch fails (graceful degradation)", async () => {
    const loggerSpy = spyOn(logger, "warn").mockReturnValue(undefined);
    const spies = setupSuccessMocks({ emailDispatchFails: true });

    const input: AdminResetPasswordInput = {
      userId: TARGET_ID,
      newPassword: testPassword,
      sendNotificationEmail: true,
    };

    const result = await AuthPasswordService.adminResetPassword(ACTOR_ID, TARGET_ID, input, "en");

    expect(result.success).toBe(true);
    expect(result.emailSent).toBe(false);

    spies.restore();
    loggerSpy.mockRestore();
  });
});
