import { afterEach, describe, expect, mock, test } from "bun:test";

await mock.module("@/frontend/common/utils/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { useEffect } from "react";
import type { MyPaymentsLedgerQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { myPaymentsLedgerQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { studentCreditHourBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { usePaymentsLedgerStore } from "@/frontend/common/stores/paymentsLedgerStore";
import {
  type PaymentsLedgerViewModel,
  usePaymentsLedgerViewModel,
} from "@/frontend/common/views/dashboard/billing/usePaymentsLedgerViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

await mockNextNavigation();

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.Billing, locale).paymentsLedger;

const ledgerData: MyPaymentsLedgerQuery = {
  myPaymentsLedger: [
    {
      id: "pay-1",
      studentId: "student-1",
      studentName: "Sara",
      creditsPurchased: 0,
      creditHours: 2.5,
      amount: "150",
      currency: "SAR",
      packageName: "Starter Pack",
      paymentGateway: "card",
      paymentMethodType: "online_account",
      paymentDate: "2026-05-01",
    },
    {
      id: "pay-2",
      studentId: "student-2",
      studentName: "Omar",
      creditsPurchased: 5,
      creditHours: null,
      amount: "300",
      currency: "SAR",
      packageName: null,
      paymentGateway: null,
      paymentMethodType: null,
      paymentDate: "2026-06-10",
    },
  ],
};

const ledgerMock = {
  request: { query: myPaymentsLedgerQueryDocument },
  result: { data: ledgerData },
};

function balanceMock(studentId: string, remaining: string, lowHoursThreshold: number) {
  return {
    request: { query: studentCreditHourBalanceQueryDocument, variables: { studentId } },
    result: {
      data: {
        studentCreditHourBalance: {
          id: `balance-${studentId}`,
          studentId,
          creditHoursTotal: "12",
          creditHoursRemaining: remaining,
          lowHoursThreshold,
          lastPaymentCurrency: null,
        },
      },
    },
  };
}

const s1Balance = balanceMock("student-1", "9", 5);
const s2BalanceLow = balanceMock("student-2", "1", 5);

let captured: { vm: PaymentsLedgerViewModel | null } = { vm: null };

function ViewModelCapture() {
  const vm = usePaymentsLedgerViewModel();
  useEffect(() => {
    captured.vm = vm;
  }, [vm]);
  return null;
}

afterEach(() => {
  cleanup();
  captured = { vm: null };
  usePaymentsLedgerStore.setState({ balancesByStudentId: {}, balancesFetchedKey: "" }, false);
});

describe("usePaymentsLedgerViewModel", () => {
  test("maps ledger rows with localized chip, amount, and method labels", async () => {
    renderWithWrapper(<ViewModelCapture />, { locale, mocks: [ledgerMock, s1Balance, s2BalanceLow] });

    await waitFor(() => {
      expect(captured.vm?.rows.length).toBe(2);
    });
    const [first, second] = captured.vm?.rows ?? [];
    expect(first.creditsLabel).toBe(labels.hoursAddedChip(2.5));
    expect(second.creditsLabel).toBe(labels.creditsAddedChip(5));
    expect(first.amountLabel).toBe("150.00 SAR");
    expect(first.methodLabel).toBe("Online Account");
    expect(second.methodLabel).toBe("—");
  });

  test("fetches both child balances in one ViewModel-level fan-out and builds metrics", async () => {
    renderWithWrapper(<ViewModelCapture />, { locale, mocks: [ledgerMock, s1Balance, s2BalanceLow] });

    await waitFor(() => {
      expect(captured.vm?.rows.length).toBe(2);
    });
    await waitFor(() => {
      expect(captured.vm?.balancesLoading).toBe(false);
    });
    await waitFor(() => {
      expect(captured.vm?.metrics.length).toBe(2);
    });
    await waitFor(() => {
      expect(captured.vm?.metrics[1]?.count).toBe(labels.hoursRemainingValue(1));
    });
    const metrics = captured.vm?.metrics ?? [];
    expect(metrics[0]?.count).toBe(labels.hoursRemainingValue(9));
    expect(metrics[0]?.variant).toBe("default");
    expect(metrics[1]?.variant).toBe("error");
    expect(metrics[0]?.label).toBe("Sara");
    expect(metrics[1]?.subLabel).toBe(labels.lowBalanceHint);
  });

  test("surfaces client-mode pagination and no error state on success", async () => {
    renderWithWrapper(<ViewModelCapture />, { locale, mocks: [ledgerMock, s1Balance, s2BalanceLow] });

    await waitFor(() => {
      expect(captured.vm?.loading).toBe(false);
    });
    expect(captured.vm?.showError).toBe(false);
    expect(captured.vm?.paginationOptions).toEqual({ mode: "client", pageSize: 10, pageSizeOptions: [10] });
  });
});
