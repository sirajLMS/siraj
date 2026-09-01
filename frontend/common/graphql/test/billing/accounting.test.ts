import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import { CurrencyCode, PaymentGateway } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  accountingPaymentQueryDocument,
  accountingPaymentsQueryDocument,
  archivePackagePlanMutationDocument,
  createPackagePlanMutationDocument,
  packagePlanQueryDocument,
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
  expectMutationError,
  loginAndProvision,
  loginUser,
  provisionTestEntities,
  setupTestServerLifecycle,
  TEST_USER_PASSWORD,
  testClient,
} from "@/test/helpers";

const PREFIX = `acct-gql-${randomUUID().slice(0, 8)}`;

/** Mutable per-suite state populated in beforeAll and consumed by tests. */
const state = {
  adminToken: "",
  superAdminToken: "",
  teacherToken: "",
  studentId: "",
  teacherId: "",
  parentId: "",
  studentUserId: "",
  teacherUserId: "",
  parentUserId: "",
  parentUserEmail: "",
  studentUserEmail: "",
  parentTokenB: "",
  studentBId: "",
  teacherBId: "",
  parentBId: "",
  studentBUserId: "",
  teacherBUserId: "",
  parentBUserId: "",
  planId: "",
  planVersion: 0,
  paymentId: "",
};

