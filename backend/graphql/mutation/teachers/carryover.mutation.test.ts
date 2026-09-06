import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ApolloServer } from "@apollo/server";
import { type ExecutionResult, type GraphQLFormattedError, graphql } from "graphql";
import { createApollo4QueryValidationPlugin } from "graphql-constraint-directive/apollo4";
import { DateTimeResolver } from "graphql-scalars";
import { AppPermission, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { JSONScalar } from "@/backend/graphql/scalars/jsonScalar";
import { DomainError, ValidationError } from "@/backend/lib/errors";
import type {
  BulkCreateCarryoverInput,
  BulkCreateCarryoverResult,
  BulkDeleteCarryoverInput,
  BulkDeleteCarryoverResult,
  BulkToExpenseInput,
  BulkToExpenseResult,
  CarryoverPage,
  CarryoverRow,
  CreateCarryoverInput,
  DeleteCarryoverInput,
  DeleteCarryoverResult,
  UnpayCarryoverInput,
  UpdateCarryoverInput,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

const USER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const CARRYOVER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const CARRYOVER_ID_2 = "[CARD_REDACTED]-[CARD_REDACTED]";
const TEACHER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const EXPENSE_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const AUDIT_LOG_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const INSTANCE_ID_A = "[CARD_REDACTED]-[CARD_REDACTED]";
const INSTANCE_ID_B = "[CARD_REDACTED]-[CARD_REDACTED]";
const OVERSIZED_INSTANCE_IDS = Array.from(
  { length: 501 },
  (_, index) => `instance-${index.toString().padStart(4, "0")}`
);
const OVERSIZED_CARRYOVER_IDS = Array.from(
  { length: 501 },
  (_, index) => `carryover-${index.toString().padStart(4, "0")}`
);

const tErrorsEn = getServerTranslations("en").errorsTranslations;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildCarryoverRow(overrides: Partial<CarryoverRow> = {}): CarryoverRow {
  return {
    id: CARRYOVER_ID,
    teacherId: TEACHER_ID,
    teacherName: "Sarah Ahmed",
    teacherAvatarUrl: null,
    studentsCount: 3,
    studentsText: "Omar Khaled, Layla Nasser, Karim Fahad",
    totalDuration: "05:30:00",
    payable: "320.00",
    teacherCurrency: CurrencyCode.SAR,
    paid: "100.00",
    fromDate: "2026-07-01",
    toDate: "2026-07-31",
    paymentDate: "2026-08-05",
    isDisabledTeacher: false,
    isPaid: false,
    expenseId: null,
    note: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    paidAt: "2026-08-05T12:00:00.000Z",
    ...overrides,
  };
}

function buildBulkCreateResult(): BulkCreateCarryoverResult {
  return {
    groups: [
      {
        teacherId: TEACHER_ID,
        carryoverId: CARRYOVER_ID,
        studentsCount: 3,
        totalDuration: "05:30:00",
        payable: "320.00",
        currency: CurrencyCode.SAR,
        instanceIds: [INSTANCE_ID_A, INSTANCE_ID_B],
      },
    ],
    totalInstanceIds: [INSTANCE_ID_A, INSTANCE_ID_B],
    auditLogIds: [AUDIT_LOG_ID],
  };
}

function buildToExpenseResult(): BulkToExpenseResult {
  return {
    items: [
      {
        carryoverId: CARRYOVER_ID,
        expenseId: EXPENSE_ID,
        amount: "320.00",
        currency: CurrencyCode.SAR,
      },
    ],
    auditLogIds: [AUDIT_LOG_ID],
  };
}

function buildDeleteResult(): DeleteCarryoverResult {
  return { id: CARRYOVER_ID, deleted: true };
}

function buildBulkDeleteResult(): BulkDeleteCarryoverResult {
  return { deletedIds: [CARRYOVER_ID, CARRYOVER_ID_2], auditLogIds: [AUDIT_LOG_ID] };
}

function buildCarryoverPage(): CarryoverPage {
  return {
    rows: [buildCarryoverRow()],
    totalCount: 1,
    aggregates: {
      totalPayable: "320.00",
      totalPaid: "100.00",
      dominantCurrency: CurrencyCode.SAR,
      rowCountByPaid: { paid: 0, unpaid: 1 },
    },
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the mutation module is imported. The mutation
// resolves the mocked `CarryoverBalanceService` from the `@/backend/services`
// barrel, while the Pothos builder stays real so the scope-auth plugin runs.
// ---------------------------------------------------------------------------

interface ServiceCall<TInput> {
  input: TInput;
  tErrors: ErrorsLabels;
}

const bulkCreateCalls: ServiceCall<BulkCreateCarryoverInput>[] = [];
const toExpenseCalls: ServiceCall<BulkToExpenseInput>[] = [];
const createCalls: ServiceCall<CreateCarryoverInput>[] = [];
const updateCalls: ServiceCall<UpdateCarryoverInput>[] = [];
const deleteCalls: ServiceCall<DeleteCarryoverInput>[] = [];
const bulkDeleteCalls: ServiceCall<BulkDeleteCarryoverInput>[] = [];
const unpayCalls: ServiceCall<UnpayCarryoverInput>[] = [];

let carryoverRow: CarryoverRow = buildCarryoverRow();
let bulkCreateResult: BulkCreateCarryoverResult = buildBulkCreateResult();
let toExpenseResult: BulkToExpenseResult = buildToExpenseResult();
let deleteResult: DeleteCarryoverResult = buildDeleteResult();
let bulkDeleteResult: BulkDeleteCarryoverResult = buildBulkDeleteResult();
let serviceError: Error | null = null;

async function bulkCreateMock(
  input: BulkCreateCarryoverInput,
  tErrors: ErrorsLabels
): Promise<BulkCreateCarryoverResult> {
  bulkCreateCalls.push({ input, tErrors });
  if (serviceError) throw serviceError;
  if (input.instanceIds.length === 0) throw new ValidationError(tErrors.carryover.noInstances);
  return bulkCreateResult;
}

async function toExpenseMock(input: BulkToExpenseInput, tErrors: ErrorsLabels): Promise<BulkToExpenseResult> {
  toExpenseCalls.push({ input, tErrors });
  if (serviceError) throw serviceError;
  if (input.carryoverIds.length === 0) throw new ValidationError(tErrors.carryover.noCarryovers);
  return toExpenseResult;
}

async function createMock(input: CreateCarryoverInput, tErrors: ErrorsLabels): Promise<CarryoverRow> {
  createCalls.push({ input, tErrors });
  if (serviceError) throw serviceError;
  return carryoverRow;
}

async function updateMock(input: UpdateCarryoverInput, tErrors: ErrorsLabels): Promise<CarryoverRow> {
  updateCalls.push({ input, tErrors });
  if (serviceError) throw serviceError;
  return carryoverRow;
}

async function deleteMock(input: DeleteCarryoverInput, tErrors: ErrorsLabels): Promise<DeleteCarryoverResult> {
  deleteCalls.push({ input, tErrors });
  if (serviceError) throw serviceError;
  return deleteResult;
}

async function bulkDeleteMock(
  input: BulkDeleteCarryoverInput,
  tErrors: ErrorsLabels
): Promise<BulkDeleteCarryoverResult> {
  bulkDeleteCalls.push({ input, tErrors });
  if (serviceError) throw serviceError;
  if (input.ids.length === 0) throw new ValidationError(tErrors.carryover.noCarryovers);
  return bulkDeleteResult;
}

async function unpayMock(input: UnpayCarryoverInput, tErrors: ErrorsLabels): Promise<CarryoverRow> {
  unpayCalls.push({ input, tErrors });
  if (serviceError) throw serviceError;
  return carryoverRow;
}

// Load the real services barrel first so every real export stays linkable for
// the builder's import graph (lib, db, and repo modules resolve named exports
// from this barrel), then substitute only the carryover balance service.
const realServices = await import("@/backend/services");

void mock.module("@/backend/services", () => ({
  ...realServices,
  CarryoverBalanceService: {
    bulkCreateCarryoverBalances: bulkCreateMock,
    bulkCarryoverToExpense: toExpenseMock,
    createCarryoverBalance: createMock,
    updateCarryoverBalance: updateMock,
    deleteCarryoverBalance: deleteMock,
    bulkDeleteCarryoverBalances: bulkDeleteMock,
    unpayCarryoverBalance: unpayMock,
    getReport: async (): Promise<CarryoverPage> => buildCarryoverPage(),
    getById: async (): Promise<CarryoverRow> => carryoverRow,
  },
}));

// The builder eagerly side-imports the full schema tree for its dev-mode HMR
// edge; neutralize it so the schema under test contains only the carryover types.
void mock.module("@/backend/graphql/gqlSchema.definitions", () => ({}));

// Import the real builder (with the scope-auth plugin stack the server uses)
// before replacing the module for the mutation under test, so the carryover
// types register against the real pipeline and the schema executes identically.
const { gqlSchemaBuilder } = await import("@/backend/graphql/gqlSchemaBuilder");
void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({ gqlSchemaBuilder }));

// Register the scalars the carryover types reference. Guarded by the shared
// global flag so every schema-backed report test file can reuse the same
// builder when bun runs them in a single process (module caches persist).
const SHARED_TEST_SCALARS = Symbol.for("siraj.payrollTest.scalarsRegistered");
const globalForSharedTest = globalThis as typeof globalThis & {
  [SHARED_TEST_SCALARS]?: boolean;
};

if (!globalForSharedTest[SHARED_TEST_SCALARS]) {
  gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
  gqlSchemaBuilder.addScalarType("JSON", JSONScalar);
  globalForSharedTest[SHARED_TEST_SCALARS] = true;
}

await import("@/backend/graphql/mutation/teachers/carryover.mutation");
await import("@/backend/graphql/query/teachers/carryover.query");

gqlSchemaBuilder.queryType({});
gqlSchemaBuilder.mutationType({});
const carryoverSchema = gqlSchemaBuilder.toSchema();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<BaseContext> = {}): BaseContext {
  return {
    user: { id: USER_ID, displayCurrency: null },
    safeUser: undefined,
    permissions: [AppPermission.ACCOUNTING_CARRYOVER_MANAGE],
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

async function executeCarryover(
  source: string,
  variableValues: Record<string, unknown>,
  ctx: BaseContext
): Promise<ExecutionResult> {
  return graphql({ schema: carryoverSchema, source, variableValues, contextValue: ctx });
}

// Size caps are enforced by the server's @constraint validation plugin
// (installed on the Apollo route), not by the Pothos schema itself, so the
// assertions exercise the same in-process plugin stack. The document embeds
// the oversized selection as inline literals.
let constraintServer: ApolloServer | null = null;

async function validateSelectionSize(source: string): Promise<readonly GraphQLFormattedError[]> {
  constraintServer ??= await startConstraintServer();
  const response = await constraintServer.executeOperation({ query: source });
  if (response.body.kind !== "single") return [];
  return response.body.singleResult.errors ?? [];
}

async function startConstraintServer(): Promise<ApolloServer> {
  const server = new ApolloServer({
    schema: carryoverSchema,
    plugins: [createApollo4QueryValidationPlugin()],
  });
  await server.start();
  return server;
}

function idListLiteral(ids: readonly string[]): string {
  return `[${ids.map(id => JSON.stringify(id)).join(",")}]`;
}

function expectErrorEnvelope(result: ExecutionResult, code: string, message: string): void {
  expect(result.errors).toBeDefined();
  expect(result.errors).toHaveLength(1);
  expect(result.errors?.[0]?.extensions.code).toBe(code);
  expect(result.errors?.[0]?.message).toBe(message);
}

function expectNoServiceCalls(): void {
  expect(bulkCreateCalls).toHaveLength(0);
  expect(toExpenseCalls).toHaveLength(0);
  expect(createCalls).toHaveLength(0);
  expect(updateCalls).toHaveLength(0);
  expect(deleteCalls).toHaveLength(0);
  expect(bulkDeleteCalls).toHaveLength(0);
  expect(unpayCalls).toHaveLength(0);
}

function expectSingleForwardedInput(calls: ReadonlyArray<{ input: unknown }>, input: object): void {
  expect(calls).toHaveLength(1);
  expect(calls[0]?.input).toEqual({ ...input, actorUserId: USER_ID });
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

const CARRYOVER_ROW_SELECTION = `
  id
  teacherId
  teacherName
  studentsCount
  totalDuration
  payable
  teacherCurrency
  paid
  fromDate
  toDate
  paymentDate
  isDisabledTeacher
  isPaid
  expenseId
  note
`;

const BULK_CREATE_MUTATION = `
  mutation BulkCreateCarryoverBalances($input: BulkCreateCarryoverInput!) {
    bulkCreateCarryoverBalances(input: $input) {
      id
      groups {
        id
        teacherId
        carryoverId
        studentsCount
        totalDuration
        payable
        currency
        instanceIds
      }
      totalInstanceIds
      auditLogIds
    }
  }
`;

const TO_EXPENSE_MUTATION = `
  mutation BulkCarryoverToExpense($input: BulkToExpenseInput!) {
    bulkCarryoverToExpense(input: $input) {
      id
      items {
        id
        carryoverId
        expenseId
        amount
        currency
      }
      auditLogIds
    }
  }
`;

const CREATE_MUTATION = `
  mutation CreateCarryoverBalance($input: CreateCarryoverInput!) {
    createCarryoverBalance(input: $input) { ${CARRYOVER_ROW_SELECTION} }
  }
`;

const UPDATE_MUTATION = `
  mutation UpdateCarryoverBalance($input: UpdateCarryoverInput!) {
    updateCarryoverBalance(input: $input) { ${CARRYOVER_ROW_SELECTION} }
  }
`;

const DELETE_MUTATION = `
  mutation DeleteCarryoverBalance($id: ID!) {
    deleteCarryoverBalance(id: $id) {
      id
      deleted
    }
  }
`;

const BULK_DELETE_MUTATION = `
  mutation BulkDeleteCarryoverBalances($ids: [ID!]!) {
    bulkDeleteCarryoverBalances(ids: $ids) {
      id
      deletedIds
      auditLogIds
    }
  }
`;

const UNPAY_MUTATION = `
  mutation UnpayCarryoverBalance($id: ID!, $note: String) {
    unpayCarryoverBalance(id: $id, note: $note) { ${CARRYOVER_ROW_SELECTION} }
  }
`;

// ---------------------------------------------------------------------------
// Shared input builders
// ---------------------------------------------------------------------------

interface BulkCreateVariables {
  instanceIds: readonly string[];
  clientRequestId?: string | null;
  note?: string | null;
}

interface ToExpenseVariables {
  carryoverIds: readonly string[];
  paymentDate: string;
  expenseDate?: string | null;
  note?: string | null;
  clientRequestId?: string | null;
}

interface CreateVariables {
  teacherId: string;
  fromDate?: string | null;
  toDate?: string | null;
  payable: string;
  teacherCurrency: CurrencyCode;
  studentsCount?: number | null;
  studentsText?: string | null;
  note?: string | null;
  clientRequestId?: string | null;
}

interface UpdateVariables {
  id: string;
  fromDate?: string | null;
  toDate?: string | null;
  payable?: string | null;
  teacherCurrency?: CurrencyCode | null;
  studentsCount?: number | null;
  studentsText?: string | null;
  note?: string | null;
}

function buildBulkCreateVariables(overrides: Partial<BulkCreateVariables> = {}): BulkCreateVariables {
  return {
    instanceIds: [INSTANCE_ID_A, INSTANCE_ID_B],
    clientRequestId: "req-bulk-create-1",
    note: "august carryover batch",
    ...overrides,
  };
}

function buildToExpenseVariables(overrides: Partial<ToExpenseVariables> = {}): ToExpenseVariables {
  return {
    carryoverIds: [CARRYOVER_ID, CARRYOVER_ID_2],
    paymentDate: "2026-08-15",
    expenseDate: "2026-08",
    note: "settlement run",
    clientRequestId: "req-to-expense-1",
    ...overrides,
  };
}

function buildCreateVariables(overrides: Partial<CreateVariables> = {}): CreateVariables {
  return {
    teacherId: TEACHER_ID,
    fromDate: "2026-07-01",
    toDate: "2026-07-31",
    payable: "320.00",
    teacherCurrency: CurrencyCode.SAR,
    studentsCount: 3,
    studentsText: "Omar Khaled, Layla Nasser, Karim Fahad",
    note: "manual correction",
    clientRequestId: "req-create-1",
    ...overrides,
  };
}

function buildUpdateVariables(overrides: Partial<UpdateVariables> = {}): UpdateVariables {
  return {
    id: CARRYOVER_ID,
    fromDate: "2026-07-02",
    toDate: "2026-08-02",
    payable: "410.50",
    teacherCurrency: CurrencyCode.USD,
    studentsCount: 4,
    studentsText: "Omar Khaled, Layla Nasser, Karim Fahad, Huda Ali",
    note: "recounted hours",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Guards shared by every field
// ---------------------------------------------------------------------------

const guardedMutations: ReadonlyArray<{
  field: string;
  source: string;
  variables: Record<string, unknown>;
}> = [
  {
    field: "bulkCreateCarryoverBalances",
    source: BULK_CREATE_MUTATION,
    variables: { input: buildBulkCreateVariables() },
  },
  { field: "bulkCarryoverToExpense", source: TO_EXPENSE_MUTATION, variables: { input: buildToExpenseVariables() } },
  { field: "createCarryoverBalance", source: CREATE_MUTATION, variables: { input: buildCreateVariables() } },
  { field: "updateCarryoverBalance", source: UPDATE_MUTATION, variables: { input: buildUpdateVariables() } },
  { field: "deleteCarryoverBalance", source: DELETE_MUTATION, variables: { id: CARRYOVER_ID } },
  { field: "bulkDeleteCarryoverBalances", source: BULK_DELETE_MUTATION, variables: { ids: [CARRYOVER_ID] } },
  { field: "unpayCarryoverBalance", source: UNPAY_MUTATION, variables: { id: CARRYOVER_ID, note: "reopen" } },
];

function resetCarryoverState(): void {
  bulkCreateCalls.length = 0;
  toExpenseCalls.length = 0;
  createCalls.length = 0;
  updateCalls.length = 0;
  deleteCalls.length = 0;
  bulkDeleteCalls.length = 0;
  unpayCalls.length = 0;
  carryoverRow = buildCarryoverRow();
  bulkCreateResult = buildBulkCreateResult();
  toExpenseResult = buildToExpenseResult();
  deleteResult = buildDeleteResult();
  bulkDeleteResult = buildBulkDeleteResult();
  serviceError = null;
}

beforeEach(resetCarryoverState);

describe("carryover mutations — shared authorization guard", () => {
  for (const mutation of guardedMutations) {
    test(`${mutation.field} rejects a view-only actor with FORBIDDEN and never invokes the service`, async () => {
      const result = await executeCarryover(
        mutation.source,
        mutation.variables,
        makeCtx({ permissions: [AppPermission.ACCOUNTING_CARRYOVER_VIEW] })
      );

      expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
      expect(result.data?.[mutation.field] ?? null).toBeNull();
      expectNoServiceCalls();
    });

    test(`${mutation.field} rejects a logged-out caller with FORBIDDEN and never invokes the service`, async () => {
      const result = await executeCarryover(
        mutation.source,
        mutation.variables,
        makeCtx({ user: undefined, permissions: [], role: UserRole.GUEST })
      );

      expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
      expect(result.data?.[mutation.field] ?? null).toBeNull();
      expectNoServiceCalls();
    });
  }

  test("the resolver rejects a permissioned context without a user id with UNAUTHENTICATED", async () => {
    const result = await executeCarryover(
      UNPAY_MUTATION,
      { id: CARRYOVER_ID, note: null },
      makeCtx({ user: undefined, role: UserRole.GUEST })
    );

    expectErrorEnvelope(result, "UNAUTHENTICATED", tErrorsEn.unauthorized);
    expect(result.data?.unpayCarryoverBalance ?? null).toBeNull();
    expect(unpayCalls).toHaveLength(0);
  });

  test("all seven mutations reject actors holding only unrelated (non-accounting) permissions", async () => {
    const ctx = makeCtx({ permissions: [AppPermission.SESSION_RESCHEDULE] });
    const results = await Promise.all(
      guardedMutations.map(mutation => executeCarryover(mutation.source, mutation.variables, ctx))
    );
    for (const result of results) {
      expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    }
    expectNoServiceCalls();
  });

  test("super admins run every mutation without holding the explicit carryover permission", async () => {
    const ctx = makeCtx({ permissions: [], isSuperAdmin: true, role: UserRole.SUPER_ADMIN });

    const results = await Promise.all(
      guardedMutations.map(mutation => executeCarryover(mutation.source, mutation.variables, ctx))
    );
    for (const result of results) {
      expect(result.errors ?? []).toHaveLength(0);
    }

    expect(bulkCreateCalls).toHaveLength(1);
    expect(toExpenseCalls).toHaveLength(1);
    expect(createCalls).toHaveLength(1);
    expect(updateCalls).toHaveLength(1);
    expect(deleteCalls).toHaveLength(1);
    expect(bulkDeleteCalls).toHaveLength(1);
    expect(unpayCalls).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// bulkCreateCarryoverBalances
// ---------------------------------------------------------------------------

function extractBulkCreate(result: ExecutionResult) {
  const data = result.data as
    | {
        bulkCreateCarryoverBalances?: {
          id: string;
          groups: Array<{
            id: string;
            teacherId: string;
            carryoverId: string;
            studentsCount: number;
            totalDuration: string;
            payable: string;
            currency: CurrencyCode;
            instanceIds: string[];
          }>;
          totalInstanceIds: string[];
          auditLogIds: string[];
        } | null;
      }
    | null
    | undefined;
  return data?.bulkCreateCarryoverBalances ?? null;
}

describe("bulkCreateCarryoverBalances mutation", () => {
  test("returns the grouped result shape and injects the actor from the context", async () => {
    const input = buildBulkCreateVariables();

    const result = await executeCarryover(BULK_CREATE_MUTATION, { input }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const bulkCreate = extractBulkCreate(result);
    expect(bulkCreate).not.toBeNull();
    expect(bulkCreate?.id).toBe("bulk-create-carryover-result");
    expect(bulkCreate?.totalInstanceIds).toEqual([INSTANCE_ID_A, INSTANCE_ID_B]);
    expect(bulkCreate?.auditLogIds).toEqual([AUDIT_LOG_ID]);
    const group = bulkCreate?.groups[0];
    expect(group?.id).toBe(CARRYOVER_ID);
    expect(group?.carryoverId).toBe(CARRYOVER_ID);
    expect(group?.teacherId).toBe(TEACHER_ID);
    expect(group?.studentsCount).toBe(3);
    expect(group?.totalDuration).toBe("05:30:00");
    expect(group?.payable).toBe("320.00");
    expect(group?.currency).toBe(CurrencyCode.SAR);
    expect(group?.instanceIds).toEqual([INSTANCE_ID_A, INSTANCE_ID_B]);

    expectSingleForwardedInput(bulkCreateCalls, input);
    expect(bulkCreateCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("forwards the clientRequestId idempotency key through to the service", async () => {
    await executeCarryover(
      BULK_CREATE_MUTATION,
      { input: buildBulkCreateVariables({ clientRequestId: "replay-token-42" }) },
      makeCtx()
    );

    expect(bulkCreateCalls).toHaveLength(1);
    expect(bulkCreateCalls[0]?.input.clientRequestId).toBe("replay-token-42");
  });
});

// ---------------------------------------------------------------------------
// bulkCarryoverToExpense
// ---------------------------------------------------------------------------

function extractToExpense(result: ExecutionResult) {
  const data = result.data as
    | {
        bulkCarryoverToExpense?: {
          id: string;
          items: Array<{ id: string; carryoverId: string; expenseId: string; amount: string; currency: CurrencyCode }>;
          auditLogIds: string[];
        } | null;
      }
    | null
    | undefined;
  return data?.bulkCarryoverToExpense ?? null;
}

describe("bulkCarryoverToExpense mutation", () => {
  test("returns the conversion result shape and injects the actor from the context", async () => {
    const input = buildToExpenseVariables();

    const result = await executeCarryover(TO_EXPENSE_MUTATION, { input }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const toExpense = extractToExpense(result);
    expect(toExpense).not.toBeNull();
    expect(toExpense?.id).toBe("bulk-to-expense-result");
    expect(toExpense?.auditLogIds).toEqual([AUDIT_LOG_ID]);
    const item = toExpense?.items[0];
    expect(item?.id).toBe(EXPENSE_ID);
    expect(item?.carryoverId).toBe(CARRYOVER_ID);
    expect(item?.expenseId).toBe(EXPENSE_ID);
    expect(item?.amount).toBe("320.00");
    expect(item?.currency).toBe(CurrencyCode.SAR);

    expectSingleForwardedInput(toExpenseCalls, input);
  });

  test("forwards the clientRequestId idempotency key through to the service", async () => {
    await executeCarryover(
      TO_EXPENSE_MUTATION,
      { input: buildToExpenseVariables({ clientRequestId: "replay-token-99" }) },
      makeCtx()
    );

    expect(toExpenseCalls).toHaveLength(1);
    expect(toExpenseCalls[0]?.input.clientRequestId).toBe("replay-token-99");
  });
});

// ---------------------------------------------------------------------------
// createCarryoverBalance / updateCarryoverBalance
// ---------------------------------------------------------------------------

interface CarryoverRowData {
  id: string;
  teacherId: string;
  teacherName: string;
  studentsCount: number | null;
  totalDuration: string | null;
  payable: string;
  teacherCurrency: CurrencyCode;
  paid: string;
  fromDate: string | null;
  toDate: string | null;
  paymentDate: string | null;
  isDisabledTeacher: boolean;
  isPaid: boolean;
  expenseId: string | null;
  note: string | null;
}

interface RowMutationData {
  createCarryoverBalance?: CarryoverRowData | null;
  updateCarryoverBalance?: CarryoverRowData | null;
  unpayCarryoverBalance?: CarryoverRowData | null;
}

type RowMutationField = keyof RowMutationData;

function extractRow(result: ExecutionResult, field: RowMutationField): CarryoverRowData | null {
  const data = result.data as RowMutationData | null | undefined;
  return data?.[field] ?? null;
}

function expectCarryoverRowShape(row: CarryoverRowData | null): void {
  expect(row).not.toBeNull();
  expect(row?.id).toBe(CARRYOVER_ID);
  expect(row?.teacherId).toBe(TEACHER_ID);
  expect(row?.teacherName).toBe("Sarah Ahmed");
  expect(row?.studentsCount).toBe(3);
  expect(row?.totalDuration).toBe("05:30:00");
  expect(row?.payable).toBe("320.00");
  expect(row?.teacherCurrency).toBe(CurrencyCode.SAR);
  expect(row?.paid).toBe("100.00");
  expect(row?.fromDate).toBe("2026-07-01");
  expect(row?.toDate).toBe("2026-07-31");
  expect(row?.paymentDate).toBe("2026-08-05");
  expect(row?.isDisabledTeacher).toBe(false);
  expect(row?.isPaid).toBe(false);
  expect(row?.expenseId).toBeNull();
  expect(row?.note).toBeNull();
}

describe("createCarryoverBalance mutation", () => {
  test("returns the carryover row shape with every input field populated and injects the actor", async () => {
    const input = buildCreateVariables();

    const result = await executeCarryover(CREATE_MUTATION, { input }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    expectCarryoverRowShape(extractRow(result, "createCarryoverBalance"));
    expectSingleForwardedInput(createCalls, input);
    expect(createCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("forwards the clientRequestId idempotency key through to the service", async () => {
    await executeCarryover(
      CREATE_MUTATION,
      { input: buildCreateVariables({ clientRequestId: "replay-token-77" }) },
      makeCtx()
    );

    expect(createCalls).toHaveLength(1);
    expect(createCalls[0]?.input.clientRequestId).toBe("replay-token-77");
  });

  test("never accepts an actor id from the input", async () => {
    const input = { ...buildCreateVariables(), actorUserId: "attacker-user-id" };

    const result = await executeCarryover(CREATE_MUTATION, { input }, makeCtx());

    // The input type has no actor field, so the request is rejected at
    // variable-coercion time before the resolver can even run.
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain("actorUserId");
    expect(createCalls).toHaveLength(0);
  });
});

describe("updateCarryoverBalance mutation", () => {
  test("forwards every populated patch field and injects the actor", async () => {
    const input = buildUpdateVariables();

    const result = await executeCarryover(UPDATE_MUTATION, { input }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    expectCarryoverRowShape(extractRow(result, "updateCarryoverBalance"));
    expectSingleForwardedInput(updateCalls, input);
  });

  test("passes null patch fields through to the service", async () => {
    const input: UpdateVariables = {
      id: CARRYOVER_ID,
      fromDate: null,
      toDate: null,
      payable: null,
      teacherCurrency: null,
      studentsCount: null,
      studentsText: null,
      note: null,
    };

    const result = await executeCarryover(UPDATE_MUTATION, { input }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    expectSingleForwardedInput(updateCalls, input);
  });
});

// ---------------------------------------------------------------------------
// deleteCarryoverBalance / bulkDeleteCarryoverBalances
// ---------------------------------------------------------------------------

function extractDelete(result: ExecutionResult): { id: string; deleted: boolean } | null {
  const data = result.data as { deleteCarryoverBalance?: { id: string; deleted: boolean } | null } | null | undefined;
  return data?.deleteCarryoverBalance ?? null;
}

function extractBulkDelete(result: ExecutionResult) {
  const data = result.data as
    | { bulkDeleteCarryoverBalances?: { id: string; deletedIds: string[]; auditLogIds: string[] } | null }
    | null
    | undefined;
  return data?.bulkDeleteCarryoverBalances ?? null;
}

describe("deleteCarryoverBalance mutation", () => {
  test("returns the delete result shape and injects the actor", async () => {
    const result = await executeCarryover(DELETE_MUTATION, { id: CARRYOVER_ID }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const deleted = extractDelete(result);
    expect(deleted).not.toBeNull();
    expect(deleted?.id).toBe(CARRYOVER_ID);
    expect(deleted?.deleted).toBe(true);
    expectSingleForwardedInput(deleteCalls, { id: CARRYOVER_ID });
  });

  test("surfaces a paid-carryover guard rejection as a typed GraphQL error", async () => {
    serviceError = new DomainError("CARRYOVER_PAID_CANNOT_DELETE", tErrorsEn.carryover.paidCannotDelete);

    const result = await executeCarryover(DELETE_MUTATION, { id: CARRYOVER_ID }, makeCtx());

    expectErrorEnvelope(result, "CARRYOVER_PAID_CANNOT_DELETE", tErrorsEn.carryover.paidCannotDelete);
    expect(extractDelete(result)).toBeNull();
    expect(deleteCalls).toHaveLength(1);
  });
});

describe("bulkDeleteCarryoverBalances mutation", () => {
  test("returns the batch delete shape and injects the actor", async () => {
    const result = await executeCarryover(BULK_DELETE_MUTATION, { ids: [CARRYOVER_ID, CARRYOVER_ID_2] }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const bulkDelete = extractBulkDelete(result);
    expect(bulkDelete).not.toBeNull();
    expect(bulkDelete?.id).toBe("bulk-delete-carryover-result");
    expect(bulkDelete?.deletedIds).toEqual([CARRYOVER_ID, CARRYOVER_ID_2]);
    expect(bulkDelete?.auditLogIds).toEqual([AUDIT_LOG_ID]);
    expectSingleForwardedInput(bulkDeleteCalls, { ids: [CARRYOVER_ID, CARRYOVER_ID_2] });
  });
});

// ---------------------------------------------------------------------------
// unpayCarryoverBalance
// ---------------------------------------------------------------------------

describe("unpayCarryoverBalance mutation", () => {
  test("returns the carryover row shape and forwards the reversal note", async () => {
    const result = await executeCarryover(UNPAY_MUTATION, { id: CARRYOVER_ID, note: "operator reversal" }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    expectCarryoverRowShape(extractRow(result, "unpayCarryoverBalance"));
    expectSingleForwardedInput(unpayCalls, { id: CARRYOVER_ID, note: "operator reversal" });
  });

  test("passes a null note through to the service", async () => {
    const result = await executeCarryover(UNPAY_MUTATION, { id: CARRYOVER_ID, note: null }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    expectSingleForwardedInput(unpayCalls, { id: CARRYOVER_ID, note: null });
  });
});

// ---------------------------------------------------------------------------
// Bulk selection limits (shared by the three bulk mutations)
// ---------------------------------------------------------------------------

interface SelectionGuardCase {
  field: string;
  source: string;
  emptyVariables: () => Record<string, unknown>;
  oversizedLiteralSource: () => string;
  emptyErrorMessage: () => string;
  capturedCount: () => number;
}

const selectionGuardCases: readonly SelectionGuardCase[] = [
  {
    field: "bulkCreateCarryoverBalances",
    source: BULK_CREATE_MUTATION,
    emptyVariables: () => ({ input: buildBulkCreateVariables({ instanceIds: [] }) }),
    oversizedLiteralSource: () =>
      `mutation { bulkCreateCarryoverBalances(input: { instanceIds: ${idListLiteral(OVERSIZED_INSTANCE_IDS)} }) { id } }`,
    emptyErrorMessage: () => tErrorsEn.carryover.noInstances,
    capturedCount: () => bulkCreateCalls.length,
  },
  {
    field: "bulkCarryoverToExpense",
    source: TO_EXPENSE_MUTATION,
    emptyVariables: () => ({ input: buildToExpenseVariables({ carryoverIds: [] }) }),
    oversizedLiteralSource: () =>
      `mutation { bulkCarryoverToExpense(input: { carryoverIds: ${idListLiteral(OVERSIZED_CARRYOVER_IDS)}, paymentDate: "2026-08-15" }) { id } }`,
    emptyErrorMessage: () => tErrorsEn.carryover.noCarryovers,
    capturedCount: () => toExpenseCalls.length,
  },
  {
    field: "bulkDeleteCarryoverBalances",
    source: BULK_DELETE_MUTATION,
    emptyVariables: () => ({ ids: [] }),
    oversizedLiteralSource: () =>
      `mutation { bulkDeleteCarryoverBalances(ids: ${idListLiteral(OVERSIZED_CARRYOVER_IDS)}) { id } }`,
    emptyErrorMessage: () => tErrorsEn.carryover.noCarryovers,
    capturedCount: () => bulkDeleteCalls.length,
  },
];

describe("carryover bulk mutations — selection limits", () => {
  for (const guardCase of selectionGuardCases) {
    test(`${guardCase.field} rejects an empty selection with a VALIDATION GraphQL error`, async () => {
      const result = await executeCarryover(guardCase.source, guardCase.emptyVariables(), makeCtx());

      expectErrorEnvelope(result, "VALIDATION", guardCase.emptyErrorMessage());
      expect(result.data?.[guardCase.field] ?? null).toBeNull();
      expect(guardCase.capturedCount()).toBe(1);
    });

    test(`${guardCase.field} rejects an oversized selection (>500 ids) via the @constraint directive`, async () => {
      const errors = await validateSelectionSize(guardCase.oversizedLiteralSource());

      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toContain("no more than 500 in length");
      expect(errors[0]?.extensions?.code).toBe("BAD_USER_INPUT");
      expect(guardCase.capturedCount()).toBe(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Null optional arguments (shared by the three input-taking mutations)
// ---------------------------------------------------------------------------

interface NullOptionalsCase {
  field: string;
  source: string;
  input: Record<string, unknown>;
  captured: () => { input: unknown } | undefined;
}

const nullOptionalsCases: readonly NullOptionalsCase[] = [
  {
    field: "bulkCreateCarryoverBalances",
    source: BULK_CREATE_MUTATION,
    input: { instanceIds: [INSTANCE_ID_A], clientRequestId: null, note: null },
    captured: () => bulkCreateCalls[0],
  },
  {
    field: "bulkCarryoverToExpense",
    source: TO_EXPENSE_MUTATION,
    input: {
      carryoverIds: [CARRYOVER_ID],
      paymentDate: "2026-08-15",
      expenseDate: null,
      note: null,
      clientRequestId: null,
    },
    captured: () => toExpenseCalls[0],
  },
  {
    field: "createCarryoverBalance",
    source: CREATE_MUTATION,
    input: {
      teacherId: TEACHER_ID,
      fromDate: null,
      toDate: null,
      payable: "90.00",
      teacherCurrency: CurrencyCode.USD,
      studentsCount: null,
      studentsText: null,
      note: null,
      clientRequestId: null,
    },
    captured: () => createCalls[0],
  },
];

describe("carryover mutations — null optional argument passthrough", () => {
  for (const nullCase of nullOptionalsCases) {
    test(`${nullCase.field} passes null optional arguments through to the service`, async () => {
      const result = await executeCarryover(nullCase.source, { input: nullCase.input }, makeCtx());

      expect(result.errors ?? []).toHaveLength(0);
      expect(nullCase.captured()?.input).toEqual({ ...nullCase.input, actorUserId: USER_ID });
    });
  }
});
