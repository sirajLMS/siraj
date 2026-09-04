import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NotificationEventType } from "@/backend/enum";
import type { ErrorsLabels } from "@/shared/locale";

const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const PARENT_ID = "22222222-2222-4222-8222-222222222222";
const PARENT_USER_ID = "33333333-3333-4333-8333-333333333333";
const STUDENT_ID = "44444444-4444-4444-8444-444444444444";

const INVOICE_COUNT = 50;

function generateInvoices(count: number) {
  const invoices = [];
  for (let i = 0; i < count; i++) {
    invoices.push({
      id: `inv-perf-${i}`,
      parentId: PARENT_ID,
      studentId: STUDENT_ID,
      issueDate: "2026-07-01",
      dueDate: "2026-07-31",
      paidDate: null,
      amount: "100.00",
      currency: "SAR",
      status: "UNPAID",
      invoiceType: "MONTHLY",
      version: 1,
      exchangeRateSnapshot: null,
      exchangeRateSource: null,
      createdByUserId: ACTOR_ID,
      emailSentAt: null,
      idempotencyKey: `test-key-${i}`,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
      deletedAt: null,
    });
  }
  return invoices;
}

const mockInvoices = generateInvoices(INVOICE_COUNT);

const unpaidInvoicesSelectMock = mock(() => mockInvoices);

function chainWith(results: () => unknown[]): Record<string, unknown> {
  const chain: Record<string, unknown> = {
    from: () => chain,
    innerJoin: () => chain,
    where: () => Promise.resolve(results()),
  };
  return chain;
}

const dbSelectMock = mock(() => chainWith(unpaidInvoicesSelectMock));
const dbTransactionMock = mock(async (fn: (tx: unknown) => Promise<unknown>) => fn({}));

await mock.module("@/backend/db/drizzleDb", () => ({
  db: {
    select: dbSelectMock,
    transaction: dbTransactionMock,
  },
  queryDb: () => ({}),
}));

await mock.module("@/backend/db/schema", () => ({
  groupPermissions: {},
  permissions: {},
  userPermissionGroups: {},
  invoices: {},
  invoiceCoverageMonths: {},
  parents: {},
  payments: {},
  students: {},
  systemSettings: {},
  users: {},
}));

const getParentProfileMock = mock(async () => ({
  id: PARENT_ID,
  userId: PARENT_USER_ID,
  name: "Parent",
  email: "parent@test.com",
}));

const studentFindByIdMock = mock(async () => ({
  id: STUDENT_ID,
  parentId: PARENT_ID,
}));

await mock.module("@/backend/db/repo", () => ({
  BillingRepository: {
    createInvoice: mock(async () => mockInvoices[0]),
    createInvoiceCoverageMonths: mock(async () => undefined),
    getInvoiceById: mock(async () => mockInvoices[0]),
    setInvoicePaymentPending: mock(async () => mockInvoices[0]),
    markInvoiceAsPaid: mock(async () => mockInvoices[0]),
    updateInvoiceStatus: mock(async () => mockInvoices[0]),
    getUnpaidInvoicesSummary: async () => ({
      id: "unpaid-invoices-summary",
      totalOverdueInvoices: 0,
      totalOverdueAmount: "0.00",
      overdueAmountsByCurrency: [],
      items: [],
    }),
  },
  InvoicePaymentSubmissionRepository: {
    createSubmission: mock(async () => undefined),
    updateSubmissionStatus: mock(async () => undefined),
    rejectPendingForInvoice: mock(async () => undefined),
    getPendingByInvoiceId: mock(async () => null),
    getLatestByInvoiceId: mock(async () => null),
  },
  ParentRepository: {
    getParentProfile: getParentProfileMock,
  },
  StudentRepository: {
    findById: studentFindByIdMock,
  },
  PermissionManagementRepository: {
    listUserIdsWithPermission: async () => [],
  },
}));

await mock.module("@/backend/db/repo/billing", () => ({
  BillingRepository: {
    createInvoice: mock(async () => mockInvoices[0]),
    createInvoiceCoverageMonths: mock(async () => undefined),
    getInvoiceById: mock(async () => mockInvoices[0]),
    setInvoicePaymentPending: mock(async () => mockInvoices[0]),
    markInvoiceAsPaid: mock(async () => mockInvoices[0]),
    updateInvoiceStatus: mock(async () => mockInvoices[0]),
    getUnpaidInvoicesSummary: async () => ({
      id: "unpaid-invoices-summary",
      totalOverdueInvoices: 0,
      totalOverdueAmount: "0.00",
      overdueAmountsByCurrency: [],
      items: [],
    }),
  },
  InvoicePaymentSubmissionRepository: {
    createSubmission: mock(async () => undefined),
    updateSubmissionStatus: mock(async () => undefined),
    rejectPendingForInvoice: mock(async () => undefined),
    getPendingByInvoiceId: mock(async () => null),
    getLatestByInvoiceId: mock(async () => null),
  },
}));

