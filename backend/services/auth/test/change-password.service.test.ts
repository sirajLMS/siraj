import { beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { SessionRepository } from "@/backend/db/repo";
import { UserRepository } from "@/backend/db/repo/users";
import { hashPassword } from "@/backend/lib/auth/password";
import { AuthPasswordService } from "@/backend/services/auth/auth-password.service";
import type { ChangePasswordInput } from "@/backend/types";
import { errorsEn } from "@/shared/locale/en/errors";

const USER_ID = randomUUID();
const tErrors = errorsEn;

let currentPassword: string;
let newPassword: string;
let currentPasswordHash: string;

beforeAll(async () => {
  currentPassword = `CurrentPass-${randomUUID().slice(0, 8)}!`;
  newPassword = `NewPass-${randomUUID().slice(0, 8)}!`;
  currentPasswordHash = await hashPassword(currentPassword);
});

function mockUser() {
  return {
    id: USER_ID,
    name: "Test User",
    email: `user-${randomUUID().slice(0, 8)}@example.com`,
    password: currentPasswordHash,
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

function setupMocks(opts: { deletedSessionCount?: number } = {}) {
  const findUserSpy = spyOn(UserRepository, "findUserByIdOrThrow").mockResolvedValue(mockUser());
  const updatePasswordSpy = spyOn(UserRepository, "updatePassword").mockResolvedValue(mockUser());
  const deleteSessionsSpy = spyOn(SessionRepository, "deleteByUserId").mockResolvedValue(opts.deletedSessionCount ?? 2);

  return {
    findUserSpy: findUserSpy,
    updatePasswordSpy: updatePasswordSpy,
    deleteSessionsSpy: deleteSessionsSpy,
    restore: () => {
      findUserSpy.mockRestore();
      updatePasswordSpy.mockRestore();
      deleteSessionsSpy.mockRestore();
    },
  };
}

function defaultInput(
  overrides: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {}
): ChangePasswordInput {
  return {
    currentPassword: overrides.currentPassword ?? currentPassword,
    newPassword: overrides.newPassword ?? newPassword,
    confirmPassword: overrides.confirmPassword ?? newPassword,
  };
}

describe("AuthPasswordService.changePassword", () => {
  test("succeeds and revokes all user sessions after the password update", async () => {
    const spies = setupMocks();

    const result = await AuthPasswordService.changePassword(USER_ID, defaultInput(), "en");

    expect(result).toBe(true);
    expect(spies.updatePasswordSpy).toHaveBeenCalledWith(USER_ID, expect.any(String), undefined, "en");
    expect(spies.deleteSessionsSpy).toHaveBeenCalledWith(USER_ID);
    expect(spies.deleteSessionsSpy).toHaveBeenCalledTimes(1);

    spies.restore();
  });

  test("does not throw when the user has zero active sessions (deleteByUserId resolves 0)", async () => {
    const spies = setupMocks({ deletedSessionCount: 0 });

    const result = await AuthPasswordService.changePassword(USER_ID, defaultInput(), "en");

    expect(result).toBe(true);
    expect(spies.deleteSessionsSpy).toHaveBeenCalledWith(USER_ID);

    spies.restore();
  });

  test("does not revoke sessions when the current password is invalid", async () => {
    const spies = setupMocks();

    const error = await expectRejection(() =>
      AuthPasswordService.changePassword(
        USER_ID,
        defaultInput({ currentPassword: `Wrong-${randomUUID().slice(0, 8)}!` }),
        "en"
      )
    );

    expect(error.message).toContain(tErrors.auth.currentPasswordInvalid);
    expect(spies.updatePasswordSpy).not.toHaveBeenCalled();
    expect(spies.deleteSessionsSpy).not.toHaveBeenCalled();

    spies.restore();
  });

  test("does not revoke sessions when the new password and confirmation do not match", async () => {
    const spies = setupMocks();

    const error = await expectRejection(() =>
      AuthPasswordService.changePassword(
        USER_ID,
        defaultInput({ confirmPassword: `Other-${randomUUID().slice(0, 8)}!` }),
        "en"
      )
    );

    expect(error.message).toContain(tErrors.auth.passwordsDoNotMatch);
    expect(spies.deleteSessionsSpy).not.toHaveBeenCalled();

    spies.restore();
  });
});
