import { describe, expect, test } from "bun:test";
import crypto from "node:crypto";
import {
  CurrencyCode as CurrencyCodeEnum,
  InvoiceStatus,
  InvoiceType as InvoiceTypeEnum,
  PaymentMethodType,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  createManualInvoiceMutationDocument,
  deleteInvoiceMutationDocument,
  markInvoicePaidMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { invoicePaymentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/billing-payments.documents";
import { prepareUploadMutationDocument } from "@/frontend/common/graphql/sharedDocuments/resources/learning-resource.documents";
import {
  assertOperationDenied,
  authenticatedRequest,
  cleanupTestEntities,
  cleanupTestSuperAdmin,
  expectMutationError,
  loginAndProvision,
  provisionTestSuperAdmin,
} from "@/frontend/common/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";
import { getTestApiUrl } from "@/frontend/common/graphql/test/testClient";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

function invoiceVars(parentId: string, amount: string) {
  return {
    parentId,
    studentId: null as string | null,
    amount,
    currency: CurrencyCodeEnum.Usd,
    invoiceType: InvoiceTypeEnum.Manual,
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

async function uploadProofFile(token: string): Promise<string> {
  const fileContent = Buffer.from("billing payment proof test");
  const contentHash = crypto.createHash("sha256").update(fileContent).digest("base64");
  const filePath = `private/billing/proof-test-${Date.now()}.pdf`;

  const prepData = await authenticatedRequest(token, "mutate", prepareUploadMutationDocument, {
    input: {
      path: filePath,
      fileSize: fileContent.length,
      contentType: "application/pdf",
      contentHash,
    },
  });

  const prep = prepData?.prepareUpload;
  if (!prep) {
    throw new Error("Failed to prepare upload");
  }

  const uploadUrl = getTestApiUrl(`/api/storage/upload/${prep.id}`);
  const response = await Bun.fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/pdf",
      "Content-MD5": contentHash,
      "Content-Length": String(fileContent.length),
    },
    body: fileContent,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload proof file: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.id as string;
}

/** Mutable test state shared between provision, test body, and cleanup phases. */
interface BillingTestState {
  adminToken: string;
  superAdminToken: string;
  superAdminUserId: string;
  parentId: string;
  teacherId: string;
  studentId: string;
  studentUserId: string;
  teacherUserId: string;
  parentUserId: string;
}

/** Provisions test entities, logs in, and populates the shared state object. */
async function provisionAndLogin(state: BillingTestState, prefix: string): Promise<void> {
  const r = await loginAndProvision(prefix);
  state.adminToken = r.adminToken;
  state.teacherId = r.teacherId;
  state.studentId = r.studentId;
  state.studentUserId = r.studentUserId;
  state.teacherUserId = r.teacherUserId;
  state.parentUserId = r.parentUserId;
  state.parentId = r.parentId;

  const sa = await provisionTestSuperAdmin(state.adminToken, `${prefix}SA`);
  state.superAdminToken = sa.token;
  state.superAdminUserId = sa.userId;
}

/** Cleans up all provisioned entities and the super admin created during setup. */
async function cleanupAll(state: BillingTestState): Promise<void> {
  await cleanupTestEntities(state.adminToken, {
    studentUserId: state.studentUserId,
    teacherUserId: state.teacherUserId,
    parentUserId: state.parentUserId,
    studentId: state.studentId,
    teacherId: state.teacherId,
    parentId: state.parentId,
  });
  await cleanupTestSuperAdmin(state.superAdminToken, state.superAdminUserId);
}

describe("GraphQL: createManualInvoice mutation", () => {
  setupTestServerLifecycle();

  const state: BillingTestState = {
    adminToken: "",
    superAdminToken: "",
    superAdminUserId: "",
    parentId: "",
    teacherId: "",
    studentId: "",
    studentUserId: "",
    teacherUserId: "",
    parentUserId: "",
  };

  test("provision test entities and login", async () => {
    await provisionAndLogin(state, "BillTest");
    expect(state.superAdminToken).not.toBe("");
    expect(state.parentId).not.toBe("");
  });

  test("admin creates a manual invoice with UNPAID status", async () => {
    const data = await authenticatedRequest(
      state.superAdminToken,
      "mutate",
      createManualInvoiceMutationDocument,
      invoiceVars(state.parentId, "200.00")
    );

    expect(data.createManualInvoice?.parentId).toBe(state.parentId);
    expect(data.createManualInvoice?.status).toBe(InvoiceStatus.Unpaid);
    expect(data.createManualInvoice?.amount).toBe("200.00");
    expect(data.createManualInvoice?.currency).toBe(CurrencyCodeEnum.Usd);
  });

  test("teacher role is denied", async () => {
    const denied = await assertOperationDenied(
      "teacher_default",
      "mutate",
      createManualInvoiceMutationDocument,
      invoiceVars(NIL_UUID, "100.00")
    );
    expect(denied).toBe(true);
  });

  test("parent role is denied", async () => {
    const denied = await assertOperationDenied(
      "parent_default",
      "mutate",
      createManualInvoiceMutationDocument,
      invoiceVars(NIL_UUID, "100.00")
    );
    expect(denied).toBe(true);
  });

  test("invalid negative amount returns validation error", async () => {
    await expectMutationError(
      state.superAdminToken,
      createManualInvoiceMutationDocument,
      invoiceVars(state.parentId, "-50.00")
    );
    expect(state.superAdminToken).toBeTruthy();
  });

  test("cleanup provisioned entities", async () => {
    await cleanupAll(state);
    expect(state.superAdminToken).toBeTruthy();
  });
});

describe("GraphQL: markInvoicePaid and deleteInvoice mutations", () => {
  setupTestServerLifecycle();

  const state: BillingTestState = {
    adminToken: "",
    superAdminToken: "",
    superAdminUserId: "",
    parentId: "",
    teacherId: "",
    studentId: "",
    studentUserId: "",
    teacherUserId: "",
    parentUserId: "",
  };
  let unpaidInvoiceId = "";
  let deleteInvoiceId = "";
  let proofFileId = "";

  test("provision test entities and login", async () => {
    await provisionAndLogin(state, "BillPaidTest");
    expect(state.superAdminToken).not.toBe("");
    expect(state.parentId).not.toBe("");
  });

  test("create an UNPAID invoice for mark-paid tests", async () => {
    unpaidInvoiceId = await createInvoice(state.superAdminToken, state.parentId, "300.00");
  });

  test("upload payment proof file for mark-paid", async () => {
    proofFileId = await uploadProofFile(state.superAdminToken);
    expect(proofFileId).not.toBe("");
  });

  test("admin marks UNPAID invoice as PAID", async () => {
    const data = await authenticatedRequest(state.superAdminToken, "mutate", markInvoicePaidMutationDocument, {
      invoiceId: unpaidInvoiceId,
      expectedVersion: null,
      proofFileId,
    });

    expect(data.markInvoicePaid?.id).toBe(unpaidInvoiceId);
    expect(data.markInvoicePaid?.status).toBe(InvoiceStatus.Paid);
    expect(data.markInvoicePaid?.paidDate).toBeTruthy();
  });

  test("markInvoicePaid records proof payment retrievable via invoicePayments", async () => {
    const payments = await authenticatedRequest(state.superAdminToken, "query", invoicePaymentsQueryDocument, {
      invoiceId: unpaidInvoiceId,
    });
    const rows = payments.invoicePayments ?? [];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.paymentMethodType).toBe(PaymentMethodType.ProofUpload);
    expect(rows[0]?.paymentMethodSnapshot).toBeNull();
  });

  test("Threat 1 — double settlement: second markInvoicePaid returns error", async () => {
    await expectMutationError(state.superAdminToken, markInvoicePaidMutationDocument, {
      invoiceId: unpaidInvoiceId,
      expectedVersion: null,
      proofFileId,
    });
    expect(unpaidInvoiceId).toBeTruthy();
  });

  test("teacher role is denied markInvoicePaid", async () => {
    const denied = await assertOperationDenied("teacher_default", "mutate", markInvoicePaidMutationDocument, {
      invoiceId: NIL_UUID,
      expectedVersion: null,
      proofFileId: NIL_UUID,
    });
    expect(denied).toBe(true);
  });

  test("Threat 2 — non-existent invoice ID returns error", async () => {
    await expectMutationError(state.superAdminToken, markInvoicePaidMutationDocument, {
      invoiceId: NIL_UUID,
      expectedVersion: null,
      proofFileId: NIL_UUID,
    });
    expect(state.superAdminToken).toBeTruthy();
  });

  test("create a second UNPAID invoice for delete tests", async () => {
    deleteInvoiceId = await createInvoice(state.superAdminToken, state.parentId, "150.00");
  });

  test("admin soft-deletes an invoice", async () => {
    const data = await authenticatedRequest(state.superAdminToken, "mutate", deleteInvoiceMutationDocument, {
      invoiceId: deleteInvoiceId,
    });

    expect(data.deleteInvoice?.id).toBe(deleteInvoiceId);
    expect(data.deleteInvoice?.parentId).toBeTruthy();
  });

  test("Threat 2 — double deletion: second deleteInvoice returns error", async () => {
    await expectMutationError(state.superAdminToken, deleteInvoiceMutationDocument, { invoiceId: deleteInvoiceId });
    expect(deleteInvoiceId).toBeTruthy();
  });

  test("teacher role is denied deleteInvoice", async () => {
    const denied = await assertOperationDenied("teacher_default", "mutate", deleteInvoiceMutationDocument, {
      invoiceId: NIL_UUID,
    });
    expect(denied).toBe(true);
  });

  test("cleanup provisioned entities", async () => {
    await cleanupAll(state);
    expect(state.superAdminToken).toBeTruthy();
  });
});
