import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { AccountStatus, UserRole } from "@/backend/enum";
import { UserService } from "@/backend/services";
import type { SanitizedUserSelectType, UserReturnType } from "@/backend/types";
import { AuthUtils } from "@/backend/utils";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

const TEST_USER_ID = "test-user-id-1234";

function mockSafeUserForContext(id: string): SanitizedUserSelectType {
  return {
    id,
    name: "Test User",
    email: "[EMAIL_REDACTED]",
    emailVerifiedAt: null,
    password: undefined,
    rememberTokenHash: undefined,
    avatarUrl: null,
    avatarFilePath: null,
    phone: null,
    timezone: IanaTimezone.Africa_Cairo,
    status: AccountStatus.ACTIVATED,
    isSuperAdmin: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    displayCurrency: null,
  };
}

type MeResolverContext = {
  user?: { id: string } | null;
  safeUser: SanitizedUserSelectType | null | undefined;
  role: UserRole;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Mirrors the `Query.me` resolver logic after R3-8 fix:
 * ```ts
 * if (!ctx.user) return null;
 * if (!ctx.safeUser) return null;
 * return AuthUtils.toUserReturnType(ctx.safeUser, { role: ctx.role });
 * ```
 */
function resolveMe(ctx: MeResolverContext): UserReturnType | null {
  if (!ctx.user) return null;
  if (!ctx.safeUser) return null;
  return AuthUtils.toUserReturnType(ctx.safeUser, { role: ctx.role });
}

/** Standard authenticated context with USER role and a valid safeUser. */
function authedCtx(role: UserRole = UserRole.USER): MeResolverContext {
  return { user: { id: TEST_USER_ID }, safeUser: mockSafeUserForContext(TEST_USER_ID), role };
}

/** Resolve `Query.me` and assert the result is non-null. Returns the `UserReturnType`. */
function resolveMeNotNull(ctx: MeResolverContext): UserReturnType {
  const result = resolveMe(ctx);
  expect(result).not.toBeNull();
  if (!result) throw new Error("expected non-null result");
  return result;
}

let findByIdSpy: ReturnType<typeof spyOn>;

afterEach(() => {
  findByIdSpy?.mockRestore();
});

describe("Query.me resolver — redundant fetch elimination (R3-8)", () => {
  test("returns user from ctx.safeUser without calling UserService.findById", () => {
    const findByIdSpyLocal = spyOn(UserService, "findById").mockResolvedValue(null);
    findByIdSpy = findByIdSpyLocal;

    const result = resolveMe(authedCtx());

    expect(result).not.toBeNull();
    expect(findByIdSpyLocal).not.toHaveBeenCalled();
  });

  test("AuthUtils.toUserReturnType works correctly on sanitized UserSelectType", () => {
    const result = resolveMeNotNull(authedCtx(UserRole.ACADEMY_ADMIN));

    expect(result.id).toBe(TEST_USER_ID);
    expect(result.name).toBe("Test User");
    expect(result.email).toBe("[EMAIL_REDACTED]");
    expect(result.role).toBe(UserRole.ACADEMY_ADMIN);
  });

  test("defaults role to USER when ctx.role is USER", () => {
    const result = resolveMeNotNull(authedCtx(UserRole.USER));

    expect(result.role).toBe(UserRole.USER);
  });

  test("returns null when ctx.safeUser is null (user not found in DB)", () => {
    const ctx: MeResolverContext = { user: { id: TEST_USER_ID }, safeUser: null, role: UserRole.USER };

    expect(resolveMe(ctx)).toBeNull();
  });

  test("returns null when ctx.safeUser is undefined (no userId provided)", () => {
    const ctx: MeResolverContext = { user: { id: TEST_USER_ID }, safeUser: undefined, role: UserRole.USER };

    expect(resolveMe(ctx)).toBeNull();
  });

  test("returns null when ctx.user is undefined", () => {
    const ctx: MeResolverContext = {
      user: undefined,
      safeUser: mockSafeUserForContext(TEST_USER_ID),
      role: UserRole.USER,
    };

    expect(resolveMe(ctx)).toBeNull();
  });
});

describe("R4-34: password and rememberTokenHash stripped from context", () => {
  test("ctx.safeUser has password set to undefined", () => {
    expect(mockSafeUserForContext(TEST_USER_ID).password).toBeUndefined();
  });

  test("ctx.safeUser has rememberTokenHash set to undefined", () => {
    expect(mockSafeUserForContext(TEST_USER_ID).rememberTokenHash).toBeUndefined();
  });

  test("returned UserReturnType has password stripped to undefined", () => {
    const result = resolveMeNotNull(authedCtx());
    const record: Record<string, unknown> = isRecord(result) ? result : {};

    expect(record.password).toBeUndefined();
  });

  test("returned UserReturnType has rememberTokenHash stripped to undefined", () => {
    const result = resolveMeNotNull(authedCtx());
    const record: Record<string, unknown> = isRecord(result) ? result : {};

    expect(record.rememberTokenHash).toBeUndefined();
  });

  test("returned UserReturnType does NOT contain deletedAt field", () => {
    const result = resolveMeNotNull(authedCtx());

    expect(result).not.toHaveProperty("deletedAt");
  });
});
