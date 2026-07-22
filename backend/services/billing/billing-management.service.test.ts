import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NotificationEventType } from "@/backend/enum";

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const PARENT_ID = "22222222-2222-4222-8222-222222222222";
const PARENT_USER_ID = "33333333-3333-4333-8333-333333333333";
const STUDENT_ID = "44444444-4444-4444-8444-444444444444";
const STAFF_USER_ID_A = "55555555-5555-4555-8555-555555555555";
const STAFF_USER_ID_B = "66666666-6666-4666-8666-666666666666";
const INVOICE_ID = "77777777-7777-4777-8777-777777777777";
const PROOF_FILE_ID = "88888888-8888-4888-8888-888888888888";
const SUBMISSION_ID = "99999999-9999-4999-8999-999999999999";

const mockInvoiceRow = {
  id: INVOICE_ID,
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
  idempotencyKey: "test-key",
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  deletedAt: null,
};

const mockPaymentPendingInvoice = { ...mockInvoiceRow, status: "PAYMENT_PENDING" };

// --- Repo mocks ----------------------------------------------------------

const createInvoiceMock = mock(async () => mockInvoiceRow);
const createInvoiceCoverageMonthsMock = mock(async () => undefined);
const getInvoiceByIdMock = mock(async () => mockInvoiceRow);
const setInvoicePaymentPendingMock = mock(async () => mockPaymentPendingInvoice);
const markInvoiceAsPaidMock = mock(async () => ({ ...mockInvoiceRow, status: "PAID" }));
const updateInvoiceStatusMock = mock(async () => ({ ...mockInvoiceRow, status: "UNPAID" }));

const createSubmissionMock = mock(async () => undefined);
const updateSubmissionStatusMock = mock(async () => undefined);
const rejectPendingForInvoiceMock = mock(async () => undefined);
const getPendingByInvoiceIdMock = mock(async () => ({
  id: SUBMISSION_ID,
  invoiceId: INVOICE_ID,
  fileId: PROOF_FILE_ID,
  submittedByUserId: PARENT_USER_ID,
  submittedAt: new Date(),
  status: "pending",
  reviewedByUserId: null,
  reviewedAt: null,
  rejectionReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}));
const getLatestByInvoiceIdMock = mock(async () => null);

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

// `db.select({...}).from(...).innerJoin(...).innerJoin(...).where(...)` chain
// used by `resolveUsersWithPermission` to find staff reviewers. The default
// chain returns two staff reviewers (B3 fanout). Per-test overrides can swap
// `selectReturnMock` for custom behaviors.
const staffSelectRowsMock = mock(() => [{ userId: STAFF_USER_ID_A }, { userId: STAFF_USER_ID_B }]);

// `db.select().from(invoices).where(...)` chain used inside
// `dispatchUnpaidInvoicesForStudent` (B2) to fetch unpaid invoices for a
// parent. Returns two unpaid invoices so the test asserts 8 payloads fired
// (2 invoices × 4 channels).
const unpaidInvoicesSelectMock = mock(() => [mockInvoiceRow, { ...mockInvoiceRow, id: "inv-rem-b" }]);

// Build a fluent chain whereevery method returns `chain` and the terminal
// `.where(...)` resolves to whatever the `results()` mock returns.
function chainWith(results: () => unknown[]): Record<string, unknown> {
  const chain: Record<string, unknown> = {
    from: () => chain,
    innerJoin: () => chain,
    where: () => Promise.resolve(results()),
  };
  return chain;
}

// `db.select` is called in two places:
//   (1) `resolveUsersWithPermission` — passes an object with a `userId` field
//   (2) `dispatchUnpaidInvoicesForStudent` — passes no arguments (selects all columns)
// We branch by the presence of `userId` in the first argument.
const dbSelectMock = mock((arg?: unknown) => {
  const a = arg as { userId?: unknown } | undefined;
  if (a && "userId" in a) {
    return chainWith(staffSelectRowsMock);
  }
  return chainWith(unpaidInvoicesSelectMock);
});