async function expectQueryError<TData, TVars extends OperationVariables>(
  token: string,
  document: TypedDocumentNode<TData, TVars>,
  variables: TVars
): Promise<void> {
  const result = await testClient.query({
    query: document,
    variables,
    errorPolicy: "all",
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  expect(result.error).toBeDefined();
}

describe("GraphQL accounting credit-hours surface", () => {
  setupTestServerLifecycle();

  beforeAll(async () => {
    const provisioned = await loginAndProvision(PREFIX);
    state.adminToken = provisioned.adminToken;
    state.superAdminToken = provisioned.superAdminToken;
    state.teacherToken = provisioned.teacherToken;
    state.studentId = provisioned.studentId;
    state.teacherId = provisioned.teacherId;
    state.parentId = provisioned.parentId;
    state.studentUserId = provisioned.studentUserId;
    state.teacherUserId = provisioned.teacherUserId;
    state.parentUserId = provisioned.parentUserId;
    state.parentUserEmail = provisioned.parentUserEmail;
    state.studentUserEmail = provisioned.studentUserEmail;

    // Second family — honest cross-family IDOR actor (associated to B only).
    const familyB = await provisionTestEntities(state.superAdminToken, `${PREFIX}B`);
    state.studentBId = familyB.studentId;
    state.teacherBId = familyB.teacherId;
    state.parentBId = familyB.parentId;
    state.studentBUserId = familyB.studentUserId;
    state.teacherBUserId = familyB.teacherUserId;
    state.parentBUserId = familyB.parentUserId;

    const parentTokenB = await loginUser(familyB.parentUserEmail, TEST_USER_PASSWORD);
    expect(parentTokenB).not.toBe("");
    state.parentTokenB = parentTokenB;
  });

  afterAll(async () => {
    await cleanupTestEntities(state.superAdminToken, {
      studentUserId: state.studentBUserId,
      teacherUserId: state.teacherBUserId,
      parentUserId: state.parentBUserId,
      studentId: state.studentBId,
      teacherId: state.teacherBId,
      parentId: state.parentBId,
    });
    await cleanupTestEntities(state.superAdminToken, {
      studentUserId: state.studentUserId,
      teacherUserId: state.teacherUserId,
      parentUserId: state.parentUserId,
      studentId: state.studentId,
      teacherId: state.teacherId,
      parentId: state.parentId,
    });
  });

  test("createPackagePlan persists a full-argument plan; queries resolve it", async () => {
    const created = await authenticatedRequest(state.adminToken, "mutate", createPackagePlanMutationDocument, {
      input: {
        codename: `${PREFIX}_gold`,
        displayName: `${PREFIX} Gold Plan`,
        description: "GraphQL coverage plan",
        creditHours: 10,
        priceAmount: 300,
        currency: CurrencyCode.Usd,
        active: true,
        sortOrder: 7,
        validityMonths: 12,
      },
    });
    const plan = created.createPackagePlan;
    if (!plan?.id) throw new Error("createPackagePlan returned no plan");
    state.planId = plan.id;
    state.planVersion = plan.version ?? 0;
    expect(plan.codename).toBe(`${PREFIX}_gold`.toUpperCase());
    expect(Number(plan.creditHours)).toBe(10);
    expect(plan.currency).toBe(CurrencyCode.Usd);

    // packagePlans (activeOnly: true) reaches listActive.
    const activeList = await authenticatedRequest(state.adminToken, "query", packagePlansQueryDocument, {
      activeOnly: true,
      paginationArgs: null,
    });
    expect(activeList.packagePlans?.some(row => row?.id === state.planId)).toBe(true);

    // packagePlan by id resolves the stored row.
    const byId = await authenticatedRequest(state.adminToken, "query", packagePlanQueryDocument, {
      id: state.planId,
    });
    expect(byId.packagePlan?.displayName).toBe(`${PREFIX} Gold Plan`);
  });

  test("updatePackagePlan applies a full-argument patch and enforces the optimistic lock", async () => {
    const updated = await authenticatedRequest(state.adminToken, "mutate", updatePackagePlanMutationDocument, {
      input: {
        id: state.planId,
        displayName: `${PREFIX} Gold Plan v2`,
        description: "updated description",
        creditHours: 15,
        priceAmount: 450,
        currency: CurrencyCode.Eur,
        active: true,
        sortOrder: 9,
        validityMonths: 24,
        version: state.planVersion,
      },
    });
    const plan = updated.updatePackagePlan;
    if (!plan) throw new Error("updatePackagePlan returned no plan");
    expect(plan.displayName).toBe(`${PREFIX} Gold Plan v2`);
    expect(Number(plan.creditHours)).toBe(15);
    expect(plan.currency).toBe(CurrencyCode.Eur);
    expect(plan.version).toBe(state.planVersion + 1);
    state.planVersion = plan.version ?? state.planVersion + 1;

    // Optional-null coverage (all optionals null → no-op patch) …
    const noop = await authenticatedRequest(state.adminToken, "mutate", updatePackagePlanMutationDocument, {
      input: {
        id: state.planId,
        displayName: null,
        description: null,
        creditHours: null,
        priceAmount: null,
        currency: null,
        active: null,
        sortOrder: null,
        validityMonths: null,
        version: null,
      },
    });
    expect(noop.updatePackagePlan?.displayName).toBe(`${PREFIX} Gold Plan v2`);

    // … and a stale version rejects.
    await expectMutationError(state.adminToken, updatePackagePlanMutationDocument, {
      input: {
        id: state.planId,
        displayName: "stale write",
        description: null,
        creditHours: null,
        priceAmount: null,
        currency: null,
        active: null,
        sortOrder: null,
        validityMonths: null,
        version: state.planVersion - 5,
      },
    });
  });

  test("recordAccountingPayment credits the student; list + detail + balance queries reflect it", async () => {
    const recorded = await authenticatedRequest(state.adminToken, "mutate", recordAccountingPaymentMutationDocument, {
      input: {
        studentId: state.studentId,
        packagePlanId: state.planId,
        creditHours: 10,
        amount: 300,
        currency: CurrencyCode.Eur,
        paymentGateway: PaymentGateway.Paypal,
        paymentDate: "2026-08-01T12:00:00.000Z",
        isPaidStatusOn: true,
        paymentNote: `${PREFIX} note`,
      },
    });
    const payment = recorded.recordAccountingPayment;
    if (!payment?.id) throw new Error("recordAccountingPayment returned no payment");
    state.paymentId = payment.id;
    expect(payment.invoiceStatus).toBe("PAID");
    expect(payment.packageCodename).toBe(`${PREFIX}_gold`.toUpperCase());
    expect(Number(payment.creditHours)).toBe(10);

    const list = await authenticatedRequest(state.adminToken, "query", accountingPaymentsQueryDocument, {
      filter: { studentId: state.studentId, parentId: null, fromDate: null, toDate: null, unpaidOnly: null },
      paginationArgs: null,
    });
    expect(list.accountingPayments?.some(row => row?.id === state.paymentId)).toBe(true);

    const detail = await authenticatedRequest(state.adminToken, "query", accountingPaymentQueryDocument, {
      id: state.paymentId,
    });
    expect(detail.accountingPayment?.studentId).toBe(state.studentId);
    expect(detail.accountingPayment?.history?.length ?? 0).toBeGreaterThan(0);

    const balance = await authenticatedRequest(state.adminToken, "query", studentCreditHourBalanceQueryDocument, {
      studentId: state.studentId,
    });
    expect(Number(balance.studentCreditHourBalance?.creditHoursTotal)).toBe(10);
    expect(Number(balance.studentCreditHourBalance?.creditHoursRemaining)).toBe(10);
    expect(balance.studentCreditHourBalance?.lastPaymentCurrency).toBe(CurrencyCode.Eur);
  });

  test("updateAccountingPayment supports a note-only edit; toggle flips the paid flag", async () => {
    const edited = await authenticatedRequest(state.adminToken, "mutate", updateAccountingPaymentMutationDocument, {
      input: {
        id: state.paymentId,
        paymentGateway: PaymentGateway.Bank,
        paymentNote: `${PREFIX} edited note`,
        creditHours: null,
        expectedInvoiceVersion: null,
      },
    });
    expect(edited.updateAccountingPayment?.paymentNote).toBe(`${PREFIX} edited note`);
    expect(edited.updateAccountingPayment?.paymentGateway).toBe(PaymentGateway.Bank);
    // No hour delta → no balance movement.
    expect(Number(edited.updateAccountingPayment?.creditHours)).toBe(10);

    const toggled = await authenticatedRequest(
      state.adminToken,
      "mutate",
      toggleAccountingPaymentPaidStatusMutationDocument,
      {
        input: { id: state.paymentId, isPaidStatusOn: false, expectedInvoiceVersion: null },
      }
    );
    expect(toggled.toggleAccountingPaymentPaidStatus?.isPaidStatusOn).toBe(false);
    expect(toggled.toggleAccountingPaymentPaidStatus?.invoiceStatus).toBe("UNPAID");
  });

  test("archivePackagePlan removes the plan from the active list", async () => {
    const archived = await authenticatedRequest(state.adminToken, "mutate", archivePackagePlanMutationDocument, {
      id: state.planId,
    });
    expect(archived.archivePackagePlan?.active).toBe(false);

    const activeList = await authenticatedRequest(state.adminToken, "query", packagePlansQueryDocument, {
      activeOnly: true,
      paginationArgs: null,
    });
    expect(activeList.packagePlans?.some(row => row?.id === state.planId)).toBe(false);
  });

  test("Tier 4: teachers are denied on all six accounting mutations", async () => {
    const paymentInput = {
      studentId: state.studentId,
      packagePlanId: null,
      creditHours: 1,
      amount: 1,
      currency: CurrencyCode.Usd,
      paymentGateway: PaymentGateway.Paypal,
      paymentDate: "2026-08-02T12:00:00.000Z",
      isPaidStatusOn: null,
      paymentNote: null,
    };
    await expectMutationError(state.teacherToken, createPackagePlanMutationDocument, {
      input: {
        codename: `${PREFIX}_denied`,
        displayName: "Denied plan",
        description: null,
        creditHours: 1,
        priceAmount: 1,
        currency: CurrencyCode.Usd,
        active: null,
        sortOrder: null,
        validityMonths: null,
      },
    });
    await expectMutationError(state.teacherToken, updatePackagePlanMutationDocument, {
      input: {
        id: state.planId,
        displayName: null,
        description: null,
        creditHours: null,
        priceAmount: null,
        currency: null,
        active: null,
        sortOrder: null,
        validityMonths: null,
        version: null,
      },
    });
    await expectMutationError(state.teacherToken, archivePackagePlanMutationDocument, { id: state.planId });
    await expectMutationError(state.teacherToken, recordAccountingPaymentMutationDocument, { input: paymentInput });
    await expectMutationError(state.teacherToken, updateAccountingPaymentMutationDocument, {
      input: {
        id: state.paymentId,
        paymentGateway: null,
        paymentNote: null,
        creditHours: null,
        expectedInvoiceVersion: null,
      },
    });
    await expectMutationError(state.teacherToken, toggleAccountingPaymentPaidStatusMutationDocument, {
      input: { id: state.paymentId, isPaidStatusOn: true, expectedInvoiceVersion: null },
    });

    // Denied writes must be no-ops: the plan targeted by the denied archive stays active.
    const planAfterDeniedWrites = await authenticatedRequest(state.adminToken, "query", packagePlanQueryDocument, {
      id: state.planId,
    });
    expect(planAfterDeniedWrites.packagePlan?.active).toBe(true);
  });

  test("Tier 4: associated family reads work; cross-family reads are denied (IDOR)", async () => {
    if (!state.studentUserEmail) throw new Error("student email missing");
    const parentTokenA = await loginUser(state.parentUserEmail, TEST_USER_PASSWORD);
    const studentTokenA = await loginUser(state.studentUserEmail, TEST_USER_PASSWORD);

    // Associated actors read their own surface.
    const parentBalance = await authenticatedRequest(parentTokenA, "query", studentCreditHourBalanceQueryDocument, {
      studentId: state.studentId,
    });
    expect(Number(parentBalance.studentCreditHourBalance?.creditHoursTotal)).toBe(10);

    const parentDetail = await authenticatedRequest(parentTokenA, "query", accountingPaymentQueryDocument, {
      id: state.paymentId,
    });
    expect(parentDetail.accountingPayment?.id).toBe(state.paymentId);

    const studentList = await authenticatedRequest(studentTokenA, "query", accountingPaymentsQueryDocument, {
      filter: { studentId: state.studentId, parentId: null, fromDate: null, toDate: null, unpaidOnly: null },
      paginationArgs: null,
    });
    expect(studentList.accountingPayments?.some(row => row?.id === state.paymentId)).toBe(true);

    // Cross-family (parent of family B) is denied every family-A surface.
    await expectQueryError(state.parentTokenB, accountingPaymentQueryDocument, { id: state.paymentId });
    await expectQueryError(state.parentTokenB, studentCreditHourBalanceQueryDocument, {
      studentId: state.studentId,
    });
    await expectQueryError(state.parentTokenB, accountingPaymentsQueryDocument, {
      filter: { studentId: state.studentId, parentId: null, fromDate: null, toDate: null, unpaidOnly: null },
      paginationArgs: null,
    });
    // Unscoped list needs the VIEW permission too.
    await expectQueryError(state.parentTokenB, accountingPaymentsQueryDocument, {
      filter: { studentId: null, parentId: null, fromDate: null, toDate: null, unpaidOnly: null },
      paginationArgs: null,
    });
  });

  test("Tier 4: invalid amounts and injection-shaped filter input cannot record or read payments", async () => {
    // Zero / negative hours are rejected by service validation.
    await expectMutationError(state.adminToken, recordAccountingPaymentMutationDocument, {
      input: {
        studentId: state.studentId,
        packagePlanId: null,
        creditHours: 0,
        amount: 1,
        currency: CurrencyCode.Usd,
        paymentGateway: PaymentGateway.Paypal,
        paymentDate: "2026-08-03T12:00:00.000Z",
        isPaidStatusOn: null,
        paymentNote: null,
      },
    });
    await expectMutationError(state.adminToken, recordAccountingPaymentMutationDocument, {
      input: {
        studentId: state.studentId,
        packagePlanId: null,
        creditHours: 1,
        amount: -50,
        currency: CurrencyCode.Usd,
        paymentGateway: PaymentGateway.Other,
        paymentDate: "2026-08-03T12:00:00.000Z",
        isPaidStatusOn: null,
        paymentNote: null,
      },
    });

    // Wildcard/injection-shaped studentId must not widen the filter: it is a
    // parameterized uuid comparison — assert no rows escape and no 2xx-with-rows.
    await expectQueryError(state.adminToken, accountingPaymentsQueryDocument, {
      filter: {
        studentId: "' OR '1'='1' --",
        parentId: null,
        fromDate: null,
        toDate: null,
        unpaidOnly: null,
      },
      paginationArgs: null,
    });
  });
});
