import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/billing");

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { AdminInvoiceRow } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import {
  AdminInvoicesDataGridDesktop,
  type AdminInvoicesDataGridLabels,
} from "@/frontend/desktop/views/dashboard/admin/billing/components/adminInvoicesDataGrid.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

const locale: AppLocale = "en";

/** Pager chrome translations (next/previous page tooltips) come from the Admin namespace. */
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);

const fixtureLabels: AdminInvoicesDataGridLabels = {
  invoiceId: "Fixture Invoice",
  studentName: "Fixture Student",
  dateIssued: "Fixture Date Issued",
  amount: "Fixture Amount",
  status: "Fixture Status",
  actions: "Fixture Actions",
  markAsPaid: "Fixture Mark as Paid",
  quickPay: "Fixture Quick Pay",
  reviewSubmission: "Fixture Review Submission",
  viewRejection: "Fixture View Rejection",
  viewDetails: "Fixture View Details",
  deleteInvoice: "Fixture Delete Invoice",
  noEntries: "Fixture No Entries",
  statusLabels: {
    UNPAID: "Fixture Unpaid",
    PENDING: "Fixture Pending",
    PAID: "Fixture Paid",
    CANCELLED: "Fixture Cancelled",
    OVERDUE: "Fixture Overdue",
    PAYMENT_PENDING: "Fixture Payment Pending",
  },
};

function makeInvoiceRow(overrides: Partial<AdminInvoiceRow> = {}): AdminInvoiceRow {
  return {
    id: "inv-1",
    studentId: "student-1",
    studentName: "Ahmed Fixture",
    studentInitials: "AF",
    dateIssued: "Fixture 1 Jan",
    dueDate: "Fixture 15 Jan",
    amount: "100.00",
    status: "UNPAID",
    parentUserId: "parent-1",
    hasPaymentProof: false,
    hasRejectedSubmission: false,
    ...overrides,
  };
}

function renderGrid(overrides: Partial<Parameters<typeof AdminInvoicesDataGridDesktop>[0]> = {}) {
  const onMarkAsPaid = mock(() => {});
  return render(
    <AdminInvoicesDataGridDesktop
      rows={[makeInvoiceRow(), makeInvoiceRow({ id: "inv-2", studentName: "Sara Fixture" })]}
      labels={fixtureLabels}
      canManage
      onMarkAsPaid={onMarkAsPaid}
      {...overrides}
    />,
    {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <TestWrapper locale={locale}>{children}</TestWrapper>
      ),
    }
  );
}

afterEach(() => {
  cleanup();
});

describe("AdminInvoicesDataGridDesktop pagination ownership", () => {
  test("passes server paginationOptions (buildServerPaginationOptions) to the grid when server paging inputs are provided", async () => {
    const onPageChange = mock((_page: number) => {});
    const { container } = renderGrid({ page: 0, pageSize: 10, totalCount: 25, onPageChange });

    await waitFor(
      () => {
        expect(container.querySelector(".MuiDataGrid-footerContainer")).not.toBeNull();
      },
      { timeout: 5000 }
    );

    // Both caller-owned rows stay visible — the grid must not slice rows itself in server mode.
    expect(screen.getByText("Ahmed Fixture")).toBeInTheDocument();
    expect(screen.getByText("Sara Fixture")).toBeInTheDocument();

    const nextButton = container.querySelector(`[aria-label="${adminLabels.nextPage}"] button`);
    if (!nextButton) {
      throw new Error("next page button not found in grid pager");
    }
    expect(nextButton.closest("button")).not.toBeDisabled();

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  test("falls back to client pagination when server paging inputs are absent", async () => {
    const { container } = renderGrid();

    await waitFor(
      () => {
        expect(container.querySelector(".MuiDataGrid-footerContainer")).not.toBeNull();
      },
      { timeout: 5000 }
    );

    // Two rows fit on one client page — the next-page control stays disabled.
    const nextButton = container.querySelector(`[aria-label="${adminLabels.nextPage}"] button`);
    if (!nextButton) {
      throw new Error("next page button not found in grid pager");
    }
    expect(nextButton.closest("button")).toBeDisabled();
  });
});
