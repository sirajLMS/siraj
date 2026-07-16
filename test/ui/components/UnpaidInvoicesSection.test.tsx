const mockPush = mock(() => {});

// Defensive mocks — Bun's mock.module is process-global, so mocks registered by
// alphabetically-earlier test files (e.g. ScheduleOverviewSection.test.tsx) bleed
// into this file. Re-register here to guarantee the shape this file's transitive
// imports require, regardless of what earlier files may have left behind.
mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({ push: mockPush, back: mock(() => {}), forward: mock(() => {}), refresh: mock(() => {}) }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  redirect: mock(() => {}),
}));

mock.module("@/shared/i18n/routing", () => ({
  locales: ["ar", "en"] as const,
  defaultLocale: "ar",
  useRouter: () => ({ push: mockPush, back: mock(() => {}), forward: mock(() => {}), refresh: mock(() => {}) }),
  usePathname: () => "/dashboard",
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  redirect: mock(() => {}),
}));

// Eliminates dependency on the router-backed language switch hook so this file
// is immune to any router mock configuration registered by earlier test files.
mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import { afterEach, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { unpaidInvoicesAlertQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { UnpaidInvoicesSection } from "@/frontend/common/views/dashboard/components/navbar/UnpaidInvoicesSection";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

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

    const message = await screen.findByText("No invoices requiring payment.");
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

    expect(screen.getByText("— — 2 overdue")).toBeVisible();
    expect(screen.getByText("— — 1 overdue")).toBeVisible();
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

    expect(mockPush).toHaveBeenCalledWith("/users/user-1/billing-profile");
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