const dbTransactionMock = mock(async (fn: (tx: unknown) => Promise<unknown>) => fn({}));

mock.module("@/backend/db/drizzleDb", () => ({
  db: {
    select: dbSelectMock,
    transaction: dbTransactionMock,
  },
}));

mock.module("@/backend/db/schema", () => ({
  groupPermissions: {},
  permissions: {},
  userPermissionGroups: {},
  invoices: {},
}));

mock.module("@/backend/db/repo", () => ({
  BillingRepository: {
    createInvoice: createInvoiceMock,
    createInvoiceCoverageMonths: createInvoiceCoverageMonthsMock,
    getInvoiceById: getInvoiceByIdMock,
    setInvoicePaymentPending: setInvoicePaymentPendingMock,
    markInvoiceAsPaid: markInvoiceAsPaidMock,
    updateInvoiceStatus: updateInvoiceStatusMock,
    getUnpaidInvoicesSummary: async () => ({
      id: "unpaid-invoices-summary",
      totalOverdueInvoices: 0,
      totalOverdueAmount: "0.00",
      overdueAmountsByCurrency: [],
      items: [],
    }),
  },
  InvoicePaymentSubmissionRepository: {
    createSubmission: createSubmissionMock,
    updateSubmissionStatus: updateSubmissionStatusMock,
    rejectPendingForInvoice: rejectPendingForInvoiceMock,
    getPendingByInvoiceId: getPendingByInvoiceIdMock,
    getLatestByInvoiceId: getLatestByInvoiceIdMock,
  },
  ParentRepository: {
    getParentProfile: getParentProfileMock,
  },
  StudentRepository: {
    findById: studentFindByIdMock,
  },
}));

// --- Permission mock -----------------------------------------------------

const hasPermissionMock = mock(async () => true);

mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
  },
}));

// --- Notification-sync mock (keeps tray-summary call; specs.md F9) ---

const syncUnpaidNotificationsMock = mock(async () => ({
  id: "unpaid-invoices-summary",
  totalOverdueInvoices: 0,
  totalOverdueAmount: "0.00",
  overdueAmountsByCurrency: [],
  items: [],
}));

mock.module("@/backend/services/system/notification-sync.service", () => ({
  NotificationSyncService: {
    syncUnpaidNotifications: syncUnpaidNotificationsMock,
  },
}));

// Re-export NotificationSyncService barrel-aligned (the service file imports
// via `@/backend/services`).
mock.module("@/backend/services", () => ({
  NotificationSyncService: {
    syncUnpaidNotifications: syncUnpaidNotificationsMock,
  },
  PermissionsService: { hasPermission: hasPermissionMock },
}));

// --- Pure builder + dispatch mocks ---------------------------------------

// The builders are mocked so we can assert they were called with the
// expected `(userId, action, invoice, locale)` argument shapes. Each call
// returns a synthetic one-payload array tagged with the userId/eventType so
// assertions can verify fanout counts and channel distribution.

interface CapturedBuilderCall {
  userId: string;
  action?: string;
  eventType?: NotificationEventType;
  invoice?: unknown;
  locale?: string;
}

const buildInvoiceGeneratedCalls: CapturedBuilderCall[] = [];
const buildInvoiceStatusChangedCalls: CapturedBuilderCall[] = [];

const buildInvoiceGeneratedPayloadsMock = mock((userId: string, invoice: unknown, locale?: string) => {
  buildInvoiceGeneratedCalls.push({ userId, invoice, locale });
  return [
    { userId, channel: "on_app", eventType: NotificationEventType.INVOICE_GENERATED, title: "t", body: "b" },
    { userId, channel: "email", eventType: NotificationEventType.INVOICE_GENERATED, title: "t", body: "b" },
    { userId, channel: "sms", eventType: NotificationEventType.INVOICE_GENERATED, title: "t", body: "b" },
    { userId, channel: "push", eventType: NotificationEventType.INVOICE_GENERATED, title: "t", body: "b" },
  ];
});

