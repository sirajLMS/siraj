import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { GraphQLError } from "graphql";
import type { UserSelectType } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

const TEST_IP = "[IP_REDACTED]";

function makeTransientError(message: string): Error {
  const err = new Error(message);
  Object.defineProperty(err, "code", { value: "ECONNRESET", enumerable: true });
  return err;
}

function isGraphQLError(error: unknown): error is GraphQLError {
  return error instanceof GraphQLError;
}

interface LoginResult {
  token: string;
  user: unknown;
}

function isLoginResult(value: unknown): value is LoginResult {
  return typeof value === "object" && value !== null && "token" in value;
}

function mockUser(): UserSelectType {
  return {
    id: "test-user-id-1234",
    name: "Test User",
    email: "[EMAIL_REDACTED]",
    password: "hashed",
    rememberTokenHash: null,
    avatarUrl: null,
    avatarFilePath: null,
    phone: null,
    timezone: IanaTimezone.Africa_Cairo,
    status: "ACTIVATED",
    isSuperAdmin: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifiedAt: null,
    lastLoginAt: null,
    displayCurrency: null,
  };
}

// --- Capture the login resolver from gqlSchemaBuilder.mutationFields --------

interface MutationFieldConfig {
  type: unknown;
  args: Record<string, unknown>;
  resolve: (
    parent: unknown,
    args: { input: { email: { value: string }; password: string } },
    ctx: unknown
  ) => Promise<unknown>;
}

let capturedLoginResolver: MutationFieldConfig["resolve"] | null = null;

void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({
  gqlSchemaBuilder: {
    mutationFields: (cb: (t: unknown) => Record<string, MutationFieldConfig>) => {
      const fakeBuilder = {
        arg: (opts: unknown) => opts,
        field: (config: MutationFieldConfig) => config,
      };
      const fields = cb(fakeBuilder);
      if (fields?.login?.resolve) {
        capturedLoginResolver = fields.login.resolve;
      }
    },
  },
}));

void mock.module("@/backend/graphql/pothos", () => ({
  ChangePasswordInputPothosObject: {},
  DemoLoginInputPothosObject: {},
  LoginInputPothosObject: {},
  LoginResponsePothosObject: {},
  RefreshTokenResponsePothosObject: {},
}));

void mock.module("@/backend/graphql/shared", () => ({
  requireAuthWithRateLimit: () => ({}),
}));

void mock.module("@/backend/lib/auth/jwt", () => ({
  generateAccessToken: async () => "access-token",
  generateRefreshToken: async () => "refresh-token",
  generateImpersonationAccessToken: async () => "imp-token",
  generateGroupSimulationAccessToken: async () => "sim-token",
  verifyToken: async () => ({ jti: "jti", type: "refresh" }),
  extractTokenFromHeader: () => null,
}));

void mock.module("@/backend/lib/auth/cookies", () => ({
  setAuthCookies: () => {},
  clearAuthCookies: () => {},
}));

void mock.module("@/backend/lib/auth/createAuthSession", () => ({
  createAuthSession: async () => ({ accessToken: "access", refreshToken: "refresh", sessionId: "session-1" }),
}));

void mock.module("@/backend/lib/auth/password", () => ({
  comparePassword: async () => true,
  hashPassword: async () => "hashed",
  validatePasswordStrength: async () => undefined,
}));

void mock.module("@/backend/lib/ratelimit", () => ({
  authRateLimiter: {},
  checkRateLimit: async () => ({ success: true }),
}));

void mock.module("@/backend/lib/env", () => ({
  getBooleanEnv: () => false,
}));

// --- Import SUT (triggers mutationFields registration) ----------------------

await import("../auth.mutation");
const { RateLimitService, UserService } = await import("@/backend/services");

// --- Mock context helper ---------------------------------------------------

function mockCtx() {
  return {
    ipAddress: TEST_IP,
    user: undefined,
    safeUser: undefined,
    permissions: [],
    permissionGroups: [],
    isSuperAdmin: false,
    isImpersonating: false,
    isSimulatingGroup: false,
    refreshToken: undefined,
    sessionId: undefined,
    role: "USER" as const,
    locale: "en",
    t: () => ({
      errorsTranslations: {
        auth: {
          tooManyLoginAttempts: "Too many login attempts",
          invalidCredentials: "Invalid email or password",
          serviceUnavailable: "Service temporarily unavailable",
          accountLocked: "Account locked",
          accountDeactivated: "Account deactivated",
        },
      },
    }),
  };
}

// --- Tests -----------------------------------------------------------------

