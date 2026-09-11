import { beforeEach, describe, expect, mock, test } from "bun:test";
import { AppPermission } from "@/backend/enum";
import type { ErrorsLabels } from "@/shared/locale";

const PARENT_ID_1 = "parent-id-1111-1111-1111";
const PARENT_ID_2 = "parent-id-2222-2222-2222";
const USER_ID_1 = "user-id-1111-1111-1111";
const USER_ID_2 = "user-id-2222-2222-2222";
const ADMIN_USER_ID = "admin-user-id-3333-3333";
const SUPER_ADMIN_USER_ID = "super-admin-id-4444-4444";

const mockParentByUserId: Record<string, { id: string; userId: string } | null> = {
  [USER_ID_1]: { id: PARENT_ID_1, userId: USER_ID_1 },
  [USER_ID_2]: { id: PARENT_ID_2, userId: USER_ID_2 },
};

const findByUserIdMock = mock(async (userId: string) => {
  return mockParentByUserId[userId] ?? null;
});

const getInvoicesForParentMock = mock(async (_parentId: string) => ({
  rows: [],
  totalCount: 0,
  pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
}));

const getParentBillingSummaryMock = mock(async (parentId: string) => ({
  id: `parent-billing-summary-${parentId}`,
}));

const hasPermissionMock = mock(async () => true);

const getUserContextMock = mock(async (userId: string) => {
  if (userId === SUPER_ADMIN_USER_ID) {
    return {
      isSuperAdmin: true,
      permissions: [AppPermission.BILLING_VIEW_HISTORY, AppPermission.BILLING_VIEW_UNPAID_INVOICES],
    };
  }
  if (userId === ADMIN_USER_ID) {
    return {
      isSuperAdmin: false,
      permissions: [AppPermission.BILLING_VIEW_HISTORY, AppPermission.BILLING_VIEW_UNPAID_INVOICES],
    };
  }
  return {
    isSuperAdmin: false,
    permissions: [AppPermission.BILLING_VIEW_HISTORY],
  };
});

await mock.module("@/backend/db/repo/parents", () => ({
  ParentRepository: {
    findByUserId: findByUserIdMock,
  },
}));

await mock.module("@/backend/db/repo/billing", () => ({
  BillingRepository: {
    getInvoicesForParent: getInvoicesForParentMock,
    getParentBillingSummary: getParentBillingSummaryMock,
  },
}));

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
    getUserContext: getUserContextMock,
  },
}));

await mock.module("@/backend/services", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
    getUserContext: getUserContextMock,
  },
}));

function assertIsErrorsLabels(value: unknown): asserts value is ErrorsLabels {
  if (value === null || typeof value !== "object") {
    throw new Error("tErrorsStub must be an object");
  }
}

function createErrorsStub(): ErrorsLabels {
  const stub: unknown = {
    insufficientPermissions: "Insufficient permissions",
    billing: {
      parentNotFound: "Parent not found",
    },
  };
  assertIsErrorsLabels(stub);
  return stub;
}

const tErrorsStub = createErrorsStub();

async function importService() {
  return import("@/backend/services/billing/billing-history.service");
}

async function expectThrowsAsync(fn: () => Promise<unknown>, expectedSubstring: string): Promise<void> {
  let errorCaught: Error | null = null;
  try {
    await fn();
  } catch (e) {
    errorCaught = e instanceof Error ? e : new Error(String(e));
  }
  expect(errorCaught).not.toBeNull();
  expect(errorCaught?.message).toContain(expectedSubstring);
}

