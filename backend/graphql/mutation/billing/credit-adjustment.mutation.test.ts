import { beforeEach, describe, expect, mock, test } from "bun:test";
import { GraphQLError } from "graphql";
import { CreditAdjustmentType, CreditReason, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { ForbiddenError, ValidationError } from "@/backend/lib/errors";
import type { CreditAdjustmentInput, CreditAdjustmentReturnType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

const ACTOR_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const STUDENT_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const TEACHER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const LEDGER_ROW_ID = "[CARD_REDACTED]-[CARD_REDACTED]";

type MutationResolveArgs = { input: CreditAdjustmentInput };
type RecordAdjustmentResolver = (
  root: unknown,
  args: MutationResolveArgs,
  ctx: BaseContext
) => Promise<CreditAdjustmentReturnType>;

interface CapturedMutationField {
  type: unknown;
  description?: string;
  args: unknown;
  resolve: RecordAdjustmentResolver;
}

// ---------------------------------------------------------------------------
// Mocks — registered before the mutation module is imported.
// ---------------------------------------------------------------------------

const capturedMutations = new Map<string, CapturedMutationField>();

interface FieldBuilderShim {
  field: (config: CapturedMutationField) => CapturedMutationField;
  arg: (config: unknown) => unknown;
}

void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({
  gqlSchemaBuilder: {
    mutationField: (name: string, buildField: (t: FieldBuilderShim) => CapturedMutationField) => {
      capturedMutations.set(name, buildField({ field: config => config, arg: config => config }));
    },
  },
}));

void mock.module("@/backend/graphql/pothos/billing/credit-adjustment.pothos", () => ({
  CreditAdjustmentInputPothosRef: {},
  CreditAdjustmentResultPothosObject: {},
}));

interface RecordAdjustmentCall {
  actorUserId: string;
  input: CreditAdjustmentInput;
}

const recordAdjustmentCalls: RecordAdjustmentCall[] = [];
let serviceResult = buildAdjustmentResult();
let serviceError: Error | null = null;

void mock.module("@/backend/services", () => ({
  CreditService: {
    recordAdjustment: async (
      actorUserId: string,
      input: CreditAdjustmentInput
    ): Promise<CreditAdjustmentReturnType> => {
      recordAdjustmentCalls.push({ actorUserId, input });
      if (serviceError) {
        throw serviceError;
      }
      return serviceResult;
    },
  },
}));

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first) + shared helpers.
// ---------------------------------------------------------------------------

await import("@/backend/graphql/mutation/billing/credit-adjustment.mutation");

function requireMutationField(): CapturedMutationField {
  const captured = capturedMutations.get("recordCreditAdjustment");
  if (!captured) {
    throw new Error("recordCreditAdjustment mutation field was not registered");
  }
  return captured;
}

function mockCtx(userId?: string): BaseContext {
  return {
    user: userId ? { id: userId, displayCurrency: null } : undefined,
    safeUser: undefined,
    permissions: [],
    permissionGroups: [],
    isSuperAdmin: false,
    isImpersonating: false,
    isSimulatingGroup: false,
    refreshToken: undefined,
    sessionId: undefined,
    role: UserRole.USER,
    locale: "en",
    t: () => getServerTranslations("en"),
  };
}

function buildAdjustmentResult(overrides: Partial<CreditAdjustmentReturnType> = {}): CreditAdjustmentReturnType {
  return {
    id: LEDGER_ROW_ID,
    studentId: STUDENT_ID,
    changeAmount: 3,
    changeAmountHours: null,
    reason: CreditReason.CREDIT_ADJUSTMENT_CARRYOVER,
    sourcePaymentId: null,
    classInstanceId: null,
    notes: "carryover settlement",
    creditedByUserId: ACTOR_ID,
    idempotencyKey: "test-idempotency-key",
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
    adjustmentType: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER,
    carryoverTeacherId: TEACHER_ID,
    carryoverFromDate: "2026-08-01",
    carryoverToDate: "2026-08-14",
    carryoverPaymentDate: "2026-08-15",
    ...overrides,
  };
}

