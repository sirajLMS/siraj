const mockPush = mock(() => {});

mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
}));

mock.module("@/shared/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush, back: mock(() => {}), forward: mock(() => {}), refresh: mock(() => {}) }),
  usePathname: () => "/dashboard",
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  redirect: () => {},
}));

import { afterEach, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { unpaidInvoicesAlertQueryDocument } from "@/frontend/graphql/sharedDocuments/billing-alerts.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { UnpaidInvoicesSection } from "@/frontend/views/dashboard/components/navbar/UnpaidInvoicesSection";
import { renderWithWrapper } from "./TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
  mockPush.mock.calls.length = 0;
});

const mockBillingWithData = {
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
      {
        id: "parent-2",
        userId: "user-2",
        userName: "Sara Ali",
        userEmail: "sara@example.com",
        totalUnpaidAmount: "500.00",
        currency: "USD",
        overdueCount: 1,
        oldestDueDate: "2026-06-01",
      },
    ],
  },
};

const mockBillingEmpty = {
  unpaidInvoicesAlert: {
    id: "unpaid-invoices-summary",
    totalOverdueInvoices: 0,
    totalOverdueAmount: "0.00",
    items: [],
  },
};

function createBillingMock(data = mockBillingWithData): MockLink.MockedResponse[] {
  return [
    {
      request: { query: unpaidInvoicesAlertQueryDocument },
      result: { data },
    },
  ];
}

describe("UnpaidInvoicesSection", () => {
  test("shows loading text while fetching invoices", () => {
    const mocks: MockLink.MockedResponse[] = [
      {
        request: { query: unpaidInvoicesAlertQueryDocument },
        delay: 1000,
        result: { data: mockBillingWithData },
      },
    ];

    renderWithWrapper(<UnpaidInvoicesSection />, {
      locale: "en",
      permissions: [AppPermission.BillingViewUnpaidInvoices, AppPermission.UserViewProfile],
      mocks,
    });

    expect(screen.getByText("Loading billing data...")).toBeVisible();
  });

  test("shows no unpaid invoices message when totalOverdueInvoices is 0", async () => {
    renderWithWrapper(<UnpaidInvoicesSection />, {
      locale: "en",
      permissions: [AppPermission.BillingViewUnpaidInvoices],
      mocks: createBillingMock(mockBillingEmpty),
    });

    const message = await screen.findByText("There is no invoices to be paid.");
    expect(message).toBeVisible();
  });

  test("renders invoice items with user names and amounts", async () => {
    renderWithWrapper(<UnpaidInvoicesSection />, {
      locale: "en",
      permissions: [AppPermission.BillingViewUnpaidInvoices, AppPermission.UserViewProfile],
      mocks: createBillingMock(),
    });

    const ahmed = await screen.findByText("Ahmed Mohamed");
    expect(ahmed).toBeVisible();

    const sara = await screen.findByText("Sara Ali");
    expect(sara).toBeVisible();

    expect(screen.getByText("1000.00 EGP — 2 overdue")).toBeVisible();
    expect(screen.getByText("500.00 USD — 1 overdue")).toBeVisible();
  });

  test("shows overdue count badge", async () => {
    renderWithWrapper(<UnpaidInvoicesSection />, {
      locale: "en",
      permissions: [AppPermission.BillingViewUnpaidInvoices, AppPermission.UserViewProfile],
      mocks: createBillingMock(),
    });

    const header = await screen.findByText("Unpaid Invoices");
    expect(header).toBeVisible();

    const badge = await screen.findByText("2");
    expect(badge).toBeVisible();
  });

  test("clicking user row navigates to billing profile", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");

    renderWithWrapper(<UnpaidInvoicesSection />, {
      locale: "en",
      permissions: [AppPermission.BillingViewUnpaidInvoices, AppPermission.UserViewProfile],
      mocks: createBillingMock(),
    });

    const ahmed = await screen.findByText("Ahmed Mohamed");
    const clickableRow = ahmed.closest('[role="button"]');
    expect(clickableRow).not.toBeNull();
    if (clickableRow) {
      await userEvent.click(clickableRow);
    }

    expect(mockPush).toHaveBeenCalledWith("/en/users/user-1/billing-profile");
  });

  test("user rows are not clickable without UserViewProfile permission", async () => {
    renderWithWrapper(<UnpaidInvoicesSection />, {
      locale: "en",
      permissions: [AppPermission.BillingViewUnpaidInvoices],
      mocks: createBillingMock(),
    });

    const ahmed = await screen.findByText("Ahmed Mohamed");
    expect(ahmed).toBeVisible();

    const clickableRow = ahmed.closest('[role="button"]');
    expect(clickableRow).toBeNull();
  });
});