const buildInvoiceStatusChangedPayloadsMock = mock(
  (userId: string, action: string, invoice: unknown, locale?: string) => {
    buildInvoiceStatusChangedCalls.push({ userId, action, invoice, locale });
    return [
      {
        userId,
        channel: "on_app",
        eventType: NotificationEventType.INVOICE_STATUS_CHANGED,
        title: "t",
        body: "b",
        metadata: { action },
      },
      {
        userId,
        channel: "email",
        eventType: NotificationEventType.INVOICE_STATUS_CHANGED,
        title: "t",
        body: "b",
        metadata: { action },
      },
      {
        userId,
        channel: "sms",
        eventType: NotificationEventType.INVOICE_STATUS_CHANGED,
        title: "t",
        body: "b",
        metadata: { action },
      },
      {
        userId,
        channel: "push",
        eventType: NotificationEventType.INVOICE_STATUS_CHANGED,
        title: "t",
        body: "b",
        metadata: { action },
      },
    ];
  }
);

mock.module("@/backend/services/notification/notification-payloads.builders", () => ({
  buildInvoiceGeneratedPayloads: buildInvoiceGeneratedPayloadsMock,
  buildInvoiceStatusChangedPayloads: buildInvoiceStatusChangedPayloadsMock,
}));

interface DispatchCall {
  payloads: unknown[];
  affectedUserIds: string[];
  locale?: string;
}

const dispatchCalls: DispatchCall[] = [];
const dispatchWithPreferencesMock = mock(async (payloads: unknown[], affectedUserIds: string[], locale?: string) => {
  dispatchCalls.push({ payloads, affectedUserIds, locale });
  // Simulate a successful multi-channel dispatch.
  const out: unknown[] = [];
  for (const p of payloads as Array<{ channel: string }>) {
    out.push({ channel: p.channel, success: true });
  }
  return out;
});

mock.module("@/backend/services/notification/notification-dispatch.helpers", () => ({
  dispatchWithPreferences: dispatchWithPreferencesMock,
}));

// --- Logger mock ---------------------------------------------------------

mock.module("@/backend/lib", () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(
      public readonly entity: string,
      message: string
    ) {
      super(message);
    }
  },
}));

// --- Locale mock (the service imports `@/shared/locale` for type-only) ---

mock.module("@/shared/locale", () => ({
  getServerTranslations: () => ({
    errorsTranslations: new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (typeof prop === "string") return () => prop;
          return undefined;
        },
      }
    ),
  }),
}));

// --- Proof-file helpers mock --------------------------------------------

mock.module("@/backend/services/billing/billing-payment-proof.helpers", () => ({
  assertInvoiceBelongsToParentUser: async () => undefined,
  validateProofFile: async () => ({ filePath: "uploads/proof.png", mimeType: "image/png" }),
  linkProofToInvoice: async () => undefined,
  recordProofPayment: async () => ({}),
  buildProofSnapshot: (fileId: string, filePath: string, mimeType: string, userId: string, at: string) => ({
    fileId,
    filePath,
    mimeType,
    submittedByUserId: userId,
    submittedAt: at,
  }),
  mapSubmissionToReturnType: (submission: unknown) => submission,
}));

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first).
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/billing/billing-management.service")> {
  return import("@/backend/services/billing/billing-management.service");
}

const tErrorsStub = new Proxy(
  {},
  {
    get: (_target, prop) => {
      if (typeof prop === "string") return () => prop;
      return undefined;
    },
  }
) as Record<string, () => string>;

