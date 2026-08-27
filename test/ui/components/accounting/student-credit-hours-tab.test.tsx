import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

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
import { StudentCreditHoursTab } from "@/frontend/common/views/dashboard/students/profile/StudentCreditHoursTab";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardAccountingStudentCreditHours } from "@/shared/locale/namespaces";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(DashboardAccountingStudentCreditHours, locale);

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
  mockPush.mock.calls.length = 0;
});

function createMocks(args: {
  creditHoursTotal: string;
  creditHoursRemaining: string;
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
    deletedAt: null,
  },
];

describe("student profile — credit hours tab (component)", () => {
  test("renders balance cards and recent hour activity for an admin audience", async () => {
    renderWithWrapper(<StudentCreditHoursTab studentId="s-1" />, {
      locale,
      permissions: [AppPermission.StudentsList],
      mocks: createMocks({
        creditHoursTotal: "20.00",
        creditHoursRemaining: "14.00",
        transactions: healthyTransactions,
      }),
    });

    // Balance cards show the translated labels with hour-formatted values.
    expect(await screen.findByText(labels.totalLabel)).toBeVisible();
    expect(screen.getByText(labels.remainingLabel)).toBeVisible();
    expect(screen.getByText(labels.balanceCardTitle)).toBeVisible();
    expect(screen.getByText("20.00 hrs")).toBeVisible();

    // Recent purchases table renders the positive purchase row (+10.00 h).
    expect(screen.getByText(labels.recentPurchasesTitle)).toBeVisible();
    const purchaseCell = await screen.findByText("+10.00 h");
    expect(purchaseCell).toBeVisible();
  });

  test("surfaces the low-balance warning when remaining falls to the threshold ratio", async () => {
    renderWithWrapper(<StudentCreditHoursTab studentId="s-1" />, {
      locale,
      permissions: [AppPermission.StudentsList],
      mocks: createMocks({ creditHoursTotal: "20.00", creditHoursRemaining: "4.00" }),
    });

    // 4/20 = 0.2 ≤ 0.25 → alert visible with remaining + threshold hours.
    const alertText = labels.lowBalanceAlert("4.00", (20 * 0.25).toFixed(2));
    expect(await screen.findByText(alertText)).toBeVisible();
  });
});
