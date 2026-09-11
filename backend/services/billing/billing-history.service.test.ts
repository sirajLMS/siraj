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
  parentId,
  totalInvoices: 0,
  totalUnpaidInvoices: 0,
  totalPaidInvoices: 0,
  totalOverdueInvoices: 0,
  totalAmountInvoiced: "0.00",
  totalAmountPaid: "0.00",
  totalAmountUnpaid: "0.00",
  totalAmountOverdue: "0.00",
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

const tErrorsStub: ErrorsLabels = {
  insufficientPermissions: "Insufficient permissions",
  billing: {
    parentNotFound: "Parent not found",
  },
} as unknown as ErrorsLabels;

async function importService() {
  return import("@/backend/services/billing/billing-history.service");
}

describe("BillingHistoryService IDOR protection", () => {
  beforeEach(() => {
    findByUserIdMock.mockClear();
    getInvoicesForParentMock.mockClear();
    getParentBillingSummaryMock.mockClear();
    hasPermissionMock.mockClear();
    getUserContextMock.mockClear();
  });

  describe("getParentInvoiceHistory", () => {
    test("allows a parent to fetch their own invoice history", async () => {
      const { BillingHistoryService } = await importService();
      const result = await BillingHistoryService.getParentInvoiceHistory(
        USER_ID_1,
        PARENT_ID_1,
        USER_ID_1,
        tErrorsStub
      );
      expect(result.id).toBe(`parent-invoice-history-${PARENT_ID_1}`);
      expect(getInvoicesForParentMock).toHaveBeenCalledWith(PARENT_ID_1, null, null);
    });

    test("allows a parent to fetch their history without parentId explicit (resolved via fallbackUserId)", async () => {
      const { BillingHistoryService } = await importService();
      const result = await BillingHistoryService.getParentInvoiceHistory(USER_ID_1, null, USER_ID_1, tErrorsStub);
      expect(result.id).toBe(`parent-invoice-history-${PARENT_ID_1}`);
      expect(getInvoicesForParentMock).toHaveBeenCalledWith(PARENT_ID_1, null, null);
    });

    test("prevents cross-tenant IDOR when non-admin parent requests another parent's invoice history", async () => {
      const { BillingHistoryService } = await importService();
      expect(
        BillingHistoryService.getParentInvoiceHistory(USER_ID_1, PARENT_ID_2, USER_ID_1, tErrorsStub)
      ).rejects.toThrow("Insufficient permissions");
      expect(getInvoicesForParentMock).not.toHaveBeenCalled();
    });

    test("allows admin with BILLING_VIEW_UNPAID_INVOICES to fetch another parent's invoice history", async () => {
      const { BillingHistoryService } = await importService();
      const result = await BillingHistoryService.getParentInvoiceHistory(
        ADMIN_USER_ID,
        PARENT_ID_2,
        USER_ID_2,
        tErrorsStub
      );
      expect(result.id).toBe(`parent-invoice-history-${PARENT_ID_2}`);
      expect(getInvoicesForParentMock).toHaveBeenCalledWith(PARENT_ID_2, null, null);
    });

    test("allows super admin to fetch any parent's invoice history", async () => {
      const { BillingHistoryService } = await importService();
      const result = await BillingHistoryService.getParentInvoiceHistory(
        SUPER_ADMIN_USER_ID,
        PARENT_ID_2,
        USER_ID_2,
        tErrorsStub
      );
      expect(result.id).toBe(`parent-invoice-history-${PARENT_ID_2}`);
      expect(getInvoicesForParentMock).toHaveBeenCalledWith(PARENT_ID_2, null, null);
    });
  });

  describe("getParentBillingSummary", () => {
    test("allows a parent to fetch their own billing summary", async () => {
      const { BillingHistoryService } = await importService();
      const result = await BillingHistoryService.getParentBillingSummary(
        USER_ID_1,
        PARENT_ID_1,
        USER_ID_1,
        tErrorsStub
      );
      expect(result.parentId).toBe(PARENT_ID_1);
      expect(getParentBillingSummaryMock).toHaveBeenCalledWith(PARENT_ID_1);
    });

    test("prevents cross-tenant IDOR when non-admin parent requests another parent's billing summary", async () => {
      const { BillingHistoryService } = await importService();
      expect(
        BillingHistoryService.getParentBillingSummary(USER_ID_1, PARENT_ID_2, USER_ID_1, tErrorsStub)
      ).rejects.toThrow("Insufficient permissions");
      expect(getParentBillingSummaryMock).not.toHaveBeenCalled();
    });

    test("allows admin with BILLING_VIEW_UNPAID_INVOICES to fetch another parent's billing summary", async () => {
      const { BillingHistoryService } = await importService();
      const result = await BillingHistoryService.getParentBillingSummary(
        ADMIN_USER_ID,
        PARENT_ID_2,
        USER_ID_2,
        tErrorsStub
      );
      expect(result.parentId).toBe(PARENT_ID_2);
      expect(getParentBillingSummaryMock).toHaveBeenCalledWith(PARENT_ID_2);
    });
  });
});
