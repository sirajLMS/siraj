import { afterEach, describe, expect, mock, test } from "bun:test";

await mock.module("@/frontend/common/utils/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import type { PaymentsLedgerRow } from "@/frontend/common/views/dashboard/billing/types/paymentsLedger.types";
import type { PaymentsLedgerViewModel } from "@/frontend/common/views/dashboard/billing/usePaymentsLedgerViewModel";
import { PaymentsLedgerMobileView } from "@/frontend/mobile/views/dashboard/billing/paymentsLedger.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

await mockNextNavigation();

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.Billing, locale).paymentsLedger;

afterEach(() => {
  cleanup();
});

const BASE_ROW: PaymentsLedgerRow = {
  id: "pay-1",
  studentId: "student-1",
  studentName: "Sara",
  creditHours: 2.5,
  creditsPurchased: 0,
  creditsLabel: labels.hoursAddedChip(2.5),
  amountLabel: "150 SAR",
  packageName: "Starter Pack",
  methodLabel: "Online Account",
  dateLabel: "1 May 2026",
};

function buildViewModel(overrides: Partial<PaymentsLedgerViewModel> = {}) {
  return {
    rows: [BASE_ROW],
    loading: false,
    balancesLoading: false,
    showError: false,
    metrics: [],
    paginationOptions: { mode: "client" as const, pageSize: 10 },
    labels,
    onMetricClick: () => {},
    ...overrides,
  };
}

describe("PaymentsLedgerMobileView", () => {
  test("renders ledger rows as cards with translated content", async () => {
    renderWithWrapper(<PaymentsLedgerMobileView {...buildViewModel()} />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getByText("Sara")).toBeInTheDocument();
    });
    expect(screen.getByText(BASE_ROW.creditsLabel)).toBeInTheDocument();
    expect(screen.getByText("150 SAR")).toBeInTheDocument();
    expect(screen.getByText("Starter Pack")).toBeInTheDocument();
    expect(screen.getByText(BASE_ROW.methodLabel)).toBeInTheDocument();
    expect(screen.getAllByText(labels.historySectionTitle).length).toBeGreaterThan(0);
  });

  test("renders the translated empty message when there are no rows", async () => {
    renderWithWrapper(<PaymentsLedgerMobileView {...buildViewModel({ rows: [] })} />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getByText(`${labels.emptyTitle} ${labels.emptySubtitle}`)).toBeInTheDocument();
    });
  });

  test("renders the load error alert when the query failed", () => {
    renderWithWrapper(<PaymentsLedgerMobileView {...buildViewModel({ showError: true })} />, {
      locale,
      viewport: "mobile",
    });

    expect(screen.getByText(labels.loadError)).toBeInTheDocument();
  });
});
