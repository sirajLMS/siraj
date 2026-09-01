import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type ExecutionResult, graphql } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import { AppPermission, CalculationStatus, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { JSONScalar } from "@/backend/graphql/scalars/jsonScalar";
import { DomainError } from "@/backend/lib/errors";
import type { PayrollOverrideInput, PayrollOverrideResult } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const INSTANCE_ID = "22222222-2222-2222-2222-222222222222";
const AUDIT_EVENT_ID = "77777777-7777-7777-7777-777777777777";

const tErrorsEn = getServerTranslations("en").errorsTranslations;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildOverrideResult(overrides: Partial<PayrollOverrideResult> = {}): PayrollOverrideResult {
  return {
    instanceId: INSTANCE_ID,
    calculationStatus: CalculationStatus.PARTIALLY,
    teacherPaidAmount: "58.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    calculatedDuration: 58,
    isPartialPercentage: 50,
    payrollNote: "operator note",
    auditEventId: AUDIT_EVENT_ID,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the mutation module is imported. The mutation
// resolves the mocked `PayrollCalculationService` from the `@/backend/services`
// barrel, while the Pothos builder stays real so the scope-auth plugin runs.
// ---------------------------------------------------------------------------

interface ApplyOverrideCall {
  input: PayrollOverrideInput;
  tErrors: ErrorsLabels;
}

const applyOverrideCalls: ApplyOverrideCall[] = [];
let overrideResult: PayrollOverrideResult = buildOverrideResult();
let overrideError: Error | null = null;

const applyOverrideMock = mock(
  async (input: PayrollOverrideInput, tErrors: ErrorsLabels): Promise<PayrollOverrideResult> => {
    applyOverrideCalls.push({ input, tErrors });
    if (overrideError) {
      throw overrideError;
    }
    return overrideResult;
  }
);

// Load the real services barrel first so every real export stays linkable for
// the builder's import graph (lib, db, and repo modules resolve named exports
// from this barrel), then substitute only the payroll service.
const realServices = await import("@/backend/services");

void mock.module("@/backend/services", () => ({
  ...realServices,
  PayrollCalculationService: { applyOverride: applyOverrideMock },
}));

// The builder eagerly side-imports the full schema tree for its dev-mode HMR
// edge; neutralize it so the schema under test contains only the payroll types.
void mock.module("@/backend/graphql/gqlSchema.definitions", () => ({}));

// Import the real builder (with the scope-auth plugin stack the server uses)
// before replacing the module for the mutation under test, so the payroll
// types register against the real pipeline and the schema executes
// identically. The query module is imported as well so the schema has a
// non-empty Query root next to the Mutation root.
const { gqlSchemaBuilder } = await import("@/backend/graphql/gqlSchemaBuilder");
void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({ gqlSchemaBuilder }));

// Register the scalars the payroll types reference. Guarded by a global flag
// so both payroll test files can share the builder when bun runs them in a
// single process (module caches persist across test files).
const PAYROLL_TEST_SCALARS = Symbol.for("siraj.payrollTest.scalarsRegistered");
const globalForPayrollTest = globalThis as typeof globalThis & {
  [PAYROLL_TEST_SCALARS]?: boolean;
};

if (!globalForPayrollTest[PAYROLL_TEST_SCALARS]) {
  gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
  gqlSchemaBuilder.addScalarType("JSON", JSONScalar);
  globalForPayrollTest[PAYROLL_TEST_SCALARS] = true;
}

await import("@/backend/graphql/mutation/teachers/payroll.mutation");
await import("@/backend/graphql/query/teachers/payroll.query");

gqlSchemaBuilder.queryType({});
gqlSchemaBuilder.mutationType({});
const payrollSchema = gqlSchemaBuilder.toSchema();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<BaseContext> = {}): BaseContext {
  return {
    user: { id: USER_ID, displayCurrency: null },
    safeUser: undefined,
    permissions: [AppPermission.ACCOUNTING_PAYROLL_MANAGE],
    permissionGroups: [],
    isSuperAdmin: false,
    isImpersonating: false,
    isSimulatingGroup: false,
    refreshToken: undefined,
    sessionId: undefined,
    role: UserRole.USER,
    locale: "en",
    t: () => getServerTranslations("en"),
    ...overrides,
  };
}

interface OverrideResultData {
  id: string;
  instanceId: string;
  calculationStatus: CalculationStatus;
  teacherPaidAmount: string | null;
  teacherPaidCurrency: CurrencyCode | null;
  calculatedDuration: number | null;
  isPartialPercentage: number | null;
  payrollNote: string | null;
  auditEventId: string;
}

interface OverrideInputVariables {
  instanceId: string;
  targetStatus: CalculationStatus;
  partialPercentage?: number | null;
  note?: string | null;
  force?: boolean | null;
  clientRequestId?: string | null;
}

function extractOverride(result: ExecutionResult): OverrideResultData | null {
  const data = result.data as { applyPayrollOverride?: OverrideResultData | null } | null | undefined;
  return data?.applyPayrollOverride ?? null;
}

function expectErrorEnvelope(result: ExecutionResult, code: string, message: string): void {
  expect(result.errors).toBeDefined();
  expect(result.errors).toHaveLength(1);
  expect(result.errors?.[0]?.extensions.code).toBe(code);
  expect(result.errors?.[0]?.message).toBe(message);
}

const APPLY_PAYROLL_OVERRIDE_MUTATION = `
  mutation ApplyPayrollOverride($input: PayrollOverrideInput!) {
    applyPayrollOverride(input: $input) {
      id
      instanceId
      calculationStatus
      teacherPaidAmount
      teacherPaidCurrency
      calculatedDuration
      isPartialPercentage
      payrollNote
      auditEventId
    }
  }
`;

async function executeApplyOverride(
  variableValues: Record<string, unknown>,
  ctx: BaseContext
): Promise<ExecutionResult> {
  return graphql({
    schema: payrollSchema,
    source: APPLY_PAYROLL_OVERRIDE_MUTATION,
    variableValues,
    contextValue: ctx,
  });
}

function buildInput(overrides: Record<string, unknown> = {}): OverrideInputVariables {
  return {
    instanceId: INSTANCE_ID,
    targetStatus: CalculationStatus.PARTIALLY,
    partialPercentage: 50,
    note: "operator note",
    force: false,
    clientRequestId: "req-1",
    ...overrides,
  };
}

// Input matrix: every input argument exercised with meaningful values,
// boundaries, and minimal variants (null coverage lives in the dedicated
// null-optional test above).
const overrideInputCases: Array<{ label: string; input: OverrideInputVariables }> = [
  {
    label: "refund with every optional field set",
    input: buildInput({ targetStatus: CalculationStatus.REFUND, note: "refund reason" }),
  },
  {
    label: "partially with zero percentage",
    input: buildInput({ partialPercentage: 0, note: "zero pay" }),
  },
  {
    label: "partially with full percentage",
    input: buildInput({ partialPercentage: 100, note: "full pay" }),
  },
  {
    label: "partially with empty note",
    input: buildInput({ note: "", clientRequestId: null }),
  },
  {
    label: "partially with 2000-char note",
    input: buildInput({ note: "ش".repeat(2000), clientRequestId: null }),
  },
  {
    label: "calculated with force true",
    input: buildInput({
      targetStatus: CalculationStatus.CALCULATED,
      partialPercentage: null,
      note: null,
      force: true,
      clientRequestId: null,
    }),
  },
  {
    label: "not calculated with minimal input",
    input: { instanceId: INSTANCE_ID, targetStatus: CalculationStatus.NOT_CALCULATED },
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("applyPayrollOverride mutation", () => {
  beforeEach(() => {
    applyOverrideCalls.length = 0;
    overrideResult = buildOverrideResult();
    overrideError = null;
  });

  test("returns the override result shape and injects the actor from the context", async () => {
    const input = buildInput();

    const result = await executeApplyOverride({ input }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const override = extractOverride(result);
    expect(override).not.toBeNull();
    expect(override?.id).toBe(INSTANCE_ID);
    expect(override?.instanceId).toBe(INSTANCE_ID);
    expect(override?.calculationStatus).toBe(CalculationStatus.PARTIALLY);
    expect(override?.teacherPaidAmount).toBe("58.00");
    expect(override?.teacherPaidCurrency).toBe(CurrencyCode.SAR);
    expect(override?.calculatedDuration).toBe(58);
    expect(override?.isPartialPercentage).toBe(50);
    expect(override?.payrollNote).toBe("operator note");
    expect(override?.auditEventId).toBe(AUDIT_EVENT_ID);

    expect(applyOverrideCalls).toHaveLength(1);
    expect(applyOverrideCalls[0]?.input).toEqual({ ...input, force: input.force ?? undefined, actorUserId: USER_ID });
    expect(applyOverrideCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("passes null optional arguments through and normalizes a null force to absent", async () => {
    const input: OverrideInputVariables = {
      instanceId: INSTANCE_ID,
      targetStatus: CalculationStatus.CALCULATED,
      partialPercentage: null,
      note: null,
      force: null,
      clientRequestId: null,
    };

    const result = await executeApplyOverride({ input }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    expect(applyOverrideCalls).toHaveLength(1);
    expect(applyOverrideCalls[0]?.input).toEqual({ ...input, force: undefined, actorUserId: USER_ID });
  });

  test("rejects view-only actors with a FORBIDDEN GraphQL error and never invokes the service", async () => {
    const result = await executeApplyOverride(
      { input: buildInput() },
      makeCtx({ permissions: [AppPermission.ACCOUNTING_PAYROLL_VIEW] })
    );

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractOverride(result)).toBeNull();
    expect(applyOverrideCalls).toHaveLength(0);
  });

  test("rejects impersonating actors with a FORBIDDEN GraphQL error and never invokes the service", async () => {
    const result = await executeApplyOverride(
      { input: buildInput() },
      makeCtx({ isImpersonating: true, realUserId: "99999999-9999-9999-9999-999999999999" })
    );

    // Money mutations are blocked while impersonating: the override (and its
    // audit event attribution) must land under the operator's own session.
    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractOverride(result)).toBeNull();
    expect(applyOverrideCalls).toHaveLength(0);
  });

  for (const testCase of overrideInputCases) {
    test(`forwards the input unchanged to the service: ${testCase.label}`, async () => {
      const result = await executeApplyOverride({ input: testCase.input }, makeCtx());
      const expected = { ...testCase.input, force: testCase.input.force ?? undefined, actorUserId: USER_ID };

      expect(result.errors ?? []).toHaveLength(0);
      expect(extractOverride(result)).not.toBeNull();
      expect(applyOverrideCalls).toHaveLength(1);
      expect(applyOverrideCalls[0]?.input).toEqual(expected);
    });
  }

  test("rejects logged-out callers with a FORBIDDEN GraphQL error", async () => {
    const result = await executeApplyOverride(
      { input: buildInput() },
      makeCtx({ user: undefined, permissions: [], role: UserRole.GUEST })
    );

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractOverride(result)).toBeNull();
    expect(applyOverrideCalls).toHaveLength(0);
  });

  test("the resolver itself rejects a permissioned context without a user id", async () => {
    const result = await executeApplyOverride(
      { input: buildInput() },
      makeCtx({ user: undefined, role: UserRole.GUEST })
    );

    expectErrorEnvelope(result, "UNAUTHENTICATED", tErrorsEn.unauthorized);
    expect(extractOverride(result)).toBeNull();
    expect(applyOverrideCalls).toHaveLength(0);
  });

  test("surfaces the service's typed payroll rejection as a GraphQL error code", async () => {
    overrideError = new DomainError("PAYROLL_ALREADY_PAID", tErrorsEn.payroll.alreadyPaid);

    const result = await executeApplyOverride({ input: buildInput() }, makeCtx());

    expect(result.errors ?? []).toHaveLength(1);
    expect(result.errors?.[0]?.extensions.code).toBe("PAYROLL_ALREADY_PAID");
    expect(result.errors?.[0]?.message).toBe(tErrorsEn.payroll.alreadyPaid);
    expect(extractOverride(result)).toBeNull();
    expect(applyOverrideCalls).toHaveLength(1);
  });

  test("never accepts an actor id from the input", async () => {
    const input = buildInput({ actorUserId: "attacker-user-id" });

    const result = await executeApplyOverride({ input }, makeCtx());

    // The input type has no actor field, so the request is rejected at
    // variable-coercion time before the resolver can even run.
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain("actorUserId");
    expect(applyOverrideCalls).toHaveLength(0);
  });
});
