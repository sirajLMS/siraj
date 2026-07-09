import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission, InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import type { UserBillingProfileViewProps } from "@/frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types";
import { UserBillingProfileView } from "@/frontend/views/dashboard/users/billing-profile/UserBillingProfileView";
import type { BillingLabels } from "@/shared/messages/types/dashboard/billing";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
  mockMediaQuery(false);
});

const mockLabels: BillingLabels = {
  adminPageTitle: "Billing Management",
  adminPageSubtitle: "Financial Overview & Transaction Records",
  parentPageTitle: "Invoices & Billing",
  parentPageSubtitle: "Track and download your institutional billing records.",
  manualInvoice: "Manual Invoice",
  quickPay: "Quick Pay",
  viewAllNegativeBalance: "View All Students with Negative Balance",
  requiresAttention: "Requires Attention",
  showingResults: "Showing {shown} of {total} results",
  invalidUserId: "Invalid User ID",
  billingProfileTitle: "User Billing Profile",
  profileForUser: "Billing profile details for user {userId}",
  reminderSent: "Payment reminder sent",
  adminMetrics: {
    totalOutstanding: "Total Outstanding",
    pendingInvoices: "Pending Invoices",
    negativeBalance: "Negative Balance",
    mtdRevenue: "MTD Revenue",
  },
  parentMetrics: {
    outstandingBalance: "Outstanding Balance",
    paidThisTerm: "Paid this Term",
    nextDueDate: "Next Due Date",
    activeStudents: "Active Students",
  },
  sections: {
    recentInvoices: "Recent Invoices",
    studentCreditStatus: "Student Credit Status",
    invoiceHistory: "Invoice History",
    invoiceHistorySubtitle: "Track and download your institutional billing records.",
  },
  search: {
    invoicesPlaceholder: "Search invoices...",
    parentPlaceholder: "Search by ID...",
    filter: "Filters",
  },
  adminTable: {
    invoiceId: "Invoice ID",
    studentName: "Student Name",
    dateIssued: "Date Issued",
    amount: "Amount",
    status: "Status",
    actions: "Actions",
    markAsPaid: "Mark as Paid",
    quickPay: "Quick Pay",
    noEntries: "No invoices match your search",
  },
  creditTable: {
    student: "Student",
    parentContact: "Parent Contact",
    planType: "Plan Type",
    classesLeft: "Classes Left",
    status: "Status",
    quickAction: "Quick Action",
    sendReminder: "Send Reminder",
    negativeBalance: "Negative Balance",
    activeCredit: "Active Credit",
    noEntries: "No student credit records found",
  },
  parentTable: {
    invoiceNumber: "#",
    month: "Month",
    issueDate: "Issue Date",
    dueDate: "Due Date",
    paidDate: "Paid Date",
    fee: "Fee",
    status: "Status",
    options: "Options",
    viewDetails: "View Details",
    downloadPdf: "Download PDF",
    payNow: "Pay Now",
    noEntries: "No invoices match your search",
    emptyTitle: "You don't have invoices.",
    emptySubtitle: "Any upcoming billing cycles will appear here automatically.",
  },
  invoiceStatus: {
    OVERDUE: "Overdue",
    PENDING: "Pending",
    PAID: "Paid",
    UNPAID: "Unpaid",
    CANCELLED: "Cancelled",
  },
  creditStatus: {
    negative_balance: "Negative Balance",
    active_credit: "Active Credit",
  },
  manual: {
    pageTitle: "Create Manual Invoice",
    pageSubtitle: "Generate one-off fee records for institutional billing.",
    backToFinancials: "Back to Financials",
    parentSelection: "Parent Selection",
    parentPlaceholder: "Select a parent record...",
    studentSelection: "Student Selection",
    feeAmount: "Fee Amount (AED)",
    feeAmountPlaceholder: "0.00",
    issueDate: "Issue Date",
    dueDate: "Due Date",
    billingMonths: "Select Billing Months",
    billingMonthsMobile: "Billing Period (Months)",
    summaryTitle: "Invoice Summary",
    summarySubtitle: "Tax will be calculated automatically based on the selected fee amount.",
    totalDraftValue: "Total Draft Value",
    submit: "Submit",
    submitAndSendEmail: "Submit & Send Email",
    successMessage: "Manual invoice submitted successfully.",
    createSuccess: "Invoice {id} created successfully",
    months: {
      jan: "January",
      feb: "February",
      mar: "March",
      apr: "April",
      may: "May",
      jun: "June",
      jul: "July",
      aug: "August",
      sep: "September",
      oct: "October",
      nov: "November",
      dec: "December",
    },
    validation: {
      parentRequired: "Please select a parent",
      feeAmountRequired: "Fee amount is required",
      feeAmountPositive: "Fee must be greater than zero",
      issueDateRequired: "Issue date is required",
      dueDateRequired: "Due date is required",
      billingMonthsRequired: "Select at least one billing month",
      dueDateBeforeIssueDate: "Due date must be after issue date",
    },
    support: {
      secureBilling: { title: "Secure Billing", body: "Your data is protected" },
      automatedLedgers: { title: "Automated Ledgers", body: "Auto-updated records" },
      draftMode: { title: "Draft Mode", body: "Save before submitting" },
    },
  },
  markAsPaidSuccess: "Invoice marked as paid",
  deleteInvoiceSuccess: "Invoice deleted",
  noUnpaidInvoices: "No unpaid invoices to pay",
  errors: {
    invalidId: "Invalid ID",
  },
  paymentMethodSelector: {
    bank_account: "Bank Account",
    paypal: "PayPal",
    label: "Payment Method",
  },
  paymentStatusBadge: {
    paid: "Paid",
    pending: "Pending",
    unpaid: "Unpaid",
    overdue: "Overdue",
    cancelled: "Cancelled",
    refunded: "Refunded",
  },
  paymentSummaryCard: {
    amount: "Amount",
    date: "Date",
    paymentMethod: "Payment Method",
  },
};

