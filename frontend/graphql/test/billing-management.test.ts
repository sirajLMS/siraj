import { describe, expect, test } from "bun:test";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import type { InvoiceType as InvoiceTypeEnumType } from "@/frontend/graphql/generated/gql/graphql-types";
import { InvoiceStatus, InvoiceType as InvoiceTypeEnum } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  createManualInvoiceMutationDocument,
  deleteInvoiceMutationDocument,
  markInvoicePaidMutationDocument,
} from "../sharedDocuments";
import {
  assertOperationDenied,
  authenticatedRequest,
  cleanupTestEntities,
  cleanupTestSuperAdmin,
  loginAndProvision,
  provisionTestSuperAdmin,
} from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

function invoiceVars(parentId: string, amount: string) {
  return {
    parentId,
    studentId: null as string | null,
    amount,
    currency: "USD",
    invoiceType: InvoiceTypeEnum.Manual as InvoiceTypeEnumType,
    issueDate: "2026-06-22",
    dueDate: "2026-07-22",
    exchangeRateSnapshot: null as string | null,
    exchangeRateSource: null as string | null,
    billingMonths: null as Array<{ month: number; year: number }> | null,
    sendEmail: null as boolean | null,
  };
}

async function createInvoice(token: string, parentId: string, amount: string): Promise<string> {
  const data = await authenticatedRequest(
    token,
    "mutate",
    createManualInvoiceMutationDocument,
    invoiceVars(parentId, amount)
  );
  const id = data.createManualInvoice?.id;
  expect(id).toBeTruthy();
  if (!id) throw new Error("No invoice id");
  return id;
}

async function expectMutationError<TData, TVars extends OperationVariables>(
  token: string,
  mutation: TypedDocumentNode<TData, TVars>,
  variables: TVars
): Promise<void> {
  const result = await testClient.mutate({
    mutation,
    variables,
    context: { headers: { Authorization: `Bearer ${token}` } },
  } as Parameters<typeof testClient.mutate>[0]);
  expect(result.error).toBeDefined();
}

describe("GraphQL: createManualInvoice mutation", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let superAdminToken = "";
  let superAdminUserId = "";
  let parentId = "";
  let teacherId = "";
  let studentId = "";
  let studentUserId = "";
  let teacherUserId = "";
  let parentUserId = "";

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("BillTest");
    adminToken = r.adminToken;
    teacherId = r.teacherId;
    studentId = r.studentId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;

    const sa = await provisionTestSuperAdmin(adminToken, "BillTestSA");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;
  });

  test("admin creates a manual invoice with UNPAID status", async () => {
    const data = await authenticatedRequest(
      superAdminToken,
      "mutate",
      createManualInvoiceMutationDocument,
      invoiceVars(parentId, "200.00")
    );

    expect(data.createManualInvoice?.parentId).toBe(parentId);
    expect(data.createManualInvoice?.status).toBe(InvoiceStatus.Unpaid);
    expect(data.createManualInvoice?.amount).toBe("200.00");
    expect(data.createManualInvoice?.currency).toBe("USD");
  });

  test("teacher role is denied", async () => {
    await assertOperationDenied(
      "teacher_default",
      "mutate",
      createManualInvoiceMutationDocument,
      invoiceVars(NIL_UUID, "100.00")
    );
  });

  test("parent role is denied", async () => {
    await assertOperationDenied(
      "parent_default",
      "mutate",
      createManualInvoiceMutationDocument,
      invoiceVars(NIL_UUID, "100.00")
    );
  });

  test("invalid negative amount returns validation error", async () => {
    await expectMutationError(superAdminToken, createManualInvoiceMutationDocument, invoiceVars(parentId, "-50.00"));
  });

  test("cleanup provisioned entities", async () => {
    await cleanupTestEntities(adminToken, {
      studentUserId,
      teacherUserId,
      parentUserId,
      studentId,
      teacherId,
      parentId,
    });
    await cleanupTestSuperAdmin(superAdminToken, superAdminUserId);
  });
});

describe("GraphQL: markInvoicePaid and deleteInvoice mutations", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let superAdminToken = "";
  let superAdminUserId = "";
  let parentId = "";
  let unpaidInvoiceId = "";
  let deleteInvoiceId = "";
  let teacherId = "";
  let studentId = "";
  let studentUserId = "";
  let teacherUserId = "";
  let parentUserId = "";

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("BillPaidTest");
    adminToken = r.adminToken;
    teacherId = r.teacherId;
    studentId = r.studentId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;

    const sa = await provisionTestSuperAdmin(adminToken, "BillPaidTestSA");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;
  });

  test("create an UNPAID invoice for mark-paid tests", async () => {
    unpaidInvoiceId = await createInvoice(superAdminToken, parentId, "300.00");
  });

  test("admin marks UNPAID invoice as PAID", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", markInvoicePaidMutationDocument, {
      invoiceId: unpaidInvoiceId,
      expectedVersion: null,
    });

    expect(data.markInvoicePaid?.id).toBe(unpaidInvoiceId);
    expect(data.markInvoicePaid?.status).toBe(InvoiceStatus.Paid);
    expect(data.markInvoicePaid?.paidDate).toBeTruthy();
  });

  test("Threat 1 — double settlement: second markInvoicePaid returns error", async () => {
    await expectMutationError(superAdminToken, markInvoicePaidMutationDocument, {
      invoiceId: unpaidInvoiceId,
      expectedVersion: null,
    });
  });

  test("teacher role is denied markInvoicePaid", async () => {
    await assertOperationDenied("teacher_default", "mutate", markInvoicePaidMutationDocument, {
      invoiceId: NIL_UUID,
      expectedVersion: null,
    });
  });

  test("Threat 2 — non-existent invoice ID returns error", async () => {
    await expectMutationError(superAdminToken, markInvoicePaidMutationDocument, {
      invoiceId: NIL_UUID,
      expectedVersion: null,
    });
  });

  test("create a second UNPAID invoice for delete tests", async () => {
    deleteInvoiceId = await createInvoice(superAdminToken, parentId, "150.00");
  });

  test("admin soft-deletes an invoice", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", deleteInvoiceMutationDocument, {
      invoiceId: deleteInvoiceId,
    });

    expect(data.deleteInvoice?.id).toBe(deleteInvoiceId);
    expect(data.deleteInvoice?.parentId).toBeTruthy();
  });

  test("Threat 2 — double deletion: second deleteInvoice returns error", async () => {
    await expectMutationError(superAdminToken, deleteInvoiceMutationDocument, { invoiceId: deleteInvoiceId });
  });

  test("teacher role is denied deleteInvoice", async () => {
    await assertOperationDenied("teacher_default", "mutate", deleteInvoiceMutationDocument, { invoiceId: NIL_UUID });
  });

  test("cleanup provisioned entities", async () => {
    await cleanupTestEntities(adminToken, {
      studentUserId,
      teacherUserId,
      parentUserId,
      studentId,
      teacherId,
      parentId,
    });
    await cleanupTestSuperAdmin(superAdminToken, superAdminUserId);
  });
});
