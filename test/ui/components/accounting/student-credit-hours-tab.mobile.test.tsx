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
import { StudentCreditHoursMobileView } from "@/frontend/mobile/views/dashboard/students/profile/studentCreditHours.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardAccountingStudentCreditHours } from "@/shared/locale/namespaces";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(DashboardAccountingStudentCreditHours, locale);

// Bypass the lazy switcher: next/dynamic resolution races make switcher-level
// rendering unstable in Happy DOM (same pattern as the cron/pendingReviews tests).
function MobileTabHarness() {
  const viewModel = useStudentCreditHoursViewModel({ studentId: "s-1" });
  return <StudentCreditHoursMobileView {...viewModel} />;
}

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
  mockPush.mock.calls.length = 0;
});

function balanceMock(): MockLink.MockedResponse {
  return {
    request: { query: studentCreditHourBalanceQueryDocument, variables: { studentId: "s-1" } },
    result: {
      data: {
        studentCreditHourBalance: {
          studentId: "s-1",
          creditHoursTotal: "20.00",
          creditHoursRemaining: "14.00",
          lowHoursThreshold: null,
        },
      },
    },
  };
}

function transactionsMock(transactions: Array<Record<string, unknown>>): MockLink.MockedResponse {
  return {
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
    result: { data: { studentCreditTransactions: transactions } },
  };
}

describe("student profile — credit hours tab (mobile view)", () => {
  test("renders the metric grid and transaction cards with reason badges", async () => {
    renderWithWrapper(<MobileTabHarness />, {
      locale,
      permissions: [AppPermission.TeacherViewStudents],
      viewport: "mobile",
      mocks: [
        balanceMock(),
        transactionsMock([
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
          {
            id: "ct-2",
            createdAt: "2026-07-06T12:00:00.000Z",
            changeAmountHours: "-1.50",
            reason: "DEDUCTION",
            notes: null,
            classInstanceId: null,
            sourcePaymentId: null,
            studentId: "s-1",
            changeAmount: null,
            creditedByUserId: null,
            idempotencyKey: "k2",
          },
        ]),
      ],
    });

    // Metric grid labels + audience hint resolved by the ViewModel.
    expect(await screen.findByText(labels.totalLabel)).toBeVisible();
    await act(async () => {});
    expect(screen.getByText(labels.perAudience.teacherHint)).toBeVisible();

    // Card list rows: reason badge, formatted change, and note row.
    expect(await screen.findByText(labels.reasons.PURCHASE)).toBeVisible();
    expect(screen.getByText(labels.reasons.DEDUCTION)).toBeVisible();
    expect(screen.getByText("+10.00 h")).toBeVisible();
    expect(screen.getByText("−1.50 h")).toBeVisible();
  });

  test("renders the translated empty state via the card list", async () => {
    renderWithWrapper(<MobileTabHarness />, {
      locale,
      permissions: [],
      viewport: "mobile",
      mocks: [balanceMock(), transactionsMock([])],
    });

    expect(await screen.findByText(labels.totalLabel)).toBeVisible();
    await act(async () => {});
    expect(await screen.findByText(labels.recentPurchasesEmpty)).toBeVisible();
  });
});