function buildCarryoverInput(): CreditAdjustmentInput {
  return {
    studentId: STUDENT_ID,
    adjustmentType: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER,
    hours: 2,
    notes: "carryover settlement",
    carryoverTeacherId: TEACHER_ID,
    carryoverFromDate: "2026-08-01",
    carryoverToDate: "2026-08-14",
    carryoverPaymentDate: "2026-08-15",
  };
}

function buildNullableOptionalInput(): CreditAdjustmentInput {
  return {
    studentId: STUDENT_ID,
    adjustmentType: CreditAdjustmentType.ADD,
    hours: 3,
    notes: null,
    carryoverTeacherId: null,
    carryoverFromDate: null,
    carryoverToDate: null,
    carryoverPaymentDate: null,
  };
}

async function expectResolverError(input: CreditAdjustmentInput, ctx: BaseContext): Promise<Error> {
  let caught: unknown = null;
  try {
    await requireMutationField().resolve(null, { input }, ctx);
  } catch (error) {
    caught = error;
  }
  expect(caught).not.toBeNull();
  if (!(caught instanceof Error)) {
    throw new Error("resolver threw a non-Error value");
  }
  return caught;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("recordCreditAdjustment mutation", () => {
  beforeEach(() => {
    recordAdjustmentCalls.length = 0;
    serviceResult = buildAdjustmentResult();
    serviceError = null;
  });

  test("registers the recordCreditAdjustment root field", () => {
    const mutation = requireMutationField();
    expect(mutation.description).toContain("credit adjustment");
    expect(typeof mutation.resolve).toBe("function");
  });

  test("returns the CreditTransaction-shaped service result and forwards the full input", async () => {
    const input = buildCarryoverInput();

    const data = await requireMutationField().resolve(null, { input }, mockCtx(ACTOR_ID));

    expect(data).toEqual(serviceResult);
    expect(data.id).toBe(LEDGER_ROW_ID);
    expect(data.studentId).toBe(STUDENT_ID);
    expect(data.changeAmount).toBe(3);
    expect(data.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_CARRYOVER);
    expect(data.adjustmentType).toBe(CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER);
    expect(data.notes).toBe("carryover settlement");
    expect(data.carryoverTeacherId).toBe(TEACHER_ID);
    expect(data.carryoverFromDate).toBe("2026-08-01");
    expect(data.carryoverToDate).toBe("2026-08-14");
    expect(data.carryoverPaymentDate).toBe("2026-08-15");

    expect(recordAdjustmentCalls).toHaveLength(1);
    const call = recordAdjustmentCalls[0];
    expect(call?.actorUserId).toBe(ACTOR_ID);
    expect(call?.input).toEqual(input);
  });

  test("passes null optional arguments through to the service", async () => {
    const input = buildNullableOptionalInput();

    await requireMutationField().resolve(null, { input }, mockCtx(ACTOR_ID));

    expect(recordAdjustmentCalls).toHaveLength(1);
    expect(recordAdjustmentCalls[0]?.input).toEqual(input);
  });

  test("propagates a ForbiddenError from the service as a GraphQL FORBIDDEN error", async () => {
    serviceError = new ForbiddenError("insufficient permissions");

    const error = await expectResolverError(buildCarryoverInput(), mockCtx(ACTOR_ID));

    if (!(error instanceof ForbiddenError)) {
      throw new Error("expected the resolver to propagate the service ForbiddenError");
    }
    expect(error.extensions.code).toBe("FORBIDDEN");
  });

  test("propagates a ValidationError from the service with its VALIDATION extension code", async () => {
    serviceError = new ValidationError("invalid credit adjustment input");

    const error = await expectResolverError(buildCarryoverInput(), mockCtx(ACTOR_ID));

    if (!(error instanceof ValidationError)) {
      throw new Error("expected the resolver to propagate the service ValidationError");
    }
    expect(error.extensions.code).toBe("VALIDATION");
  });

  test("rejects unauthenticated callers with a UNAUTHENTICATED GraphQL error", async () => {
    const error = await expectResolverError(buildCarryoverInput(), mockCtx());

    if (!(error instanceof GraphQLError)) {
      throw new Error("expected requireAuth to throw a GraphQLError");
    }
    expect(error.extensions.code).toBe("UNAUTHENTICATED");
    expect(recordAdjustmentCalls).toHaveLength(0);
  });
});
