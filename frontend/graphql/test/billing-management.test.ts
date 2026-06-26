import { describe, expect, test } from "bun:test";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import {
  createManualInvoiceMutationDocument,
  deleteInvoiceMutationDocument,
  markInvoicePaidMutationDocument,
  parentDirectoryQueryDocument,
} from "../sharedDocuments";
import { assertOperationDenied, authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

async function loginAndGetParentId(): Promise<{ token: string; parentId: string }> {
  const token = await loginDemoUser("academy_admin");
  expect(token).not.toBeNull();

  const dir = await authenticatedRequest(token, "query", parentDirectoryQueryDocument, {
    search: null,
    paginationArgs: null,
  });

  const parentId = dir.parentDirectory?.rows?.[0]?.id;
  expect(parentId).toBeTruthy();
  if (!parentId) throw new Error("No parentId");

  return { token, parentId };
}

function invoiceVars(parentId: string, amount: string) {
  return {
    parentId,
    studentId: null,
    amount,
    currency: "USD",
    invoiceType: "MANUAL",
    issueDate: "2026-06-22",
    dueDate: "2026-07-22",
    exchangeRateSnapshot: null,
    exchangeRateSource: null,
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

  let token = "";
  let parentId = "";

  test("login and fetch parentId", async () => {
    const setup = await loginAndGetParentId();
    token = setup.token;
    parentId = setup.parentId;
  });

  test("admin creates a manual invoice with UNPAID status", async () => {
    const data = await authenticatedRequest(
      token,
      "mutate",
      createManualInvoiceMutationDocument,
      invoiceVars(parentId, "200.00")
    );

    expect(data.createManualInvoice?.parentId).toBe(parentId);
    expect(data.createManualInvoice?.status).toBe("UNPAID");
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
    await expectMutationError(token, createManualInvoiceMutationDocument, invoiceVars(parentId, "-50.00"));
  });
});

describe("GraphQL: markInvoicePaid and deleteInvoice mutations", () => {
  setupTestServerLifecycle();

  let token = "";
  let parentId = "";
  let unpaidInvoiceId = "";
  let deleteInvoiceId = "";

  test("login and fetch parentId", async () => {
    const setup = await loginAndGetParentId();
    token = setup.token;
    parentId = setup.parentId;
  });

  test("create an UNPAID invoice for mark-paid tests", async () => {
    unpaidInvoiceId = await createInvoice(token, parentId, "300.00");
  });

  test("admin marks UNPAID invoice as PAID", async () => {
    const data = await authenticatedRequest(token, "mutate", markInvoicePaidMutationDocument, {
      invoiceId: unpaidInvoiceId,
      expectedVersion: null,
    });

    expect(data.markInvoicePaid?.id).toBe(unpaidInvoiceId);
    expect(data.markInvoicePaid?.status).toBe("PAID");
    expect(data.markInvoicePaid?.paidDate).toBeTruthy();
  });

  test("Threat 1 — double settlement: second markInvoicePaid returns error", async () => {
    await expectMutationError(token, markInvoicePaidMutationDocument, {
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
    await expectMutationError(token, markInvoicePaidMutationDocument, {
      invoiceId: NIL_UUID,
      expectedVersion: null,
    });
  });

  test("create a second UNPAID invoice for delete tests", async () => {
    deleteInvoiceId = await createInvoice(token, parentId, "150.00");
  });

  test("admin soft-deletes an invoice", async () => {
    const data = await authenticatedRequest(token, "mutate", deleteInvoiceMutationDocument, {
      invoiceId: deleteInvoiceId,
    });

    expect(data.deleteInvoice?.id).toBe(deleteInvoiceId);
    expect(data.deleteInvoice?.deletedAt).toBeTruthy();
  });

  test("Threat 2 — double deletion: second deleteInvoice returns error", async () => {
    await expectMutationError(token, deleteInvoiceMutationDocument, { invoiceId: deleteInvoiceId });
  });

  test("teacher role is denied deleteInvoice", async () => {
    await assertOperationDenied("teacher_default", "mutate", deleteInvoiceMutationDocument, { invoiceId: NIL_UUID });
  });
});