await mock.module("@/backend/db/repo/parents", () => ({
  ParentRepository: {
    getParentProfile: getParentProfileMock,
  },
}));

await mock.module("@/backend/db/repo/permissions", () => ({
  PermissionManagementRepository: {
    listUserIdsWithPermission: async () => [],
  },
}));

await mock.module("@/backend/db/repo/students", () => ({
  StudentRepository: {
    findById: studentFindByIdMock,
  },
}));

const hasPermissionMock = mock(async () => true);

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
  },
}));

const syncUnpaidNotificationsMock = mock(async () => ({
  id: "unpaid-invoices-summary",
  totalOverdueInvoices: 0,
  totalOverdueAmount: "0.00",
  overdueAmountsByCurrency: [],
  items: [],
}));

await mock.module("@/backend/services/system/notification-sync.service", () => ({
  NotificationSyncService: {
    syncUnpaidNotifications: syncUnpaidNotificationsMock,
  },
}));

await mock.module("@/backend/services", () => ({
  NotificationSyncService: {
    syncUnpaidNotifications: syncUnpaidNotificationsMock,
  },
  PermissionsService: { hasPermission: hasPermissionMock },
}));

const buildInvoiceGeneratedPayloadsMock = mock((userId: string, _invoice: { id: string }, _locale?: string) => [
  { userId, channel: "on_app", eventType: NotificationEventType.INVOICE_GENERATED, title: "t", body: "b" },
  { userId, channel: "email", eventType: NotificationEventType.INVOICE_GENERATED, title: "t", body: "b" },
  { userId, channel: "sms", eventType: NotificationEventType.INVOICE_GENERATED, title: "t", body: "b" },
  { userId, channel: "push", eventType: NotificationEventType.INVOICE_GENERATED, title: "t", body: "b" },
]);

await mock.module("@/backend/services/notification/notification-payloads.builders", () => ({
  buildInvoiceGeneratedPayloads: buildInvoiceGeneratedPayloadsMock,
  buildInvoiceStatusChangedPayloads: mock(() => []),
}));

interface DispatchCall {
  payloads: unknown[];
  affectedUserIds: string[];
  locale?: string;
}

const dispatchCalls: DispatchCall[] = [];
const dispatchWithPreferencesMock = mock(async (payloads: unknown[], affectedUserIds: string[], locale?: string) => {
  dispatchCalls.push({ payloads, affectedUserIds, locale });
  return payloads.map(() => ({ success: true }));
});

await mock.module("@/backend/services/notification/notification-dispatch.helpers", () => ({
  dispatchWithPreferences: dispatchWithPreferencesMock,
}));

await mock.module("@/backend/lib", () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
  NotFoundError: class NotFoundError extends Error {},
  ForbiddenError: class ForbiddenError extends Error {},
}));

await mock.module("@/shared/locale", () => ({
  getServerTranslations: () => ({
    errorsTranslations: new Proxy({}, { get: () => () => "error" }),
  }),
}));

await mock.module("@/backend/services/billing/billing-payment-proof.helpers", () => ({
  assertInvoiceBelongsToParentUser: async () => undefined,
  validateProofFile: async () => ({ filePath: "uploads/proof.png", mimeType: "image/png" }),
  linkProofToInvoice: async () => undefined,
  recordProofPayment: async () => ({}),
  buildProofSnapshot: () => ({}),
  mapSubmissionToReturnType: (submission: unknown) => submission,
}));

async function importService() {
  return import("@/backend/services/billing/billing-management.service");
}

const tErrorsStub = new Proxy({}, { get: () => () => "error" }) as unknown as ErrorsLabels;

describe("BillingManagementService sendPaymentReminder benchmark", () => {
  beforeEach(() => {
    dispatchCalls.length = 0;
    dispatchWithPreferencesMock.mockClear();
    buildInvoiceGeneratedPayloadsMock.mockClear();
  });

  test("measures execution time and dispatch calls for sendPaymentReminder with 50 invoices", async () => {
    const { BillingManagementService } = await importService();

    const start = performance.now();
    const result = await BillingManagementService.sendPaymentReminder(ACTOR_ID, STUDENT_ID, tErrorsStub, "en");
    const end = performance.now();

    const duration = end - start;
    expect(duration).toBeGreaterThan(0);
    expect(result.success).toBe(true);
    expect(buildInvoiceGeneratedPayloadsMock).toHaveBeenCalledTimes(INVOICE_COUNT);
    expect(dispatchWithPreferencesMock).toHaveBeenCalledTimes(1);
    expect(dispatchCalls.reduce((acc, c) => acc + c.payloads.length, 0)).toBe(INVOICE_COUNT * 4);
  });
});
