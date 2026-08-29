import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const mockPush = mock(() => {});

await mockNextNavigation("/dashboard/students", {
  mockPush,
  locales: ["ar", "en"],
  defaultLocale: "en",
  routingIncludeReplaceAndPrefetch: false,
  includeReplaceAndPrefetch: false,
});

import type { MockLink } from "@apollo/client/testing";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentCreditHourBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { studentCreditTransactionsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useStudentCreditHoursViewModel } from "@/frontend/common/views/dashboard/students/profile/useStudentCreditHoursViewModel";
import { StudentCreditHoursDesktopView } from "@/frontend/desktop/views/dashboard/students/profile/studentCreditHours.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardAccountingStudentCreditHours } from "@/shared/locale/namespaces";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(DashboardAccountingStudentCreditHours, locale);

// Bypass the lazy switcher: next/dynamic resolution races make switcher-level
// rendering unstable in Happy DOM (same pattern as the cron/pendingReviews tests).
function DesktopTabHarness() {
  const viewModel = useStudentCreditHoursViewModel({ studentId: "s-1" });
  return <StudentCreditHoursDesktopView {...viewModel} />;
}

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
  mockPush.mock.calls.length = 0;
});

function createMocks(args: {
  creditHoursTotal: string;
  creditHoursRemaining: string;
  lowHoursThreshold?: number;
  transactions?: Array<Record<string, unknown>>;
}): MockLink.MockedResponse[] {
  return [
    {
      request: { query: studentCreditHourBalanceQueryDocument, variables: { studentId: "s-1" } },
      result: {
        data: {
          studentCreditHourBalance: {
            studentId: "s-1",
            creditHoursTotal: args.creditHoursTotal,
            creditHoursRemaining: args.creditHoursRemaining,
            lowHoursThreshold: args.lowHoursThreshold ?? null,
          },
        },
      },
    },
    {
      request: {
        query: studentCreditTransactionsQueryDocument,
        variables: {
          studentId: "s-1",
          paginationArgs: {
            after: null,
            before: null,
            first: 10,
            last: null,
            maxCount: null,
            page: null,
            skip: null,
          },
          hoursOnly: true,
        },
      },
      result: {
        data: {
          studentCreditTransactions: args.transactions ?? [],
        },
      },
    },
  ];
}

const healthyTransactions = [
  {
    id: "ct-1",
    createdAt: "2026-07-05T12:00:00.000Z",
    changeAmountHours: "10.00",
    reason: "PURCHASE",
    notes: "gold pack",
    classInstanceId: null,
    sourcePaymentId: null,
    studentId: "s-1",
    changeAmount: null,
    creditedByUserId: null,
    idempotencyKey: "k1",
  },
];

describe("student profile — credit hours tab (desktop view)", () => {
  test("renders metric grid, hint, and the transactions data grid with a reason badge", async () => {
    renderWithWrapper(<DesktopTabHarness />, {
      locale,
      permissions: [AppPermission.StudentsList],
      viewport: "desktop",
      mocks: createMocks({
        creditHoursTotal: "20.00",
        creditHoursRemaining: "14.00",
        transactions: healthyTransactions,
      }),
    });

    // Metric grid shows the translated labels with hour-formatted values.
    expect(await screen.findByText(labels.totalLabel)).toBeVisible();
    // Two mocked queries settle independently — pump an act() turn so the
    // transactions observable commit lands before synchronous assertions.
    await act(async () => {});
    expect(screen.getByText(labels.consumedLabel)).toBeVisible();
    expect(screen.getByText(labels.hoursUnit("6.00"))).toBeVisible(); // consumed = total − remaining
    expect(screen.getByText(labels.balanceCardTitle)).toBeVisible();
    expect(screen.getByText(labels.hoursUnit("20.00"))).toBeVisible();
    expect(screen.getByText(labels.hoursUnit("14.00"))).toBeVisible(); // remaining card

    // Audience hint comes from the ViewModel permission resolution (admin here).
    expect(screen.getByText(labels.perAudience.supervisorHint)).toBeVisible();

    // Transactions grid renders the positive purchase row with its reason badge.
    expect(screen.getAllByText(labels.recentPurchasesTitle).length).toBeGreaterThan(0);
    const purchaseCell = await screen.findByText("+10.00 h");
    expect(purchaseCell).toBeVisible();
    expect(screen.getByText(labels.reasons.PURCHASE)).toBeVisible();
  });

  test("surfaces the low-balance warning when remaining falls below the low-hours threshold", async () => {
    renderWithWrapper(<DesktopTabHarness />, {
      locale,
      permissions: [AppPermission.StudentsList],
      viewport: "desktop",
      mocks: createMocks({ creditHoursTotal: "20.00", creditHoursRemaining: "4.00", lowHoursThreshold: 5 }),
    });

    // Threshold comes from the accounting_low_hours_threshold setting on the
    // balance payload; 4.00 remaining < 5.00 threshold → alert visible.
    const alertText = labels.lowBalanceAlert("4.00", "5.00");
    expect(await screen.findByText(alertText)).toBeVisible();
  });

  test("renders the translated empty state when there are no transactions", async () => {
    renderWithWrapper(<DesktopTabHarness />, {
      locale,
      permissions: [AppPermission.ParentViewStudents],
      viewport: "desktop",
      mocks: createMocks({ creditHoursTotal: "20.00", creditHoursRemaining: "14.00" }),
    });

    expect(await screen.findByText(labels.recentPurchasesEmpty)).toBeVisible();
    expect(screen.getByText(labels.perAudience.parentHint)).toBeVisible();
  });
});
