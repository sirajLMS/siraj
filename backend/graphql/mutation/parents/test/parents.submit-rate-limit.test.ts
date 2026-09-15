import { describe, expect, mock, test } from "bun:test";
import { GraphQLError } from "graphql";
import { UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { getServerTranslations } from "@/shared/locale";

const TEST_USER_ID = "test-user-id-1234";

type CapturedField = {
  resolve: (root: unknown, args: unknown, ctx: unknown) => Promise<unknown>;
};
const registeredFields = new Map<string, CapturedField>();

// --- Module mocks (must be set before importing the SUT) -------------------

// Capture mutation-field registrations instead of hitting the Pothos schema builder.
const fakeT = {
  field: (config: unknown) => config,
  arg: Object.assign((opts?: unknown) => opts, { string: (opts?: unknown) => opts }),
};

void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({
  gqlSchemaBuilder: {
    mutationField: (name: string, build: (t: unknown) => CapturedField) => {
      registeredFields.set(name, build(fakeT));
    },
  },
}));

void mock.module("@/backend/graphql/pothos/complaints/complaint.pothos", () => ({
  ComplaintPothosObject: {},
  SubmitComplaintInputPothosObject: {},
  normalizeComplaint: (input: unknown) => input,
}));

void mock.module("@/backend/graphql/pothos/parents/suggestion.pothos", () => ({
  MarkSuggestionDuplicateInputPothosObject: {},
  RespondToSuggestionInputPothosObject: {},
  SubmitSuggestionInputPothosObject: {},
  SuggestionPothosObject: {},
}));

void mock.module("@/backend/graphql/utils/requireAuth", () => ({
  requireAuth: async () => TEST_USER_ID,
  requireUserId: () => TEST_USER_ID,
}));

void mock.module("@/backend/lib", () => ({
  isComplaintCategory: () => true,
  isComplaintStatus: () => true,
}));

// Rate limiting is controlled per test via the mutable response binding.
let rateLimitResponse = { success: true };
let lastRateLimitIdentifier = "";
void mock.module("@/backend/lib/ratelimit", () => ({
  authRateLimiter: {},
  checkRateLimit: async (identifier: string) => {
    lastRateLimitIdentifier = identifier;
    return rateLimitResponse;
  },
}));

const serviceCallRecorder = { calls: 0, args: [] as unknown[] };
void mock.module("@/backend/services", () => ({
  ComplaintService: {
    submitComplaint: async (...args: unknown[]) => {
      serviceCallRecorder.calls += 1;
      serviceCallRecorder.args = args;
      return {
        id: "complaint-id",
        category: "OTHER",
        status: "UNANSWERED",
        body: "complaint body",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    deleteComplaint: async () => true,
  },
  SuggestionService: {
    submitSuggestion: async (...args: unknown[]) => {
      serviceCallRecorder.calls += 1;
      serviceCallRecorder.args = args;
      return {
        id: "suggestion-id",
        body: "suggestion body",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    mapSuggestionReturnType: (input: unknown) => input,
  },
}));

// --- Import SUT after mocks are registered (side-effect registration) ------

await import("../complaint.mutation");
await import("../suggestion.mutation");

// --- Tests -----------------------------------------------------------------

function getField(name: string): CapturedField {
  const field = registeredFields.get(name);
  if (!field) {
    throw new Error(`mutation field not registered: ${name}`);
  }
  return field;
}

function mockCtx(ipAddress?: string): BaseContext {
  return {
    user: { id: TEST_USER_ID, displayCurrency: null },
    safeUser: undefined,
    permissions: [],
    permissionGroups: [],
    isSuperAdmin: false,
    isImpersonating: false,
    isSimulatingGroup: false,
    refreshToken: undefined,
    sessionId: undefined,
    ipAddress,
    role: UserRole.USER,
    locale: "en",
    t: () => getServerTranslations("en"),
  };
}

async function catchResolverError(field: CapturedField, ctx: BaseContext): Promise<unknown> {
  try {
    await field.resolve(null, { input: {} }, ctx);
    return undefined;
  } catch (error) {
    return error;
  }
}

function requireGraphQLError(caught: unknown): GraphQLError {
  if (!(caught instanceof GraphQLError)) {
    throw new Error("expected resolver to throw a GraphQLError");
  }
  return caught;
}

describe("submitComplaint rate limiting", () => {
  test("throws TOO_MANY_ATTEMPTS with the localized message when rate limited", async () => {
    rateLimitResponse = { success: false };
    const error = requireGraphQLError(await catchResolverError(getField("submitComplaint"), mockCtx("203.0.113.10")));

    expect(error.message).toBe(getServerTranslations("en").errorsTranslations.auth.tooManyLoginAttempts);
    expect(error.extensions?.code).toBe("TOO_MANY_ATTEMPTS");
    expect(lastRateLimitIdentifier).toBe("203.0.113.10");
  });

  test("uses the [unknown] fallback identifier when ctx.ipAddress is absent", async () => {
    rateLimitResponse = { success: false };
    await catchResolverError(getField("submitComplaint"), mockCtx());
    expect(lastRateLimitIdentifier).toBe("[unknown]");
  });

  test("calls ComplaintService.submitComplaint when the rate limit passes", async () => {
    rateLimitResponse = { success: true };
    serviceCallRecorder.calls = 0;

    const result = await getField("submitComplaint").resolve(null, { input: {} }, mockCtx("203.0.113.10"));

    expect(serviceCallRecorder.calls).toBe(1);
    expect(serviceCallRecorder.args[0]).toBe(TEST_USER_ID);
    expect(result).toBeDefined();
  });
});

describe("submitSuggestion rate limiting", () => {
  test("throws TOO_MANY_ATTEMPTS with the localized message when rate limited", async () => {
    rateLimitResponse = { success: false };
    const error = requireGraphQLError(await catchResolverError(getField("submitSuggestion"), mockCtx("203.0.113.10")));

    expect(error.message).toBe(getServerTranslations("en").errorsTranslations.auth.tooManyLoginAttempts);
    expect(error.extensions?.code).toBe("TOO_MANY_ATTEMPTS");
    expect(lastRateLimitIdentifier).toBe("203.0.113.10");
  });

  test("calls SuggestionService.submitSuggestion when the rate limit passes", async () => {
    rateLimitResponse = { success: true };
    serviceCallRecorder.calls = 0;

    await getField("submitSuggestion").resolve(null, { input: {} }, mockCtx("203.0.113.10"));

    expect(serviceCallRecorder.calls).toBe(1);
    expect(serviceCallRecorder.args[0]).toBe(TEST_USER_ID);
  });
});
