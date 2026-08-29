import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import {
  type AccountingPaymentFilterInput,
  type AccountingPaymentInput,
  type AccountingPaymentsQueryVariables,
  CurrencyCode,
  type PaginationArgs as PaginationArgsInput,
  PaymentGateway,
  type RecordAccountingPaymentMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  accountingPaymentQueryDocument,
  accountingPaymentsQueryDocument,
  archivePackagePlanMutationDocument,
  createPackagePlanMutationDocument,
  packagePlansQueryDocument,
  recordAccountingPaymentMutationDocument,
  studentCreditHourBalanceQueryDocument,
  toggleAccountingPaymentPaidStatusMutationDocument,
  updateAccountingPaymentMutationDocument,
  updatePackagePlanMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/accounting/accounting.documents";
import {
  authenticatedRequest,
  cleanupTestEntities,
  clearCookies,
  expectMutationError,
  extractGqlErrorCode,
  loginAndProvision,
  loginDemoUser,
  loginUser,
  setupTestServerLifecycle,
  TEST_USER_PASSWORD,
  testClient,
} from "@/test/helpers";

/**
 * Security regression suite for the Credit-Hours Payments GraphQL surface
 * (queries: accountingPayments/accountingPayment/studentCreditHourBalance;
 * mutations: createPackagePlan/updatePackagePlan/archivePackagePlan/
 * recordAccountingPayment/updateAccountingPayment/toggleAccountingPaymentPaidStatus).
 *
 * Covered attack classes:
 * - BOLA/IDOR: cross-family reads by unrelated students/parents must be denied
 *   (FORBIDDEN); the associated victim student/parent must still pass.
 * - BFLA: the 6 admin mutations must be denied (at the resolver permission gate)
 *   for VIEW-only staff, students, parents, and unauthenticated callers.
 * - Injection/abuse on AccountingPaymentFilterInput: SQL fragments, LIKE
 *   wildcards, malformed ids and dates must be rejected or safely return empty
 *   results — never crash the API nor leak rows.
 * - Pagination abuse: oversized page requests are clamped (MAX_COUNT = 200).
 * - Idempotency replay: an identical recordAccountingPayment replay returns the
 *   existing row and does not double-credit; an altered payload yields a
 *   distinct row (the server-derived key is bound to content).
 *
 * Actors:
 * - victim family: provisioned per suite (student + linked parent).
 * - attackers: shared demo users (student_default / parent_default / staff_default)
 *   which are never associated with the victim family; staff_default holds
 *   ACCOUNTING_PAYMENTS_VIEW but not MANAGE.
 */

const NIL_UUID = "[CARD_REDACTED]-[CARD_REDACTED]";
const PAYMENT_DATE = "2026-01-15T10:00:00.000Z";
const GRANTED_HOURS = 6;

interface SecurityTestState {
  adminToken: string;
  superAdminToken: string;
  staffToken: string;
  strangerStudentToken: string;
  strangerParentToken: string;
  victimStudentToken: string;
  victimParentToken: string;
  studentId: string;
  studentUserId: string;
  parentId: string;
  parentUserId: string;
  teacherId: string;
  teacherUserId: string;
  paymentId: string;
}

function fullFilter(overrides: Partial<AccountingPaymentFilterInput> = {}): AccountingPaymentFilterInput {
  return {
    studentId: null,
    parentId: null,
    fromDate: null,
    toDate: null,
    unpaidOnly: null,
    ...overrides,
  };
}

function paymentsVars(
  filter: AccountingPaymentFilterInput | null,
  paginationArgs: PaginationArgsInput | null = null
): AccountingPaymentsQueryVariables {
  return { filter, paginationArgs };
}

function fullPagination(overrides: Partial<PaginationArgsInput> = {}): PaginationArgsInput {
  return {
    first: null,
    skip: null,
    after: null,
    before: null,
    last: null,
    page: null,
    maxCount: null,
    ...overrides,
  };
}

function recordVars(
  studentId: string,
  overrides: Partial<AccountingPaymentInput> = {}
): RecordAccountingPaymentMutationVariables {
  return {
    input: {
      studentId,
      packagePlanId: null,
      creditHours: GRANTED_HOURS,
      amount: 300,
      currency: CurrencyCode.Usd,
      paymentGateway: PaymentGateway.Bank,
      paymentDate: PAYMENT_DATE,
      isPaidStatusOn: true,
      paymentNote: "security-suite-record",
      ...overrides,
    },
  };
}

/** A mutator probe: executes one admin mutation as a caller and asserts denial. */
type MutationDenialProbe = (token: string, expectedCode: string) => Promise<unknown>;

/** All 6 admin mutations with fully-populated variables, as per-probe closures. */
function adminMutationProbes(state: SecurityTestState): MutationDenialProbe[] {
  return [
    (token, expectedCode) =>
      expectMutationError(
        token,
        createPackagePlanMutationDocument,
        {
          input: {
            codename: "sec-abuse",
            displayName: "Security Abuse Probe",
            description: null,
            creditHours: 10,
            priceAmount: 100,
            currency: CurrencyCode.Usd,
            validityMonths: null,
            active: null,
            sortOrder: null,
          },
        },
        expectedCode
      ),
    (token, expectedCode) =>
      expectMutationError(
        token,
        updatePackagePlanMutationDocument,
        {
          input: {
            id: NIL_UUID,
            displayName: null,
            description: null,
            creditHours: null,
            priceAmount: null,
            currency: null,
            validityMonths: null,
            active: null,
            sortOrder: null,
            version: null,
          },
        },
        expectedCode
      ),
    (token, expectedCode) =>
      expectMutationError(token, archivePackagePlanMutationDocument, { id: NIL_UUID }, expectedCode),
    (token, expectedCode) =>
      expectMutationError(
        token,
        recordAccountingPaymentMutationDocument,
        recordVars(state.studentId, { paymentNote: "denial-probe" }),
        expectedCode
      ),
    (token, expectedCode) =>
      expectMutationError(
        token,
        updateAccountingPaymentMutationDocument,
        {
          input: {
            id: state.paymentId,
            paymentGateway: null,
            paymentNote: null,
            creditHours: null,
            expectedInvoiceVersion: null,
          },
        },
        expectedCode
      ),
    (token, expectedCode) =>
      expectMutationError(
        token,
        toggleAccountingPaymentPaidStatusMutationDocument,
        { input: { id: state.paymentId, isPaidStatusOn: false, expectedInvoiceVersion: null } },
        expectedCode
      ),
  ];
}

type DenialPrincipal = { name: string; token: (s: SecurityTestState) => string };

/**
 * Privilege-escalation principals: staff with ACCOUNTING_PAYMENTS_VIEW but not
 * MANAGE, baseline students, baseline parents, and the victim's linked parent
 * (family association must never imply manage rights).
 */
const ADMIN_MUTATION_PRINCIPALS: DenialPrincipal[] = [
  { name: "staff_default (VIEW-only, no MANAGE)", token: s => s.staffToken },
  { name: "student_default", token: s => s.strangerStudentToken },
  { name: "parent_default", token: s => s.strangerParentToken },
  { name: "victim's own parent", token: s => s.victimParentToken },
];

/** Query variant of the shared denial helper: asserts a FORBIDDEN/UNAUTHENTICATED error for `token`. */
async function expectQueryDenied<TData, TVars extends OperationVariables>(
  token: string,
  document: TypedDocumentNode<TData, TVars>,
  variables: TVars,
  expectedCode: string
): Promise<void> {
  const result = await testClient.query({
    query: document,
    variables,
    errorPolicy: "all",
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  if (!result.error) throw new Error("expected a GraphQL error for the denied query");
  const code = extractGqlErrorCode(result.error);
  if (code !== expectedCode) {
    throw new Error(`expected code ${expectedCode}, got ${String(code)} (${result.error.message})`);
  }
  expect(code).toBe(expectedCode);
}

/** GraphQL request without an Authorization header must be denied as UNAUTHENTICATED. */
async function expectUnauthenticatedDenied<TData, TVars extends OperationVariables>(
  type: "query" | "mutate",
  document: TypedDocumentNode<TData, TVars>,
  variables: TVars,
  label = "anonymous-request"
): Promise<void> {
  let thrownError: unknown;
  let result: { error?: { message?: string } } | undefined;
  try {
    result =
      type === "query"
        ? await testClient.query({ query: document, variables, errorPolicy: "all" } as Parameters<
            typeof testClient.query
          >[0])
        : await testClient.mutate({ mutation: document, variables, errorPolicy: "all" } as Parameters<
            typeof testClient.mutate
          >[0]);
  } catch (thrown) {
    thrownError = thrown;
  }
  if (!thrownError && !result?.error) {
    throw new Error(`${label}: expected anonymous request to be denied, but it succeeded`);
  }
  if (!thrownError && result?.error) {
    const code = extractGqlErrorCode(result.error);
    if (code !== "UNAUTHENTICATED") {
      throw new Error(`${label}: expected UNAUTHENTICATED, got ${String(code)} (${String(result.error.message)})`);
    }
  }
}

/**
 * Clears the dev-server auth rate-limit counter (shared Redis key) before the
 * suite's demo logins — repeated suite runs would otherwise trip the 10/15-min
 * login window. Mirrors the convention from rate-limit.test.ts.
 */
async function clearAuthRateLimitCounter(): Promise<void> {
  try {
    await Bun.spawn(["redis-cli", "-u", "redis://localhost:6379", "DEL", "ratelimit:auth:[IP_REDACTED]"], {
      stdout: "pipe",
      stderr: "pipe",
    }).exited;
  } catch {
    // Best-effort: Redis may be unavailable; the suite still runs when un-flagged.
  }
}

describe("GraphQL Security: accounting payments surface", () => {
  setupTestServerLifecycle();

  const state: SecurityTestState = {
    adminToken: "",
    superAdminToken: "",
    staffToken: "",
    strangerStudentToken: "",
    strangerParentToken: "",
    victimStudentToken: "",
    victimParentToken: "",
    studentId: "",
    studentUserId: "",
    parentId: "",
    parentUserId: "",
    teacherId: "",
    teacherUserId: "",
    paymentId: "",
  };

  beforeAll(async () => {
    await clearAuthRateLimitCounter();
    const cast = await loginAndProvision("AcctSec");
    state.adminToken = cast.adminToken;
    state.superAdminToken = cast.superAdminToken;
    state.studentId = cast.studentId;
    state.studentUserId = cast.studentUserId;
    state.parentId = cast.parentId;
    state.parentUserId = cast.parentUserId;
    state.teacherId = cast.teacherId;
    state.teacherUserId = cast.teacherUserId;

    state.victimStudentToken = await loginUser(cast.studentUserEmail, TEST_USER_PASSWORD);
    state.victimParentToken = await loginUser(cast.parentUserEmail, TEST_USER_PASSWORD);
    state.staffToken = await loginDemoUser("staff_default");
    state.strangerStudentToken = await loginDemoUser("student_default");
    state.strangerParentToken = await loginDemoUser("parent_default");

    const recorded = await authenticatedRequest(
      state.adminToken,
      "mutate",
      recordAccountingPaymentMutationDocument,
      recordVars(state.studentId)
    );
    const paymentId = recorded.recordAccountingPayment?.id;
    if (!paymentId) throw new Error("baseline accounting payment was not recorded");
    state.paymentId = paymentId;
  });

  afterAll(async () => {
    await cleanupTestEntities(state.superAdminToken, {
      studentUserId: state.studentUserId,
      teacherUserId: state.teacherUserId,
      parentUserId: state.parentUserId,
      studentId: state.studentId,
      teacherId: state.teacherId,
      parentId: state.parentId,
    });
  });

  // ─── Positive controls (associated-passes paths) ────────────────────────────

  test("victim student can read own balance, own payment, and own filtered list", async () => {
    const balance = await authenticatedRequest(
      state.victimStudentToken,
      "query",
      studentCreditHourBalanceQueryDocument,
      { studentId: state.studentId }
    );
    expect(balance.studentCreditHourBalance?.studentId).toBe(state.studentId);
    expect(Number(balance.studentCreditHourBalance?.creditHoursTotal)).toBe(GRANTED_HOURS);

    const detail = await authenticatedRequest(state.victimStudentToken, "query", accountingPaymentQueryDocument, {
      id: state.paymentId,
    });
    expect(detail.accountingPayment?.id).toBe(state.paymentId);

    const list = await authenticatedRequest(
      state.victimStudentToken,
      "query",
      accountingPaymentsQueryDocument,
      paymentsVars(fullFilter({ studentId: state.studentId }))
    );
    const rows = list.accountingPayments ?? [];
    expect(rows.some(row => row?.id === state.paymentId)).toBe(true);
    for (const row of rows) {
      expect(row?.studentId).toBe(state.studentId);
    }
  });

  test("linked parent can read the child's balance, payment, and filtered list", async () => {
    const balance = await authenticatedRequest(
      state.victimParentToken,
      "query",
      studentCreditHourBalanceQueryDocument,
      { studentId: state.studentId }
    );
    expect(balance.studentCreditHourBalance?.studentId).toBe(state.studentId);

    const detail = await authenticatedRequest(state.victimParentToken, "query", accountingPaymentQueryDocument, {
      id: state.paymentId,
    });
    expect(detail.accountingPayment?.id).toBe(state.paymentId);

    const list = await authenticatedRequest(
      state.victimParentToken,
      "query",
      accountingPaymentsQueryDocument,
      paymentsVars(fullFilter({ studentId: state.studentId }))
    );
    expect(list.accountingPayments?.some(row => row?.id === state.paymentId)).toBe(true);
  });

  test("VIEW-only staff can read payments/balance (documented as allowed) but only that", async () => {
    const balance = await authenticatedRequest(state.staffToken, "query", studentCreditHourBalanceQueryDocument, {
      studentId: state.studentId,
    });
    expect(balance.studentCreditHourBalance?.studentId).toBe(state.studentId);

    const detail = await authenticatedRequest(state.staffToken, "query", accountingPaymentQueryDocument, {
      id: state.paymentId,
    });
    expect(detail.accountingPayment?.id).toBe(state.paymentId);
  });

  // ─── BOLA / IDOR (cross-family denial) ──────────────────────────────────────

  test("unrelated student is FORBIDDEN on balance, payment detail, and filtered list", async () => {
    const results = await Promise.all([
      expectQueryDenied(
        state.strangerStudentToken,
        studentCreditHourBalanceQueryDocument,
        { studentId: state.studentId },
        "FORBIDDEN"
      ),
      expectQueryDenied(
        state.strangerStudentToken,
        accountingPaymentQueryDocument,
        { id: state.paymentId },
        "FORBIDDEN"
      ),
      expectQueryDenied(
        state.strangerStudentToken,
        accountingPaymentsQueryDocument,
        paymentsVars(fullFilter({ studentId: state.studentId })),
        "FORBIDDEN"
      ),
    ]);
    expect(results).toHaveLength(3);
  });

  test("unrelated parent is FORBIDDEN on balance, payment detail, and filtered lists", async () => {
    const results = await Promise.all([
      expectQueryDenied(
        state.strangerParentToken,
        studentCreditHourBalanceQueryDocument,
        { studentId: state.studentId },
        "FORBIDDEN"
      ),
      expectQueryDenied(
        state.strangerParentToken,
        accountingPaymentQueryDocument,
        { id: state.paymentId },
        "FORBIDDEN"
      ),
      expectQueryDenied(
        state.strangerParentToken,
        accountingPaymentsQueryDocument,
        paymentsVars(fullFilter({ studentId: state.studentId })),
        "FORBIDDEN"
      ),
      // Injected parentId lookup (no studentId) must also be denied.
      expectQueryDenied(
        state.strangerParentToken,
        accountingPaymentsQueryDocument,
        paymentsVars(fullFilter({ parentId: state.parentId })),
        "FORBIDDEN"
      ),
      // Unfiltered global listing is equally forbidden for non-VIEW callers.
      expectQueryDenied(state.strangerParentToken, accountingPaymentsQueryDocument, paymentsVars(null), "FORBIDDEN"),
    ]);
    expect(results).toHaveLength(5);
  });

  for (const principal of ADMIN_MUTATION_PRINCIPALS) {
    test(`${principal.name} is FORBIDDEN on every admin mutation`, async () => {
      const probes = adminMutationProbes(state);
      const results = await Promise.all(probes.map(runProbe => runProbe(principal.token(state), "FORBIDDEN")));
      // sonarjs/assertions-in-tests: the meaningful assertions live inside each probe.
      expect(results).toHaveLength(6);
    });
  }

  test("denied mutation probes leave the victim payment untouched", async () => {
    const detail = await authenticatedRequest(state.adminToken, "query", accountingPaymentQueryDocument, {
      id: state.paymentId,
    });
    expect(detail.accountingPayment?.isPaidStatusOn).toBe(true);
    expect(Number(detail.accountingPayment?.creditHours)).toBe(GRANTED_HOURS);
    expect(detail.accountingPayment?.paymentNote).toBe("security-suite-record");
  });

  test("unauthenticated callers are UNAUTHENTICATED on all accounting queries and mutations", async () => {
    // The shared test client keeps a global cookie jar populated by earlier
    // logins; without clearing it, "anonymous" requests inherit the last demo
    // login's session cookie and thus report FORBIDDEN (or succeed on
    // loggedIn-only fields) instead of UNAUTHENTICATED.
    clearCookies();
    const results = await Promise.all([
      expectUnauthenticatedDenied(
        "query",
        studentCreditHourBalanceQueryDocument,
        { studentId: state.studentId },
        "studentCreditHourBalance query"
      ),
      expectUnauthenticatedDenied(
        "query",
        accountingPaymentQueryDocument,
        { id: state.paymentId },
        "accountingPayment query"
      ),
      expectUnauthenticatedDenied(
        "query",
        accountingPaymentsQueryDocument,
        paymentsVars(fullFilter({ studentId: state.studentId })),
        "accountingPayments query"
      ),
      expectUnauthenticatedDenied(
        "query",
        packagePlansQueryDocument,
        { activeOnly: true, paginationArgs: null },
        "packagePlans query"
      ),
      expectUnauthenticatedDenied(
        "mutate",
        recordAccountingPaymentMutationDocument,
        recordVars(state.studentId, { paymentNote: "unauthenticated-probe" }),
        "recordAccountingPayment mutation"
      ),
      expectUnauthenticatedDenied(
        "mutate",
        toggleAccountingPaymentPaidStatusMutationDocument,
        { input: { id: state.paymentId, isPaidStatusOn: false, expectedInvoiceVersion: null } },
        "toggleAccountingPaymentPaidStatus mutation"
      ),
    ]);
    expect(results).toHaveLength(6);
  });

  test("malformed bearer token is UNAUTHENTICATED", async () => {
    const result = await testClient.query({
      query: studentCreditHourBalanceQueryDocument,
      variables: { studentId: state.studentId },
      errorPolicy: "all",
      context: { headers: { Authorization: "Bearer not-a-real-token" } },
    });
    expect(result.error).toBeDefined();
    expect(extractGqlErrorCode(result.error)).toBe("UNAUTHENTICATED");
  });

  // ─── Injection / wildcard / malformed input abuse ───────────────────────────

  test("SQL-injection and wildcard studentId filters are rejected without leaking rows", async () => {
    const maliciousIds = ["' OR '1'='1' --", "%", "%%", "_", "../../../../etc/passwd"];
    await Promise.all(
      maliciousIds.map(async maliciousId => {
        const result = await testClient.query({
          query: accountingPaymentsQueryDocument,
          variables: paymentsVars(fullFilter({ studentId: maliciousId })),
          errorPolicy: "all",
          context: { headers: { Authorization: `Bearer ${state.adminToken}` } },
        });
        expect(result.error).toBeDefined();
        expect(result.data?.accountingPayments ?? null).toBeNull();
      })
    );
  });

  test("injected parentId filter is rejected without leaking rows", async () => {
    const result = await testClient.query({
      query: accountingPaymentsQueryDocument,
      variables: paymentsVars(fullFilter({ parentId: "' UNION SELECT id FROM users --" })),
      errorPolicy: "all",
      context: { headers: { Authorization: `Bearer ${state.adminToken}` } },
    });
    expect(result.error).toBeDefined();
    expect(result.data?.accountingPayments ?? null).toBeNull();
  });

  test("malformed date bounds are rejected without crashing the API", async () => {
    const malformedDates = ["not-a-date", "999-99-99", "'); DROP TABLE payments; --"];
    await Promise.all(
      malformedDates.map(async fromDate => {
        const result = await testClient.query({
          query: accountingPaymentsQueryDocument,
          variables: paymentsVars(fullFilter({ studentId: state.studentId, fromDate })),
          errorPolicy: "all",
          context: { headers: { Authorization: `Bearer ${state.adminToken}` } },
        });
        expect(result.error).toBeDefined();
        expect(result.data?.accountingPayments ?? null).toBeNull();
      })
    );
  });

  test("extreme and reversed date ranges are handled safely as empty results", async () => {
    const headers = { headers: { Authorization: `Bearer ${state.adminToken}` } };
    const farFuture = await testClient.query({
      query: accountingPaymentsQueryDocument,
      variables: paymentsVars(fullFilter({ studentId: state.studentId, fromDate: "2999-01-01", toDate: "2999-01-31" })),
      errorPolicy: "all",
      context: headers,
    });
    expect(farFuture.error).toBeUndefined();
    expect(farFuture.data?.accountingPayments?.length ?? 0).toBe(0);

    const reversed = await testClient.query({
      query: accountingPaymentsQueryDocument,
      variables: paymentsVars(fullFilter({ studentId: state.studentId, fromDate: "2030-01-01", toDate: "2020-01-01" })),
      errorPolicy: "all",
      context: headers,
    });
    expect(reversed.error).toBeUndefined();
    expect(reversed.data?.accountingPayments?.length ?? 0).toBe(0);
  });

  test("oversized pagination is clamped to the 200-row ceiling", async () => {
    const result = await testClient.query({
      query: accountingPaymentsQueryDocument,
      variables: paymentsVars(null, fullPagination({ first: 100_000, maxCount: 100_000 })),
      errorPolicy: "all",
      context: { headers: { Authorization: `Bearer ${state.adminToken}` } },
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.accountingPayments?.length ?? 0).toBeLessThanOrEqual(200);
  });

  test("extreme numeric payment amounts are rejected without creating a row", async () => {
    const result = await testClient.mutate({
      mutation: recordAccountingPaymentMutationDocument,
      variables: recordVars(state.studentId, { amount: 1e15, paymentNote: "overflow-probe" }),
      errorPolicy: "all",
      context: { headers: { Authorization: `Bearer ${state.adminToken}` } },
    });
    expect(result.error).toBeDefined();

    const listAfter = await authenticatedRequest(
      state.adminToken,
      "query",
      accountingPaymentsQueryDocument,
      paymentsVars(fullFilter({ studentId: state.studentId }))
    );
    // The overflow probe must not have persisted; only the baseline row exists.
    expect(listAfter.accountingPayments?.filter(row => row?.paymentNote === "overflow-probe").length ?? 0).toBe(0);
  });

  // ─── Idempotency replay abuse ───────────────────────────────────────────────

  test("identical replay returns the same payment and does not double-credit hours", async () => {
    const replay = await authenticatedRequest(
      state.adminToken,
      "mutate",
      recordAccountingPaymentMutationDocument,
      recordVars(state.studentId)
    );
    expect(replay.recordAccountingPayment?.id).toBe(state.paymentId);
    expect(replay.recordAccountingPayment?.invoiceId).not.toBeNull();

    const balance = await authenticatedRequest(state.adminToken, "query", studentCreditHourBalanceQueryDocument, {
      studentId: state.studentId,
    });
    expect(Number(balance.studentCreditHourBalance?.creditHoursTotal)).toBe(GRANTED_HOURS);
  });

  test("altered payload derives a distinct key and records a separate payment", async () => {
    const altered = await authenticatedRequest(
      state.adminToken,
      "mutate",
      recordAccountingPaymentMutationDocument,
      recordVars(state.studentId, { amount: 301, paymentNote: "altered-payload" })
    );
    expect(altered.recordAccountingPayment?.id).not.toBe(state.paymentId);
    expect(altered.recordAccountingPayment?.id).not.toBeNull();

    const balance = await authenticatedRequest(state.adminToken, "query", studentCreditHourBalanceQueryDocument, {
      studentId: state.studentId,
    });
    expect(Number(balance.studentCreditHourBalance?.creditHoursTotal)).toBe(GRANTED_HOURS * 2);
  });
});