describe("BillingHistoryService IDOR protection", () => {
  beforeEach(() => {
    findByUserIdMock.mockClear();
    getInvoicesForParentMock.mockClear();
    getParentBillingSummaryMock.mockClear();
    hasPermissionMock.mockClear();
    getUserContextMock.mockClear();
  });

  async function verifyParentInvoiceHistory(options: {
    actorUserId: string;
    targetParentId: string | null;
    targetUserId: string;
    expectedParentId: string;
  }): Promise<void> {
    const { BillingHistoryService } = await importService();
    const result = await BillingHistoryService.getParentInvoiceHistory(
      options.actorUserId,
      options.targetParentId,
      options.targetUserId,
      tErrorsStub
    );
    expect(result.id).toBe(`parent-invoice-history-${options.expectedParentId}`);
    expect(getInvoicesForParentMock).toHaveBeenCalledWith(options.expectedParentId, null, null);
  }

  async function verifyParentBillingSummary(options: {
    actorUserId: string;
    targetParentId: string | null;
    targetUserId: string;
    expectedParentId: string;
  }): Promise<void> {
    const { BillingHistoryService } = await importService();
    const result = await BillingHistoryService.getParentBillingSummary(
      options.actorUserId,
      options.targetParentId,
      options.targetUserId,
      tErrorsStub
    );
    expect(result.id).toBe(`parent-billing-summary-${options.expectedParentId}`);
    expect(getParentBillingSummaryMock).toHaveBeenCalledWith(options.expectedParentId);
  }

  describe("getParentInvoiceHistory", () => {
    test("allows a parent to fetch their own invoice history", async () => {
      await verifyParentInvoiceHistory({
        actorUserId: USER_ID_1,
        targetParentId: PARENT_ID_1,
        targetUserId: USER_ID_1,
        expectedParentId: PARENT_ID_1,
      });
    });

    test("allows a parent to fetch their history without parentId explicit (resolved via fallbackUserId)", async () => {
      await verifyParentInvoiceHistory({
        actorUserId: USER_ID_1,
        targetParentId: null,
        targetUserId: USER_ID_1,
        expectedParentId: PARENT_ID_1,
      });
    });

    test("prevents cross-tenant IDOR when non-admin parent requests another parent's invoice history", async () => {
      const { BillingHistoryService } = await importService();
      await expectThrowsAsync(
        () => BillingHistoryService.getParentInvoiceHistory(USER_ID_1, PARENT_ID_2, USER_ID_1, tErrorsStub),
        "Insufficient permissions"
      );
      expect(getInvoicesForParentMock).not.toHaveBeenCalled();
    });

    test("allows admin with BILLING_VIEW_UNPAID_INVOICES to fetch another parent's invoice history", async () => {
      await verifyParentInvoiceHistory({
        actorUserId: ADMIN_USER_ID,
        targetParentId: PARENT_ID_2,
        targetUserId: USER_ID_2,
        expectedParentId: PARENT_ID_2,
      });
    });

    test("allows super admin to fetch any parent's invoice history", async () => {
      await verifyParentInvoiceHistory({
        actorUserId: SUPER_ADMIN_USER_ID,
        targetParentId: PARENT_ID_2,
        targetUserId: USER_ID_2,
        expectedParentId: PARENT_ID_2,
      });
    });
  });

  describe("getParentBillingSummary", () => {
    test("allows a parent to fetch their own billing summary", async () => {
      await verifyParentBillingSummary({
        actorUserId: USER_ID_1,
        targetParentId: PARENT_ID_1,
        targetUserId: USER_ID_1,
        expectedParentId: PARENT_ID_1,
      });
    });

    test("prevents cross-tenant IDOR when non-admin parent requests another parent's billing summary", async () => {
      const { BillingHistoryService } = await importService();
      await expectThrowsAsync(
        () => BillingHistoryService.getParentBillingSummary(USER_ID_1, PARENT_ID_2, USER_ID_1, tErrorsStub),
        "Insufficient permissions"
      );
      expect(getParentBillingSummaryMock).not.toHaveBeenCalled();
    });

    test("allows admin with BILLING_VIEW_UNPAID_INVOICES to fetch another parent's billing summary", async () => {
      await verifyParentBillingSummary({
        actorUserId: ADMIN_USER_ID,
        targetParentId: PARENT_ID_2,
        targetUserId: USER_ID_2,
        expectedParentId: PARENT_ID_2,
      });
    });
  });
});
