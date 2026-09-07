import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ApolloServer } from "@apollo/server";
import { type ExecutionResult, type GraphQLFormattedError, graphql } from "graphql";
import { createApollo4QueryValidationPlugin } from "graphql-constraint-directive/apollo4";
import { DateTimeResolver } from "graphql-scalars";
import { AppPermission, ExpenseType, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { JSONScalar } from "@/backend/graphql/scalars/jsonScalar";
import { DomainError } from "@/backend/lib/errors";
import type {
  BulkDeleteExpensesInput,
  BulkDeleteExpensesResult,
  CreateExpenseInput,
  ExpensePage,
  ExpenseRow,
  SoftDeleteExpenseInput,
  UpdateExpenseInput,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const EXPENSE_ID = "22222222-2222-4222-8222-222222222222";
const EXPENSE_ID_2 = "33333333-3333-4333-8333-333333333333";
const TEACHER_ID = "44444444-4444-4444-8444-444444444444";
const AUDIT_LOG_ID = "55555555-5555-4555-8555-555555555555";
const OVERSIZED_EXPENSE_IDS = Array.from({ length: 501 }, (_, index) => `expense-${index.toString().padStart(4, "0")}`);

const tErrorsEn = getServerTranslations("en").errorsTranslations;

// GraphQL exposes the TS enum keys (SALARIES, MARKETING, …); resolvers receive
// the enum values ("Salaries", "Marketing", …) after coercion.
type ExpenseTypeName = keyof typeof ExpenseType;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildExpenseRow(overrides: Partial<ExpenseRow> = {}): ExpenseRow {
  return {
    id: EXPENSE_ID,
    teacherId: TEACHER_ID,
    teacherName: "Sarah Ahmed",
    title: "September ad campaign",
    type: ExpenseType.MARKETING,
    expenseValue: "320.00",
    expenseCurrency: CurrencyCode.SAR,
    paymentDate: "2026-08-05",
    expenseDate: "2026-08",
    note: null,
    sourceEntity: null,
    sourceEntityId: null,
    createdByUserId: USER_ID,
    createdByName: "Admin User",
    deletedAt: null,
    deletedByUserId: null,
    deletedReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-05T12:00:00.000Z",
    ...overrides,
  };
}

function buildExpensePage(): ExpensePage {
  return {
    rows: [buildExpenseRow()],
    totalCount: 1,
    aggregates: {
      totalValue: "320.00",
      dominantCurrency: CurrencyCode.SAR,
      rowCountByType: { Salaries: 0, Marketing: 1, Logistics: 0, Technology: 0 },
    },
  };
}

function buildBulkDeleteResult(): BulkDeleteExpensesResult {
  return { deleted: [EXPENSE_ID, EXPENSE_ID_2], auditLogIds: [AUDIT_LOG_ID] };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the mutation module is imported. The mutation
// resolves the mocked `ExpenseService` from the `@/backend/services` barrel,
// while the Pothos builder stays real so the scope-auth plugin runs.
// ---------------------------------------------------------------------------

interface ServiceCall<TInput> {
  input: TInput;
  tErrors: ErrorsLabels;
}

interface CreateServiceCall extends ServiceCall<CreateExpenseInput> {
  actorUserId: string;
}

const createCalls: CreateServiceCall[] = [];
const updateCalls: ServiceCall<UpdateExpenseInput>[] = [];
const softDeleteCalls: ServiceCall<SoftDeleteExpenseInput>[] = [];
const bulkDeleteCalls: ServiceCall<BulkDeleteExpensesInput>[] = [];

let expenseRow: ExpenseRow = buildExpenseRow();
let bulkDeleteResult: BulkDeleteExpensesResult = buildBulkDeleteResult();
let serviceError: Error | null = null;

async function createMock(input: CreateExpenseInput, actorUserId: string, tErrors: ErrorsLabels): Promise<ExpenseRow> {
  createCalls.push({ input, actorUserId, tErrors });
  if (serviceError) throw serviceError;
  if (input.type === ExpenseType.SALARIES) {
    throw new DomainError("EXPENSE_SALARIES_VIA_CARRYOVER_ONLY", tErrors.expenses.salariesViaCarryoverOnly);
  }
  return expenseRow;
}

async function updateMock(input: UpdateExpenseInput, tErrors: ErrorsLabels): Promise<ExpenseRow> {
  updateCalls.push({ input, tErrors });
  if (serviceError) throw serviceError;
  return expenseRow;
}

async function softDeleteMock(input: SoftDeleteExpenseInput, tErrors: ErrorsLabels): Promise<ExpenseRow> {
  softDeleteCalls.push({ input, tErrors });
  if (serviceError) throw serviceError;
  return expenseRow;
}

async function bulkDeleteMock(
  input: BulkDeleteExpensesInput,
  tErrors: ErrorsLabels
): Promise<BulkDeleteExpensesResult> {
  bulkDeleteCalls.push({ input, tErrors });
  if (serviceError) throw serviceError;
  return bulkDeleteResult;
}

// Load the real services barrel first so every real export stays linkable for
// the builder's import graph (lib, db, and repo modules resolve named exports
// from this barrel), then substitute only the expense service. The mock covers
// the query methods too, so this file composes with the sibling query-test
// file when bun runs both in one process.
const realServices = await import("@/backend/services");

void mock.module("@/backend/services", () => ({
  ...realServices,
  ExpenseService: {
    create: createMock,
    createInternal: async (): Promise<ExpenseRow> => expenseRow,
    update: updateMock,
    softDelete: softDeleteMock,
    bulkDelete: bulkDeleteMock,
    getById: async (): Promise<ExpenseRow> => expenseRow,
    getReport: async (): Promise<ExpensePage> => buildExpensePage(),
  },
}));

// The builder eagerly side-imports the full schema tree for its dev-mode HMR
// edge; neutralize it so the schema under test contains only the expense types.
void mock.module("@/backend/graphql/gqlSchema.definitions", () => ({}));

// Import the real builder (with the scope-auth plugin stack the server uses)
// before replacing the module for the mutation under test, so the expense
// types register against the real pipeline and the schema executes identically.
const { gqlSchemaBuilder } = await import("@/backend/graphql/gqlSchemaBuilder");
void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({ gqlSchemaBuilder }));

// Register the scalars the expense types reference. Guarded by the shared
// global flag so every schema-backed test file can reuse the same builder when
// bun runs them in a single process (module caches persist).
const SHARED_TEST_SCALARS = Symbol.for("siraj.payrollTest.scalarsRegistered");
const globalForSharedTest = globalThis as typeof globalThis & {
  [SHARED_TEST_SCALARS]?: boolean;
};

if (!globalForSharedTest[SHARED_TEST_SCALARS]) {
  gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
  gqlSchemaBuilder.addScalarType("JSON", JSONScalar);
  globalForSharedTest[SHARED_TEST_SCALARS] = true;
}

await import("@/backend/graphql/mutation/billing/expense.mutation");
await import("@/backend/graphql/query/billing/expense.query");

gqlSchemaBuilder.queryType({});
gqlSchemaBuilder.mutationType({});
const expenseSchema = gqlSchemaBuilder.toSchema();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<BaseContext> = {}): BaseContext {
  return {
    user: { id: USER_ID, displayCurrency: null },
    safeUser: undefined,
    permissions: [AppPermission.ACCOUNTING_EXPENSES_MANAGE],
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

async function executeExpense(
  source: string,
  variableValues: Record<string, unknown>,
  ctx: BaseContext
): Promise<ExecutionResult> {
  return graphql({ schema: expenseSchema, source, variableValues, contextValue: ctx });
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
    schema: expenseSchema,
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
  expect(createCalls).toHaveLength(0);
  expect(updateCalls).toHaveLength(0);
  expect(softDeleteCalls).toHaveLength(0);
  expect(bulkDeleteCalls).toHaveLength(0);
}

function expectSingleForwardedInput(calls: ReadonlyArray<{ input: unknown }>, input: object): void {
  expect(calls).toHaveLength(1);
  expect(calls[0]?.input).toEqual({ ...input, actorUserId: USER_ID });
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

const EXPENSE_ROW_SELECTION = `
  id
  teacherId
  teacherName
  title
  type
  expenseValue
  expenseCurrency
  paymentDate
  expenseDate
  note
  sourceEntity
  sourceEntityId
  createdByUserId
  createdByName
  deletedAt
  deletedByUserId
  deletedReason
  createdAt
  updatedAt
`;

const CREATE_MUTATION = `
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) { ${EXPENSE_ROW_SELECTION} }
  }
`;

const UPDATE_MUTATION = `
  mutation UpdateExpense($input: UpdateExpenseInput!) {
    updateExpense(input: $input) { ${EXPENSE_ROW_SELECTION} }
  }
`;

const DELETE_MUTATION = `
  mutation DeleteExpense($input: DeleteExpenseInput!) {
    deleteExpense(input: $input) {
      id
      deleted
    }
  }
`;

const BULK_DELETE_MUTATION = `
  mutation BulkDeleteExpenses($input: BulkDeleteExpensesInput!) {
    bulkDeleteExpenses(input: $input) {
      id
      deleted
      auditLogIds
    }
  }
`;

// ---------------------------------------------------------------------------
// Shared input builders
// ---------------------------------------------------------------------------

interface CreateVariables {
  teacherId?: string | null;
  title: string;
  type: ExpenseTypeName;
  expenseValue: string;
  expenseCurrency: CurrencyCode;
  paymentDate: string;
  expenseDate: string;
  note?: string | null;
  clientRequestId?: string | null;
}

interface UpdateVariables {
  id: string;
  title?: string | null;
  type?: ExpenseTypeName | null;
  expenseValue?: string | null;
  expenseCurrency?: CurrencyCode | null;
  paymentDate?: string | null;
  expenseDate?: string | null;
  note?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
}

function buildCreateVariables(overrides: Partial<CreateVariables> = {}): CreateVariables {
  return {
    teacherId: TEACHER_ID,
    title: "September ad campaign",
    type: "MARKETING",
    expenseValue: "320.00",
    expenseCurrency: CurrencyCode.SAR,
    paymentDate: "2026-08-05",
    expenseDate: "2026-08",
    note: "quarterly invoice",
    clientRequestId: "req-create-1",
    ...overrides,
  };
}

function buildUpdateVariables(overrides: Partial<UpdateVariables> = {}): UpdateVariables {
  return {
    id: EXPENSE_ID,
    title: "September ad campaign (revised)",
    type: "LOGISTICS",
    expenseValue: "410.50",
    expenseCurrency: CurrencyCode.USD,
    paymentDate: "2026-08-06",
    expenseDate: "2026-09",
    note: "corrected amount",
    teacherId: TEACHER_ID,
    teacherName: "Sarah Ahmed",
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
  { field: "createExpense", source: CREATE_MUTATION, variables: { input: buildCreateVariables() } },
  { field: "updateExpense", source: UPDATE_MUTATION, variables: { input: buildUpdateVariables() } },
  {
    field: "deleteExpense",
    source: DELETE_MUTATION,
    variables: { input: { id: EXPENSE_ID, reason: "duplicate entry" } },
  },
  {
    field: "bulkDeleteExpenses",
    source: BULK_DELETE_MUTATION,
    variables: { input: { ids: [EXPENSE_ID], reason: "batch cleanup" } },
  },
];

function resetExpenseState(): void {
  createCalls.length = 0;
  updateCalls.length = 0;
  softDeleteCalls.length = 0;
  bulkDeleteCalls.length = 0;
  expenseRow = buildExpenseRow();
  bulkDeleteResult = buildBulkDeleteResult();
  serviceError = null;
}

beforeEach(resetExpenseState);

describe("expense mutations — shared authorization guard", () => {
  for (const mutation of guardedMutations) {
    test(`${mutation.field} rejects a view-only actor with FORBIDDEN and never invokes the service`, async () => {
      const result = await executeExpense(
        mutation.source,
        mutation.variables,
        makeCtx({ permissions: [AppPermission.ACCOUNTING_EXPENSES_VIEW] })
      );

      expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
      expect(result.data?.[mutation.field] ?? null).toBeNull();
      expectNoServiceCalls();
    });

    test(`${mutation.field} rejects a logged-out caller with FORBIDDEN and never invokes the service`, async () => {
      const result = await executeExpense(
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
    const result = await executeExpense(
      CREATE_MUTATION,
      { input: buildCreateVariables() },
      makeCtx({ user: undefined, role: UserRole.GUEST })
    );

    expectErrorEnvelope(result, "UNAUTHENTICATED", tErrorsEn.unauthorized);
    expect(result.data?.createExpense ?? null).toBeNull();
    expect(createCalls).toHaveLength(0);
  });

  test("all four mutations reject actors holding only unrelated (non-accounting) permissions", async () => {
    const ctx = makeCtx({ permissions: [AppPermission.SESSION_RESCHEDULE] });
    const results = await Promise.all(
      guardedMutations.map(mutation => executeExpense(mutation.source, mutation.variables, ctx))
    );
    for (const result of results) {
      expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    }
    expectNoServiceCalls();
  });

  test("super admins run every mutation without holding the explicit expense permission", async () => {
    const ctx = makeCtx({ permissions: [], isSuperAdmin: true, role: UserRole.SUPER_ADMIN });

    const results = await Promise.all(
      guardedMutations.map(mutation => executeExpense(mutation.source, mutation.variables, ctx))
    );
    for (const result of results) {
      expect(result.errors ?? []).toHaveLength(0);
    }

    expect(createCalls).toHaveLength(1);
    expect(updateCalls).toHaveLength(1);
    expect(softDeleteCalls).toHaveLength(1);
    expect(bulkDeleteCalls).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// createExpense / updateExpense — expense row shape
// ---------------------------------------------------------------------------

interface ExpenseRowData {
  id: string;
  teacherId: string | null;
  teacherName: string | null;
  title: string;
  type: ExpenseTypeName;
  expenseValue: string;
  expenseCurrency: CurrencyCode;
  paymentDate: string;
  expenseDate: string;
  note: string | null;
  sourceEntity: string | null;
  sourceEntityId: string | null;
  createdByUserId: string;
  createdByName: string;
  deletedAt: Date | string | null;
  deletedByUserId: string | null;
  deletedReason: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface RowMutationData {
  createExpense?: ExpenseRowData | null;
  updateExpense?: ExpenseRowData | null;
}

type RowMutationField = keyof RowMutationData;

function extractRow(result: ExecutionResult, field: RowMutationField): ExpenseRowData | null {
  const data = result.data as RowMutationData | null | undefined;
  return data?.[field] ?? null;
}

function serviceInputFromVariables<T extends { type?: ExpenseTypeName | null }>(
  input: T
): Omit<T, "type"> & { type?: ExpenseType | null } {
  const { type, ...rest } = input;
  return type === undefined || type === null ? rest : { ...rest, type: ExpenseType[type] };
}

function expectExpenseRowShape(row: ExpenseRowData | null): void {
  expect(row).not.toBeNull();
  expect(row?.id).toBe(EXPENSE_ID);
  expect(row?.teacherId).toBe(TEACHER_ID);
  expect(row?.teacherName).toBe("Sarah Ahmed");
  expect(row?.title).toBe("September ad campaign");
  expect(row?.type).toBe("MARKETING");
  expect(row?.expenseValue).toBe("320.00");
  expect(row?.expenseCurrency).toBe(CurrencyCode.SAR);
  expect(row?.paymentDate).toBe("2026-08-05");
  expect(row?.expenseDate).toBe("2026-08");
  expect(row?.note).toBeNull();
  expect(row?.sourceEntity).toBeNull();
  expect(row?.sourceEntityId).toBeNull();
  expect(row?.createdByUserId).toBe(USER_ID);
  expect(row?.createdByName).toBe("Admin User");
  expect(row?.deletedAt).toBeNull();
  expect(row?.deletedByUserId).toBeNull();
  expect(row?.deletedReason).toBeNull();
  expect(row?.createdAt).toEqual(new Date("2026-08-01T10:00:00.000Z"));
  expect(row?.updatedAt).toEqual(new Date("2026-08-05T12:00:00.000Z"));
}

describe("createExpense mutation", () => {
  test("returns the expense row shape, injects the creator, and forwards every input field", async () => {
    const input = buildCreateVariables();

    const result = await executeExpense(CREATE_MUTATION, { input }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    expectExpenseRowShape(extractRow(result, "createExpense"));
    expect(createCalls).toHaveLength(1);
    expect(createCalls[0]?.input as unknown).toEqual({ ...serviceInputFromVariables(input), createdByUserId: USER_ID });
    expect(createCalls[0]?.actorUserId).toBe(USER_ID);
    expect(createCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("forwards the clientRequestId idempotency key through to the service", async () => {
    await executeExpense(
      CREATE_MUTATION,
      { input: buildCreateVariables({ clientRequestId: "replay-token-42" }) },
      makeCtx()
    );

    expect(createCalls).toHaveLength(1);
    expect(createCalls[0]?.input.clientRequestId).toBe("replay-token-42");
  });

  test("rejects a Salaries-typed expense with EXPENSE_SALARIES_VIA_CARRYOVER_ONLY", async () => {
    const input = buildCreateVariables({ type: "SALARIES" });

    const result = await executeExpense(CREATE_MUTATION, { input }, makeCtx());

    expectErrorEnvelope(result, "EXPENSE_SALARIES_VIA_CARRYOVER_ONLY", tErrorsEn.expenses.salariesViaCarryoverOnly);
    expect(extractRow(result, "createExpense")).toBeNull();
    expect(createCalls).toHaveLength(1);
  });

  test("never accepts an actor id from the input", async () => {
    const input = { ...buildCreateVariables(), actorUserId: "attacker-user-id" };

    const result = await executeExpense(CREATE_MUTATION, { input }, makeCtx());

    // The input type has no actor field, so the request is rejected at
    // variable-coercion time before the resolver can even run.
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain("actorUserId");
    expect(createCalls).toHaveLength(0);
  });
});

describe("updateExpense mutation", () => {
  test("forwards every populated patch field and injects the actor", async () => {
    const input = buildUpdateVariables();

    const result = await executeExpense(UPDATE_MUTATION, { input }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    expectExpenseRowShape(extractRow(result, "updateExpense"));
    expectSingleForwardedInput(updateCalls, serviceInputFromVariables(input));
    expect(updateCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });
});

// ---------------------------------------------------------------------------
// deleteExpense / bulkDeleteExpenses
// ---------------------------------------------------------------------------

function extractDelete(result: ExecutionResult): { id: string; deleted: boolean } | null {
  const data = result.data as { deleteExpense?: { id: string; deleted: boolean } | null } | null | undefined;
  return data?.deleteExpense ?? null;
}

function extractBulkDelete(result: ExecutionResult) {
  const data = result.data as
    | { bulkDeleteExpenses?: { id: string; deleted: string[]; auditLogIds: string[] } | null }
    | null
    | undefined;
  return data?.bulkDeleteExpenses ?? null;
}

describe("deleteExpense mutation", () => {
  test("returns the delete result shape and injects the actor with the reason", async () => {
    const input = { id: EXPENSE_ID, reason: "duplicate entry" };

    const result = await executeExpense(DELETE_MUTATION, { input }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const deleted = extractDelete(result);
    expect(deleted).not.toBeNull();
    expect(deleted?.id).toBe(EXPENSE_ID);
    expect(deleted?.deleted).toBe(true);
    expectSingleForwardedInput(softDeleteCalls, input);
  });

  test("surfaces a paid-carryover guard rejection as a typed GraphQL error", async () => {
    serviceError = new DomainError("EXPENSE_DELETE_VIA_UNPAY", tErrorsEn.expenses.deleteViaUnpay);

    const result = await executeExpense(DELETE_MUTATION, { input: { id: EXPENSE_ID } }, makeCtx());

    expectErrorEnvelope(result, "EXPENSE_DELETE_VIA_UNPAY", tErrorsEn.expenses.deleteViaUnpay);
    expect(extractDelete(result)).toBeNull();
    expect(softDeleteCalls).toHaveLength(1);
  });
});

describe("bulkDeleteExpenses mutation", () => {
  test("returns the batch delete shape and injects the actor with the reason", async () => {
    const input = { ids: [EXPENSE_ID, EXPENSE_ID_2], reason: "quarter-end cleanup" };

    const result = await executeExpense(BULK_DELETE_MUTATION, { input }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const bulkDelete = extractBulkDelete(result);
    expect(bulkDelete).not.toBeNull();
    expect(bulkDelete?.id).toBe("bulk-delete-expenses-result");
    expect(bulkDelete?.deleted).toEqual([EXPENSE_ID, EXPENSE_ID_2]);
    expect(bulkDelete?.auditLogIds).toEqual([AUDIT_LOG_ID]);
    expectSingleForwardedInput(bulkDeleteCalls, input);
  });

  test("rejects an empty ids selection in the resolver before the service runs", async () => {
    const result = await executeExpense(BULK_DELETE_MUTATION, { input: { ids: [] } }, makeCtx());

    expectErrorEnvelope(result, "VALIDATION", tErrorsEn.invalidInput);
    expect(extractBulkDelete(result)).toBeNull();
    expect(bulkDeleteCalls).toHaveLength(0);
  });

  test("rejects an oversized selection (>500 ids) via the @constraint directive", async () => {
    const source = `mutation { bulkDeleteExpenses(input: { ids: ${idListLiteral(OVERSIZED_EXPENSE_IDS)} }) { id } }`;

    const errors = await validateSelectionSize(source);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("no more than 500 in length");
    expect(errors[0]?.extensions?.code).toBe("BAD_USER_INPUT");
    expect(bulkDeleteCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Null optional arguments (shared by all four input-taking mutations)
// ---------------------------------------------------------------------------

interface NullOptionalsCase {
  field: string;
  source: string;
  input: Record<string, unknown>;
  expectedServiceInput: Record<string, unknown>;
  captured: () => { input: unknown } | undefined;
}

const nullOptionalsCases: readonly NullOptionalsCase[] = [
  {
    field: "createExpense",
    source: CREATE_MUTATION,
    input: {
      teacherId: null,
      title: "Office rent",
      type: "LOGISTICS",
      expenseValue: "900.00",
      expenseCurrency: CurrencyCode.USD,
      paymentDate: "2026-08-10",
      expenseDate: "2026-08",
      note: null,
      clientRequestId: null,
    },
    expectedServiceInput: {
      teacherId: null,
      title: "Office rent",
      type: ExpenseType.LOGISTICS,
      expenseValue: "900.00",
      expenseCurrency: CurrencyCode.USD,
      paymentDate: "2026-08-10",
      expenseDate: "2026-08",
      note: null,
      clientRequestId: null,
      createdByUserId: USER_ID,
    },
    captured: () => createCalls[0],
  },
  {
    field: "updateExpense",
    source: UPDATE_MUTATION,
    input: {
      id: EXPENSE_ID,
      title: null,
      type: null,
      expenseValue: null,
      expenseCurrency: null,
      paymentDate: null,
      expenseDate: null,
      note: null,
      teacherId: null,
      teacherName: null,
    },
    expectedServiceInput: {
      id: EXPENSE_ID,
      title: null,
      type: null,
      expenseValue: null,
      expenseCurrency: null,
      paymentDate: null,
      expenseDate: null,
      note: null,
      teacherId: null,
      teacherName: null,
      actorUserId: USER_ID,
    },
    captured: () => updateCalls[0],
  },
  {
    field: "deleteExpense",
    source: DELETE_MUTATION,
    input: { id: EXPENSE_ID, reason: null },
    expectedServiceInput: { id: EXPENSE_ID, reason: null, actorUserId: USER_ID },
    captured: () => softDeleteCalls[0],
  },
  {
    field: "bulkDeleteExpenses",
    source: BULK_DELETE_MUTATION,
    input: { ids: [EXPENSE_ID], reason: null },
    expectedServiceInput: { ids: [EXPENSE_ID], reason: null, actorUserId: USER_ID },
    captured: () => bulkDeleteCalls[0],
  },
];

describe("expense mutations — null optional argument passthrough", () => {
  for (const nullCase of nullOptionalsCases) {
    test(`${nullCase.field} passes null optional arguments through to the service`, async () => {
      const result = await executeExpense(nullCase.source, { input: nullCase.input }, makeCtx());

      expect(result.errors ?? []).toHaveLength(0);
      expect(nullCase.captured()?.input).toEqual(nullCase.expectedServiceInput);
    });
  }
});

// ---------------------------------------------------------------------------
// Schema surface — internal seams stay off the schema, caps are live
// ---------------------------------------------------------------------------

describe("expense schema surface", () => {
  test("exposes exactly the four public mutations and no internal creation field", () => {
    const mutationFields = Object.keys(expenseSchema.getMutationType()?.getFields() ?? {}).toSorted((a, b) =>
      a.localeCompare(b)
    );
    expect(mutationFields).toEqual(["bulkDeleteExpenses", "createExpense", "deleteExpense", "updateExpense"]);
    expect(mutationFields.some(field => field.toLowerCase().includes("internal"))).toBe(false);
  });

  test("exposes exactly the ledger page query and the drill-down query", () => {
    const queryFields = Object.keys(expenseSchema.getQueryType()?.getFields() ?? {}).toSorted((a, b) =>
      a.localeCompare(b)
    );
    expect(queryFields).toEqual(["expense", "expenses"]);
  });

  for (const limit of [0, 201]) {
    test(`rejects an out-of-range page limit (${limit}) via the @constraint directive`, async () => {
      const errors = await validateSelectionSize(`query { expenses(limit: ${limit}) { totalCount } }`);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.extensions?.code).toBe("BAD_USER_INPUT");
    });
  }
});
