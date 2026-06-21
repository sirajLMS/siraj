import { mock } from "bun:test";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: mock(() => {}), back: mock(() => {}), forward: mock(() => {}) }),
  useParams: () => ({ locale: "en" }),
  usePathname: () => "/en/dashboard",
}));

import { afterEach, describe, expect, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { unpaidInvoicesAlertQueryDocument } from "@/frontend/graphql/sharedDocuments/billing-alerts.documents";
import { notificationAlertsQueryDocument } from "@/frontend/graphql/sharedDocuments/notification-alerts.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { NotificationPanel } from "@/frontend/views/dashboard/components/navbar/NotificationPanel";
import { renderWithWrapper } from "./TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

const mockAlertsData = {
  notificationAlerts: {
    id: "notification-alerts-user-1",
    totalCount: 2,
    unreadCount: 1,
    alerts: [
      {
        id: "complaint-1",
        type: "complaint",
        title: "New Unanswered Complaint",
        body: "This is a complaint body text for testing purposes.",
        createdAt: "2026-06-20T10:00:00.000Z",
        severity: "warning",
      },
      {
        id: "notification-1",
        type: "notification",
        title: "System Update",
        body: "System maintenance scheduled for tonight.",
        createdAt: "2026-06-19T14:00:00.000Z",
        severity: "info",
      },
    ],
  },
};

const mockEmptyAlertsData = {
  notificationAlerts: {
    id: "notification-alerts-user-1",
    totalCount: 0,
    unreadCount: 0,
    alerts: [],
  },
};

const mockBillingData = {
  unpaidInvoicesAlert: {
    id: "unpaid-invoices-summary",
    totalOverdueInvoices: 2,
    totalOverdueAmount: "1500.00",
    items: [
      {
        id: "parent-1",
        userId: "user-1",
        userName: "Ahmed Mohamed",
        userEmail: "ahmed@example.com",
        totalUnpaidAmount: "1000.00",
        currency: "EGP",
        overdueCount: 2,
        oldestDueDate: "2026-05-01",
      },
    ],
  },
};

const mockEmptyBillingData = {
  unpaidInvoicesAlert: {
    id: "unpaid-invoices-summary",
    totalOverdueInvoices: 0,
    totalOverdueAmount: "0.00",
    items: [],
  },
};

function createMocks(alertsData = mockAlertsData, billingData = mockBillingData): MockLink.MockedResponse[] {
  return [
    {
      request: { query: notificationAlertsQueryDocument },
      result: { data: alertsData },
    },
    {
      request: { query: unpaidInvoicesAlertQueryDocument },
      result: { data: billingData },
    },
  ];
}

describe("NotificationPanel", () => {
  test("shows loading spinner while fetching alerts", () => {
    const mocks: MockLink.MockedResponse[] = [
      {
        request: { query: notificationAlertsQueryDocument },
        delay: 1000,
        result: { data: mockAlertsData },
      },
      {
        request: { query: unpaidInvoicesAlertQueryDocument },
        delay: 1000,
        result: { data: mockBillingData },
      },
    ];

    renderWithWrapper(<NotificationPanel />, {
      locale: "en",
      permissions: [AppPermission.NotificationViewAlerts, AppPermission.BillingViewUnpaidInvoices],
      mocks,
    });

    expect(screen.getByRole("progressbar")).toBeVisible();
  });

  test("renders alerts list when data loads", async () => {
    renderWithWrapper(<NotificationPanel />, {
      locale: "en",
      permissions: [AppPermission.NotificationViewAlerts, AppPermission.BillingViewUnpaidInvoices],
      mocks: createMocks(),
    });

    const complaintTitle = await screen.findByText("New Unanswered Complaint");
    expect(complaintTitle).toBeVisible();

    const notificationTitle = await screen.findByText("System Update");
    expect(notificationTitle).toBeVisible();
  });

  test("shows error message when query fails", async () => {
    const mocks: MockLink.MockedResponse[] = [
      {
        request: { query: notificationAlertsQueryDocument },
        error: new Error("Network error"),
      },
      {
        request: { query: unpaidInvoicesAlertQueryDocument },
        result: { data: mockBillingData },
      },
    ];

    renderWithWrapper(<NotificationPanel />, {
      locale: "en",
      permissions: [AppPermission.NotificationViewAlerts, AppPermission.BillingViewUnpaidInvoices],
      mocks,
    });

    const errorMsg = await screen.findByText("Failed to load notifications.");
    expect(errorMsg).toBeVisible();
  });

  test("renders empty state when no alerts", async () => {
    renderWithWrapper(<NotificationPanel />, {
      locale: "en",
      permissions: [AppPermission.NotificationViewAlerts, AppPermission.BillingViewUnpaidInvoices],
      mocks: createMocks(mockEmptyAlertsData, mockEmptyBillingData),
    });

    const noAlertsMsg = await screen.findByText("No alerts at this time.");
    expect(noAlertsMsg).toBeVisible();
  });

  test("renders billing section when user has BillingViewUnpaidInvoices", async () => {
    renderWithWrapper(<NotificationPanel />, {
      locale: "en",
      permissions: [AppPermission.NotificationViewAlerts, AppPermission.BillingViewUnpaidInvoices],
      mocks: createMocks(),
    });

    const billingTitle = await screen.findByText("Unpaid Invoices");
    expect(billingTitle).toBeVisible();
  });

  test("hides billing section when user lacks BillingViewUnpaidInvoices", async () => {
    const mocks: MockLink.MockedResponse[] = [
      {
        request: { query: notificationAlertsQueryDocument },
        result: { data: mockAlertsData },
      },
    ];

    renderWithWrapper(<NotificationPanel />, {
      locale: "en",
      permissions: [AppPermission.NotificationViewAlerts],
      mocks,
    });

    const alertTitle = await screen.findByText("Notifications");
    expect(alertTitle).toBeVisible();

    expect(screen.queryByText("Unpaid Invoices")).toBeNull();
  });

  test("shows unread count badge when unread notifications exist", async () => {
    renderWithWrapper(<NotificationPanel />, {
      locale: "en",
      permissions: [AppPermission.NotificationViewAlerts, AppPermission.BillingViewUnpaidInvoices],
      mocks: createMocks(),
    });

    const badge = await screen.findByText("1");
    expect(badge).toBeVisible();
  });
});
