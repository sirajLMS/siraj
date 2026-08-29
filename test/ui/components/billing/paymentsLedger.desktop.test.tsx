import { afterEach, describe, expect, mock, test } from "bun:test";

await mock.module("@/frontend/common/utils/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

import { ChildCareOutlined } from "@mui/icons-material";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor, within } from "@testing-library/react";

expect.extend(matchers);

import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { PaymentsLedgerRow } from "@/frontend/common/views/dashboard/billing/types/paymentsLedger.types";
import type { PaymentsLedgerViewModel } from "@/frontend/common/views/dashboard/billing/usePaymentsLedgerViewModel";
import { PaymentsLedgerDesktopView } from "@/frontend/desktop/views/dashboard/billing/paymentsLedger.desktop";
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
    metrics: [
      {
        key: "student-1",
        labelKey: "student-1",
        label: "Sara",
        count: labels.hoursRemainingValue(9),
        subLabel: labels.balanceSubLabel,
        icon: ChildCareOutlined,
      },
    ] satisfies readonly MetricItem[],
    paginationOptions: { mode: "client" as const, pageSize: 10 },
    labels,
    onMetricClick: () => {},
    ...overrides,
  };
}

describe("PaymentsLedgerDesktopView", () => {
  test("renders the payments grid with translated column headers", async () => {
    renderWithWrapper(<PaymentsLedgerDesktopView {...buildViewModel()} />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: labels.columns.student })).toBeInTheDocument();
    });
    expect(screen.getByRole("columnheader", { name: labels.columns.amount })).toBeInTheDocument();
    const grid = screen.getByRole("grid");
    expect(within(grid).getByText(BASE_ROW.creditsLabel)).toBeInTheDocument();
    expect(within(grid).getByText("Sara")).toBeInTheDocument();
    expect(within(grid).getByText("150 SAR")).toBeInTheDocument();
  });

  test("renders per-child balance metrics above the grid", async () => {
    renderWithWrapper(<PaymentsLedgerDesktopView {...buildViewModel()} />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(screen.getAllByText(labels.hoursRemainingValue(9)).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(labels.balanceSubLabel).length).toBeGreaterThan(0);
  });

  test("renders the translated empty message when there are no rows", async () => {
    renderWithWrapper(<PaymentsLedgerDesktopView {...buildViewModel({ rows: [] })} />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(screen.getByText(`${labels.emptyTitle} ${labels.emptySubtitle}`)).toBeInTheDocument();
    });
  });

  test("renders the load error alert when the query failed", () => {
    renderWithWrapper(<PaymentsLedgerDesktopView {...buildViewModel({ showError: true })} />, {
      locale,
      viewport: "desktop",
    });

    expect(screen.getByText(labels.loadError)).toBeInTheDocument();
  });
});
