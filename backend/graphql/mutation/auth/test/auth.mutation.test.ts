import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { AccountStatus, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import type { SessionSelectType, UserSelectType } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { getServerTranslations } from "@/shared/locale";

const TEST_USER_ID = "test-user-id-1234";
const IMPERSONATING_USER_ID = "admin-user-id-5678";

function mockUser(id: string): UserSelectType {
  return {
    id,
    name: "Test User",
    email: "test@example.com",
    password: "hashed",
    rememberTokenHash: null,
    avatarUrl: null,
    avatarFilePath: null,
    phone: null,
    timezone: IanaTimezone.Africa_Cairo,
    status: AccountStatus.ACTIVATED,
    isSuperAdmin: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifiedAt: null,
    lastLoginAt: null,
    displayCurrency: null,
  };
}

function mockSession(): SessionSelectType {
  return {
    hashedId: "hashed-session-id",
    userId: TEST_USER_ID,
    ipAddress: null,
    userAgent: null,
    payload: "{}",
    lastActivity: 100n,
  };
}

// --- Module mocks (must be set before importing the SUT) -------------------

// Prevent Pothos schema registration side effects.
void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({
  gqlSchemaBuilder: {
    mutationFields: () => {},
  },
}));

// Prevent Pothos input/output object registration side effects.
void mock.module("@/backend/graphql/pothos", () => ({
  ChangePasswordInputPothosObject: {},
  DemoLoginInputPothosObject: {},
  LoginInputPothosObject: {},
  LoginResponsePothosObject: {},
  RefreshTokenResponsePothosObject: {},
}));

// Mock JWT functions used by rotateTokensAndSession
void mock.module("@/backend/lib/auth/jwt", () => ({
  generateAccessToken: async () => "new-access-token",
  generateRefreshToken: async () => "new-refresh-token",
  generateImpersonationAccessToken: async () => "impersonation-token",
  generateGroupSimulationAccessToken: async () => "sim-token",
  verifyToken: async () => ({ jti: "new-jti", type: "refresh" }),
  extractTokenFromHeader: () => null,
}));

// Mock auth cookies to prevent next/headers usage
void mock.module("@/backend/lib/auth/cookies", () => ({
  setAuthCookies: () => {},
  clearAuthCookies: () => {},
}));

// Mock createAuthSession to prevent DB access
void mock.module("@/backend/lib/auth/createAuthSession", () => ({
  createAuthSession: async () => ({ accessToken: "access", refreshToken: "refresh", sessionId: "session" }),
}));

// Mock password comparison
void mock.module("@/backend/lib/auth/password", () => ({
  comparePassword: async () => true,
  hashPassword: async () => "hashed",
  validatePasswordStrength: async () => undefined,
}));

// Mock rate limiting
void mock.module("@/backend/lib/ratelimit", () => ({
  authRateLimiter: {},
  checkRateLimit: async () => ({ success: true }),
}));

// Mock requireAuthWithRateLimit
void mock.module("@/backend/graphql/shared", () => ({
  requireAuthWithRateLimit: () => ({}),
}));

// --- Import SUT and dependencies after mocks are registered ----------------

const { UserService, SessionService, ImpersonationService, PermissionGroupSimulationService } = await import(
  "@/backend/services"
);
const { rotateTokensAndSession } = await import("../auth.mutation");

// --- Tests -----------------------------------------------------------------

function mockCtx({
  isImpersonating = false,
  impersonatingUserId,
}: {
  isImpersonating?: boolean;
  impersonatingUserId?: string;
} = {}): BaseContext {
  return {
    user: isImpersonating && impersonatingUserId ? { id: impersonatingUserId, displayCurrency: null } : undefined,
    safeUser: undefined,
    permissions: [],
    permissionGroups: [],
    isSuperAdmin: false,
    isImpersonating,
    isSimulatingGroup: false,
    refreshToken: undefined,
    sessionId: undefined,
    role: UserRole.USER,
    locale: "en",
    t: () => getServerTranslations("en"),
  };
}

afterEach(() => {
  spyOn(UserService, "findById").mockRestore();
  spyOn(SessionService, "updateSession").mockRestore();
  spyOn(ImpersonationService, "issueAccessTokenForSession").mockRestore();
  spyOn(PermissionGroupSimulationService, "issueAccessTokenForSession").mockRestore();
});

describe("rotateTokensAndSession user reuse optimization", () => {
  test("reuses already-loaded user when not impersonating (no UserService.findById call)", async () => {
    const user = mockUser(TEST_USER_ID);
    const session = mockSession();
    const ctx = mockCtx();

    const updateSpy = spyOn(SessionService, "updateSession").mockResolvedValue(session);
    const findByIdSpy = spyOn(UserService, "findById").mockResolvedValue(user);

    const result = await rotateTokensAndSession(user, session, ctx);

    expect(result).not.toBeNull();
    expect(findByIdSpy).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  test("fetches user via UserService.findById when impersonating", async () => {
    const user = mockUser(TEST_USER_ID);
    const impersonatedUser = mockUser(IMPERSONATING_USER_ID);
    const session = mockSession();
    const ctx = mockCtx({ isImpersonating: true, impersonatingUserId: IMPERSONATING_USER_ID });

    spyOn(ImpersonationService, "issueAccessTokenForSession").mockResolvedValue(null);
    spyOn(PermissionGroupSimulationService, "issueAccessTokenForSession").mockResolvedValue(null);
    spyOn(SessionService, "updateSession").mockResolvedValue(session);
    const findByIdSpy = spyOn(UserService, "findById").mockResolvedValue(impersonatedUser);

    const result = await rotateTokensAndSession(user, session, ctx);

    expect(result).not.toBeNull();
    expect(findByIdSpy).toHaveBeenCalledWith(IMPERSONATING_USER_ID);
  });
});