describe("login resolver cold-start fail-open behavior", () => {
  beforeEach(() => {
    // No setTimeout mocking needed — retryTransient uses setTimeout for delays
    // Tests don't depend on timing, only on retry behavior
  });

  afterEach(() => {
    spyOn(RateLimitService, "isLocked").mockRestore();
    spyOn(RateLimitService, "recordAttempt").mockRestore();
    spyOn(RateLimitService, "resetAttempts").mockRestore();
    spyOn(UserService, "findByEmail").mockRestore();
  });

  test("isLocked transient failure → fail-open (proceeds to credential check)", async () => {
    spyOn(UserService, "findByEmail").mockResolvedValue(mockUser());
    spyOn(RateLimitService, "isLocked").mockRejectedValue(makeTransientError("connect ETIMEDOUT"));
    spyOn(RateLimitService, "resetAttempts").mockResolvedValue(undefined);

    const ctx = mockCtx();
    const input = { email: { value: "[EMAIL_REDACTED]" }, password: "password" };

    const result = await capturedLoginResolver?.({}, { input }, ctx);

    expect(isLoginResult(result)).toBe(true);
    if (isLoginResult(result)) {
      expect(result.token).toBe("access");
    }
  });

  test("findByEmail transient failure → retried then SERVICE_UNAVAILABLE after exhaustion", async () => {
    spyOn(UserService, "findByEmail").mockRejectedValue(makeTransientError("connect ECONNRESET"));
    spyOn(RateLimitService, "isLocked").mockResolvedValue(false);

    const ctx = mockCtx();
    const input = { email: { value: "[EMAIL_REDACTED]" }, password: "password" };

    let caughtError: unknown;
    try {
      await capturedLoginResolver?.({}, { input }, ctx);
    } catch (err) {
      caughtError = err;
    }

    expect(isGraphQLError(caughtError)).toBe(true);
    if (isGraphQLError(caughtError)) {
      expect(caughtError.extensions?.code).toBe("SERVICE_UNAVAILABLE");
    }
    expect(UserService.findByEmail).toHaveBeenCalledTimes(4);
  });

  test("findByEmail transient then succeeds → login proceeds", async () => {
    const user = mockUser();
    spyOn(UserService, "findByEmail")
      .mockRejectedValueOnce(makeTransientError("connect ECONNRESET"))
      .mockResolvedValueOnce(user);
    spyOn(RateLimitService, "isLocked").mockResolvedValue(false);
    spyOn(RateLimitService, "resetAttempts").mockResolvedValue(undefined);

    const ctx = mockCtx();
    const input = { email: { value: "[EMAIL_REDACTED]" }, password: "password" };

    const result = await capturedLoginResolver?.({}, { input }, ctx);

    expect(isLoginResult(result)).toBe(true);
    if (isLoginResult(result)) {
      expect(result.token).toBe("access");
    }
    expect(UserService.findByEmail).toHaveBeenCalledTimes(2);
  });

  test("recordAttempt transient failure → fail-open (does not block)", async () => {
    spyOn(UserService, "findByEmail").mockResolvedValue(null);
    spyOn(RateLimitService, "isLocked").mockResolvedValue(false);
    spyOn(RateLimitService, "recordAttempt").mockRejectedValue(makeTransientError("connect ETIMEDOUT"));

    const ctx = mockCtx();
    const input = { email: { value: "[EMAIL_REDACTED]" }, password: "password" };

    let caughtError: unknown;
    try {
      await capturedLoginResolver?.({}, { input }, ctx);
    } catch (err) {
      caughtError = err;
    }

    expect(isGraphQLError(caughtError)).toBe(true);
    if (isGraphQLError(caughtError)) {
      expect(caughtError.extensions?.code).toBe("INVALID_CREDENTIALS");
    }
    expect(RateLimitService.recordAttempt).toHaveBeenCalledTimes(1);
  });

  test("resetAttempts transient failure → does not block successful login", async () => {
    spyOn(UserService, "findByEmail").mockResolvedValue(mockUser());
    spyOn(RateLimitService, "isLocked").mockResolvedValue(false);
    spyOn(RateLimitService, "resetAttempts").mockRejectedValue(makeTransientError("connect ETIMEDOUT"));

    const ctx = mockCtx();
    const input = { email: { value: "[EMAIL_REDACTED]" }, password: "password" };

    const result = await capturedLoginResolver?.({}, { input }, ctx);

    expect(isLoginResult(result)).toBe(true);
    if (isLoginResult(result)) {
      expect(result.token).toBe("access");
      expect(result.user).toBeDefined();
    }
  });
});