const baseProps: UserBillingProfileViewProps = {
  labels: mockLabels,
  summary: {
    outstandingBalance: "$0.00",
    paidThisTerm: "$0.00",
    nextDueDate: "",
    activeStudents: "0",
  },
  metrics: [],
  invoices: [],
  searchQuery: "",
  canManage: false,
  canView: true,
  canCreate: false,
  onSearchChange: () => {},
  onPayNow: () => {},
  onDownloadPdf: () => {},
  onQuickPay: () => {},
  page: 0,
  pageSize: 10,
  totalCount: 0,
  onPageChange: () => {},
  loading: false,
};

let mediaQueryResult = false;

const MockIcon = Object.assign(() => null as React.ReactElement | null, {
  muiName: "SvgIcon",
}) as unknown as import("@mui/icons-material").SvgIconComponent;

function mockMediaQuery(isMobile: boolean) {
  mediaQueryResult = isMobile;
}

mock.module("@mui/material", async () => {
  const actual = await import("@mui/material");
  return {
    ...actual,
    useMediaQuery: () => mediaQueryResult,
  };
});

describe("UserBillingProfileView", () => {
  test("renders nothing when unauthorized", () => {
    renderWithWrapper(<UserBillingProfileView {...baseProps} />, {
      locale: "en",
      permissions: [],
    });

    expect(screen.queryByText("User Billing Profile")).toBeNull();
  });

  test("renders loading state", () => {
    mockMediaQuery(false);

    renderWithWrapper(<UserBillingProfileView {...baseProps} loading={true} />, {
      locale: "en",
      permissions: [AppPermission.BillingViewHistory],
    });

    expect(screen.getByText("User Billing Profile")).toBeVisible();
  });

  test("renders empty invoices on mobile view", () => {
    mockMediaQuery(true);

    renderWithWrapper(<UserBillingProfileView {...baseProps} invoices={[]} totalCount={0} />, {
      locale: "en",
      permissions: [AppPermission.BillingViewHistory],
    });

    expect(screen.getByText("You don't have invoices.")).toBeVisible();
    expect(screen.getByText("Any upcoming billing cycles will appear here automatically.")).toBeVisible();
  });

  test("renders metrics from summary data", () => {
    mockMediaQuery(false);

    const propsWithSummary: UserBillingProfileViewProps = {
      ...baseProps,
      summary: {
        outstandingBalance: "$500.00",
        paidThisTerm: "$1,200.00",
        nextDueDate: "Jul 15, 2026",
        activeStudents: "3",
      },
      metrics: [
        { key: "outstanding-balance", label: "Outstanding Balance", value: "$500.00", icon: MockIcon },
        { key: "paid-this-term", label: "Paid this Term", value: "$1,200.00", icon: MockIcon, variant: "highlight" },
        { key: "next-due-date", label: "Next Due Date", value: "Jul 15, 2026", icon: MockIcon },
        { key: "active-students", label: "Active Students", value: "3", icon: MockIcon },
      ],
    };

    renderWithWrapper(<UserBillingProfileView {...propsWithSummary} />, {
      locale: "en",
      permissions: [AppPermission.BillingViewHistory],
    });

    expect(screen.getByText("$500.00")).toBeVisible();
    expect(screen.getByText("$1,200.00")).toBeVisible();
    expect(screen.getByText("Jul 15, 2026")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
  });

  test("renders invoices in data grid", () => {
    mockMediaQuery(false);

    const propsWithInvoices: UserBillingProfileViewProps = {
      ...baseProps,
      invoices: [
        {
          id: "inv-1",
          invoiceNumber: "INV-001",
          month: "June",
          issueDate: "2026-06-01",
          dueDate: "2026-06-30",
          paidDate: "—",
          fee: "USD 500.00",
          status: InvoiceStatus.Unpaid,
        },
        {
          id: "inv-2",
          invoiceNumber: "INV-002",
          month: "May",
          issueDate: "2026-05-01",
          dueDate: "2026-05-31",
          paidDate: "2026-05-28",
          fee: "USD 450.00",
          status: InvoiceStatus.Paid,
        },
      ],
      totalCount: 2,
    };

    renderWithWrapper(<UserBillingProfileView {...propsWithInvoices} />, {
      locale: "en",
      permissions: [AppPermission.BillingViewHistory],
    });

    expect(screen.getByText("INV-001")).toBeVisible();
    expect(screen.getByText("INV-002")).toBeVisible();
  });

  test("calls onSearchChange when search input changes", () => {
    mockMediaQuery(false);

    const onSearchChange = mock(() => {});

    renderWithWrapper(<UserBillingProfileView {...baseProps} onSearchChange={onSearchChange} />, {
      locale: "en",
      permissions: [AppPermission.BillingViewHistory],
    });

    const searchInput = screen.getByPlaceholderText("Search by ID...");
    fireEvent.change(searchInput, { target: { value: "INV-001" } });

    expect(onSearchChange).toHaveBeenCalledWith("INV-001");
  });

  function renderInvoiceView(isMobile: boolean) {
    mockMediaQuery(isMobile);

    const propsWithInvoices: UserBillingProfileViewProps = {
      ...baseProps,
      invoices: [
        {
          id: "inv-1",
          invoiceNumber: "INV-100",
          month: "June",
          issueDate: "2026-06-01",
          dueDate: "2026-06-30",
          paidDate: "—",
          fee: "USD 300.00",
          status: InvoiceStatus.Unpaid,
        },
      ],
      totalCount: 1,
    };

    renderWithWrapper(<UserBillingProfileView {...propsWithInvoices} />, {
      locale: "en",
      permissions: [AppPermission.BillingViewHistory],
    });
  }

  test("renders desktop view on large screens", () => {
    renderInvoiceView(false);

    expect(screen.getByText("Invoice History")).toBeVisible();
    expect(screen.getByRole("grid")).toBeVisible();
  });

  test("renders mobile view on small screens", () => {
    renderInvoiceView(true);

    expect(screen.getByText("Invoice History")).toBeVisible();
    expect(screen.getByText("INV-100")).toBeVisible();
    expect(screen.queryByRole("grid")).toBeNull();
  });
});