function resetMocks(): void {
  buildInvoiceGeneratedCalls.length = 0;
  buildInvoiceStatusChangedCalls.length = 0;
  dispatchCalls.length = 0;

  buildInvoiceGeneratedPayloadsMock.mockClear();
  buildInvoiceStatusChangedPayloadsMock.mockClear();
  dispatchWithPreferencesMock.mockClear();

  createInvoiceMock.mockReset();
  createInvoiceMock.mockResolvedValue(mockInvoiceRow);
  createInvoiceCoverageMonthsMock.mockReset();
  createInvoiceCoverageMonthsMock.mockResolvedValue(undefined);
  getInvoiceByIdMock.mockReset();
  getInvoiceByIdMock.mockResolvedValue(mockInvoiceRow);
  setInvoicePaymentPendingMock.mockReset();
  setInvoicePaymentPendingMock.mockResolvedValue(mockPaymentPendingInvoice);
  markInvoiceAsPaidMock.mockReset();
  markInvoiceAsPaidMock.mockResolvedValue({ ...mockInvoiceRow, status: "PAID" });
  updateInvoiceStatusMock.mockReset();
  updateInvoiceStatusMock.mockResolvedValue({ ...mockInvoiceRow, status: "UNPAID" });

  createSubmissionMock.mockReset();
  createSubmissionMock.mockResolvedValue(undefined);
  updateSubmissionStatusMock.mockReset();
  updateSubmissionStatusMock.mockResolvedValue(undefined);
  rejectPendingForInvoiceMock.mockReset();
  rejectPendingForInvoiceMock.mockResolvedValue(undefined);
  getPendingByInvoiceIdMock.mockReset();
  getPendingByInvoiceIdMock.mockResolvedValue({
    id: SUBMISSION_ID,
    invoiceId: INVOICE_ID,
    fileId: PROOF_FILE_ID,
    submittedByUserId: PARENT_USER_ID,
    submittedAt: new Date(),
    status: "pending",
    reviewedByUserId: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  getLatestByInvoiceIdMock.mockReset();
  getLatestByInvoiceIdMock.mockResolvedValue(null);

  getParentProfileMock.mockReset();
  getParentProfileMock.mockResolvedValue({
    id: PARENT_ID,
    userId: PARENT_USER_ID,
    name: "Parent",
    email: "parent@test.com",
  });
  studentFindByIdMock.mockReset();
  studentFindByIdMock.mockResolvedValue({ id: STUDENT_ID, parentId: PARENT_ID });

  staffSelectRowsMock.mockReset();
  staffSelectRowsMock.mockReturnValue([{ userId: STAFF_USER_ID_A }, { userId: STAFF_USER_ID_B }]);
  unpaidInvoicesSelectMock.mockReset();
  unpaidInvoicesSelectMock.mockReturnValue([mockInvoiceRow, { ...mockInvoiceRow, id: "inv-rem-b" }]);

  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue(true);

  syncUnpaidNotificationsMock.mockReset();
  syncUnpaidNotificationsMock.mockResolvedValue({
    id: "unpaid-invoices-summary",
    totalOverdueInvoices: 0,
    totalOverdueAmount: "0.00",
    overdueAmountsByCurrency: [],
    items: [],
  });
}

// Shared assertion: the status-changed builder ran once for the parent with
// `action`, and dispatchWithPreferences emitted only INVOICE_STATUS_CHANGED
// payloads whose metadata.action matches. Used by the B4/B5/B6 tests.
function expectStatusChangedDispatchToParent(action: string): void {
  expect(buildInvoiceStatusChangedPayloadsMock).toHaveBeenCalledTimes(1);
  expect(buildInvoiceStatusChangedCalls[0]?.userId).toBe(PARENT_USER_ID);
  expect(buildInvoiceStatusChangedCalls[0]?.action).toBe(action);

  expect(dispatchWithPreferencesMock).toHaveBeenCalledTimes(1);
  expect(dispatchCalls[0]?.affectedUserIds).toEqual([PARENT_USER_ID]);
  const dispatched = dispatchCalls[0]?.payloads as Array<{
    eventType: NotificationEventType;
    metadata?: { action?: string };
  }>;
  expect(dispatched.every(p => p.eventType === NotificationEventType.INVOICE_STATUS_CHANGED)).toBe(true);
  expect(dispatched.every(p => p.metadata?.action === action)).toBe(true);
}

// Shared options literal for `createManualInvoice` invocations across the B1
// dispatch test, the F9 tray-summary test, and the dispatch-resilience test.
// Only `sendEmail` varies between them.
function createManualInvoiceInput(sendEmail: boolean | null) {
  return {
    parentId: PARENT_ID,
    studentId: null,
    amount: "100.00",
    currency: "SAR" as never,
    invoiceType: "MONTHLY" as never,
    issueDate: "2026-07-01",
    dueDate: "2026-07-31",
    exchangeRateSnapshot: null,
    exchangeRateSource: null,
    billingMonths: null,
    sendEmail,
  };
}

describe("BillingManagementService notification dispatch", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("B1 — createManualInvoice", () => {
    test("dispatches INVOICE_GENERATED to the parent via dispatchWithPreferences", async () => {
      const { BillingManagementService } = await importService();

      await BillingManagementService.createManualInvoice(
        ACTOR_ID,
        createManualInvoiceInput(null) as never,
        tErrorsStub as never,
        "en"
      );

      // Builder called once for the parent.
      expect(buildInvoiceGeneratedPayloadsMock).toHaveBeenCalledTimes(1);
      expect(buildInvoiceGeneratedCalls[0]?.userId).toEqual(PARENT_USER_ID);

      // Dispatch happens once, with the parent as the sole affected user.
      expect(dispatchWithPreferencesMock).toHaveBeenCalledTimes(1);
      const affectedUserIds = dispatchCalls[0]?.affectedUserIds;
      expect(affectedUserIds).toEqual([PARENT_USER_ID]);
      const dispatched = dispatchCalls[0]?.payloads as Array<{ eventType: NotificationEventType; channel: string }>;
      expect(dispatched.every(p => p.eventType === NotificationEventType.INVOICE_GENERATED)).toBe(true);
      // 4 channels emitted by builder.
      expect(dispatched).toHaveLength(4);
      expect(new Set(dispatched.map(p => p.channel))).toEqual(new Set(["on_app", "email", "sms", "push"]));
    });

    test("preserves the tray-summary syncUnpaidNotifications call (F9)", async () => {
      const { BillingManagementService } = await importService();

      await BillingManagementService.createManualInvoice(
        ACTOR_ID,
        createManualInvoiceInput(true) as never,
        tErrorsStub as never,
        "en"
      );

      // syncUnpaidNotifications must fire because sendEmail=true → tray-summary kept.
      expect(syncUnpaidNotificationsMock).toHaveBeenCalled();
    });
  });

  describe("B2 — sendPaymentReminder", () => {
    test("dispatches INVOICE_GENERATED for each unpaid invoice and keeps the tray-summary sync (F9)", async () => {
      const { BillingManagementService } = await importService();

      const result = await BillingManagementService.sendPaymentReminder(
        ACTOR_ID,
        STUDENT_ID,
        tErrorsStub as never,
        "en"
      );

      expect(result.success).toBe(true);
      expect(syncUnpaidNotificationsMock).toHaveBeenCalledTimes(1);

      // 2 invoices (returned by unpaidInvoicesSelectMock) → builder called twice.
      expect(buildInvoiceGeneratedPayloadsMock).toHaveBeenCalledTimes(2);

      // dispatchWithPreferences called once per unpaid invoice (parent fanout).
      expect(dispatchWithPreferencesMock).toHaveBeenCalledTimes(2);
      for (const call of dispatchCalls) {
        expect(call.affectedUserIds).toEqual([PARENT_USER_ID]);
        const dispatched = call.payloads as Array<{ eventType: NotificationEventType }>;
        expect(dispatched.every(p => p.eventType === NotificationEventType.INVOICE_GENERATED)).toBe(true);
      }
    });
  });

  describe("B3 — submitPaymentProof", () => {
    test("dispatches INVOICE_STATUS_CHANGED with action=proofSubmitted to all staff reviewers", async () => {
      const { BillingManagementService } = await importService();

      await BillingManagementService.submitPaymentProof(
        PARENT_USER_ID,
        INVOICE_ID,
        PROOF_FILE_ID,
        tErrorsStub as never,
        undefined,
        "en"
      );

      // Builder called once per staff reviewer (2 staff users mocked).
      expect(buildInvoiceStatusChangedPayloadsMock).toHaveBeenCalledTimes(2);
      const userIdsFromBuilder = buildInvoiceStatusChangedCalls.map(c => c.userId);
      expect(userIdsFromBuilder).toContain(STAFF_USER_ID_A);
      expect(userIdsFromBuilder).toContain(STAFF_USER_ID_B);
      expect(buildInvoiceStatusChangedCalls.every(c => c.action === "proofSubmitted")).toBe(true);

      // dispatchWithPreferences called once with the staff fanout.
      expect(dispatchWithPreferencesMock).toHaveBeenCalledTimes(1);
      expect(dispatchCalls[0]?.affectedUserIds).toEqual([STAFF_USER_ID_A, STAFF_USER_ID_B]);
      const dispatched = dispatchCalls[0]?.payloads as Array<{
        userId: string;
        eventType: NotificationEventType;
        metadata?: { action?: string };
      }>;
      // 2 staff × 4 channels = 8 payloads.
      expect(dispatched).toHaveLength(8);
      expect(dispatched.every(p => p.eventType === NotificationEventType.INVOICE_STATUS_CHANGED)).toBe(true);
      expect(dispatched.every(p => p.metadata?.action === "proofSubmitted")).toBe(true);
    });
  });

  describe("B4 — approvePaymentProof", () => {
    test("dispatches INVOICE_STATUS_CHANGED with action=proofApproved to the parent", async () => {
      const { BillingManagementService } = await importService();
      getInvoiceByIdMock.mockResolvedValue(mockPaymentPendingInvoice);

      await BillingManagementService.approvePaymentProof(ACTOR_ID, INVOICE_ID, tErrorsStub as never, undefined, "en");

      expectStatusChangedDispatchToParent("proofApproved");
    });
  });

  describe("B5 — rejectPaymentProof", () => {
    test("dispatches INVOICE_STATUS_CHANGED with action=proofRejected to the parent", async () => {
      const { BillingManagementService } = await importService();
      getInvoiceByIdMock.mockResolvedValue(mockPaymentPendingInvoice);

      await BillingManagementService.rejectPaymentProof(
        ACTOR_ID,
        INVOICE_ID,
        tErrorsStub as never,
        "Bad file",
        undefined,
        "en"
      );

      expectStatusChangedDispatchToParent("proofRejected");
    });
  });

  describe("B6 — markInvoicePaid", () => {
    test("dispatches INVOICE_STATUS_CHANGED with action=markedPaid to the parent", async () => {
      const { BillingManagementService } = await importService();

      await BillingManagementService.markInvoicePaid(
        ACTOR_ID,
        INVOICE_ID,
        PROOF_FILE_ID,
        tErrorsStub as never,
        undefined,
        "en"
      );

      expectStatusChangedDispatchToParent("markedPaid");
    });
  });

  describe("dispatch resilience (specs.md B1-B6 — failures must NOT throw out of the action)", () => {
    test("createManualInvoice returns its result even if dispatchWithPreferences rejects", async () => {
      const { BillingManagementService } = await importService();
      dispatchWithPreferencesMock.mockRejectedValueOnce(new Error("dispatch boom"));

      const result = await BillingManagementService.createManualInvoice(
        ACTOR_ID,
        createManualInvoiceInput(null) as never,
        tErrorsStub as never,
        "en"
      );

      expect(result.id).toBe(mockInvoiceRow.id);
    });
  });
});
