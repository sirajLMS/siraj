import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const mockPush = mock(() => {});

await mockNextNavigation("/accounting/payments", {
  mockPush,
  locales: ["ar", "en"],
  defaultLocale: "en",
  routingIncludeReplaceAndPrefetch: false,
  includeReplaceAndPrefetch: false,
});

import { accountingPaymentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { PaymentsContainer } from "@/frontend/common/views/dashboard/accounting/PaymentsContainer";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(DashboardAccountingPayments, locale);

afterEach(() => {
  cleanup();
});

const rowsData = [
  {
    id: "pay-1",
    invoiceId: "inv-1",
    amount: "300.00",
    currency: "USD",
    paymentDate: "2026-07-05T12:00:00.000Z",
    createdAt: "2026-07-05T12:00:00.000Z",
    updatedAt: "2026-07-05T12:00:00.000Z",
    packagePlanId: "plan-1",
    packageCodename: "plan_gold_4hrs",
    packageName: "Gold 4 Hours",
    paymentGateway: "PAYPAL",
    creditHours: "10.00",
    isPaidStatusOn: true,
    paymentNote: null,
    studentId: "s-1",
    studentName: "Ahmed Mohamed",
    parentId: "p-1",
    parentName: "Parent One",
    invoiceStatus: "PAID",
  },
  {
    id: "pay-2",
    invoiceId: "inv-1",
    amount: "150.00",
    currency: "USD",
    paymentDate: "2026-07-06T12:00:00.000Z",
    createdAt: "2026-07-06T12:00:00.000Z",
    updatedAt: "2026-07-06T12:00:00.000Z",
    packagePlanId: null,
    packageCodename: null,
    packageName: null,
    paymentGateway: "BANK",
    creditHours: "5.00",
    isPaidStatusOn: false,
    paymentNote: "split gateway",
    studentId: "s-2",
    studentName: "Sara Ali",
    parentId: "p-2",
    parentName: "Parent Two",
    invoiceStatus: "PAID",
  },
];

function accountingMocks(rows = rowsData) {
  return [
    {
      request: {
        query: accountingPaymentsQueryDocument,
        variables: {
          filter: null,
          paginationArgs: {
            after: null,
            before: null,
            first: 500,
            last: null,
            maxCount: null,
            page: null,
            skip: null,
          },
        },
      },
      result: { data: { accountingPayments: rows } },
    },
  ];
}

describe("accounting payments list (component)", () => {
  test("renders DataGrid rows joined with student and package display names", async () => {
    renderWithWrapper(<PaymentsContainer />, {
      locale,
      permissions: [],
      mocks: accountingMocks(),
    });

    expect(await screen.findByText("Ahmed Mohamed")).toBeVisible();
    expect(screen.getByText("Sara Ali")).toBeVisible();
    expect(screen.getByText("plan_gold_4hrs")).toBeVisible();

    // Column headers come straight from the i18n namespace.
    expect(screen.getByText(labels.columns.studentName)).toBeVisible();
    expect(screen.getByText(labels.columns.paymentGateway)).toBeVisible();
    expect(screen.getByText(labels.columns.actions)).toBeVisible();
  });

  test("shows the translated empty state when no payments match", async () => {
    renderWithWrapper(<PaymentsContainer />, {
      locale,
      permissions: [],
      mocks: accountingMocks([]),
    });

    expect(await screen.findByText(labels.empty)).toBeVisible();
  });
});
