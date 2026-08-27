import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const mockPush = mock(() => {});

await mockNextNavigation("/accounting/payments/pay-1", {
  mockPush,
  locales: ["ar", "en"],
  defaultLocale: "en",
  routingIncludeReplaceAndPrefetch: false,
  includeReplaceAndPrefetch: false,
});

import type { MockLink } from "@apollo/client/testing";
import {
  AccountingPaymentHistoryKind,
  PaymentGateway,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { accountingPaymentQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { PaymentDetailMobile } from "@/frontend/mobile/views/dashboard/accounting/PaymentDetailView.mobile";
import { usePaymentDetailViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentDetailViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(DashboardAccountingPayments, locale);

const paymentId = "pay-1";

function PaymentDetailMobileImpl() {
  const viewModel = usePaymentDetailViewModel(paymentId);
  return <PaymentDetailMobile {...viewModel} />;
}

const paymentData = {
  id: paymentId,
  invoiceId: "inv-1",
  amount: "300.00",
  currency: "USD",
  paymentDate: "2026-07-05T12:00:00.000Z",
  packagePlanId: "plan-1",
  packageCodename: "plan_gold_4hrs",
  packageName: "Gold 4 Hours",
  paymentGateway: PaymentGateway.Paypal,
  creditHours: "10.00",
  isPaidStatusOn: true,
  paymentNote: null,
  studentId: "s-1",
  studentName: "Ahmed Mohamed",
  parentId: "p-1",
  parentName: "Parent One",
  invoiceStatus: "PAID",
  transactionId: "TRX-88912",
  createdAt: "2026-07-05T12:00:00.000Z",
  updatedAt: "2026-07-06T09:00:00.000Z",
  history: [
    {
      id: "h-2",
      kind: AccountingPaymentHistoryKind.HoursCredited,
      occurredAt: "2026-07-05T12:30:00.000Z",
      hoursDelta: "10.00",
      notes: null,
    },
    {
      id: "h-1",
      kind: AccountingPaymentHistoryKind.PaymentRecorded,
      occurredAt: "2026-07-05T12:00:00.000Z",
      hoursDelta: null,
      notes: "Bank receipt verified",
    },
  ],
};

function detailMock(payment: typeof paymentData): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: accountingPaymentQueryDocument,
        variables: { id: paymentId },
      },
      result: { data: { accountingPayment: payment } },
    },
  ];
}

afterEach(() => {
  cleanup();
});

describe("accounting payment detail (mobile variant)", () => {
  test("mounts the history timeline section with audit events", async () => {
    renderWithWrapper(<PaymentDetailMobileImpl />, {
      locale,
      permissions: [],
      mocks: detailMock(paymentData),
      viewport: "mobile",
    });

    expect(await screen.findByText(labels.detail.historyTitle)).toBeVisible();

    // Newest event first: the credited-hours kind renders with its delta.
    expect(screen.getByText(new RegExp(labels.historyKinds.HOURS_CREDITED))).toBeVisible();
    expect(screen.getByText(new RegExp(labels.historyKinds.PAYMENT_RECORDED))).toBeVisible();
    expect(screen.getByText("+10 h")).toBeVisible();
    expect(screen.getByText("Bank receipt verified")).toBeVisible();
  });

  test("exposes the invoice document access link when an invoice exists", async () => {
    renderWithWrapper(<PaymentDetailMobileImpl />, {
      locale,
      permissions: [],
      mocks: detailMock(paymentData),
      viewport: "mobile",
    });

    expect(await screen.findByText(labels.detail.documentPreview)).toBeVisible();

    const downloadLink = screen.getByRole("link", { name: labels.detail.downloadPdf });
    expect(downloadLink).toHaveAttribute("href", "/api/invoices/inv-1/download");
    expect(downloadLink).toHaveAttribute("target", "_blank");
  });

  test("falls back to the empty copy without invoice or history", async () => {
    renderWithWrapper(
      <PaymentDetailMobileImpl />,
      {
        locale,
        permissions: [],
        mocks: detailMock({ ...paymentData, invoiceId: null, history: [] }),
        viewport: "mobile",
      }
    );

    expect(await screen.findByText(labels.detail.historyEmpty)).toBeVisible();
    expect(screen.getByText(labels.detail.documentEmpty)).toBeVisible();
  });
});
