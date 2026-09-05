import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import {
  SessionAuditAggregateCard,
  type SessionAuditAggregateCardProps,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditAggregateCard";
import type { SessionAuditStatus } from "@/shared/constants/classes/session-audit-status";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const sessionAuditLabels = readTranslation(Translation.Dashboard.SessionAudit, locale);

const ALL_STATUSES: readonly SessionAuditStatus[] = ["open", "end", "Absent", "absent_student"];

const FULL_COUNTS: Record<SessionAuditStatus, number> = {
  open: 12,
  end: 7,
  Absent: 9,
  absent_student: 4,
};

const ZERO_COUNTS: Record<SessionAuditStatus, number> = {
  open: 0,
  end: 0,
  Absent: 0,
  absent_student: 0,
};

type AggregateOverrides = Partial<
  Pick<SessionAuditAggregateCardProps, "totalPaidAmount" | "totalPaidCurrency" | "rowCountByStatus" | "rowCountByPaid">
>;

function renderCard(overrides: AggregateOverrides = {}) {
  return render(
    <SessionAuditAggregateCard
      totalPaidAmount={overrides.totalPaidAmount ?? "1234.00"}
      totalPaidCurrency={"totalPaidCurrency" in overrides ? (overrides.totalPaidCurrency ?? null) : CurrencyCode.Usd}
      rowCountByStatus={overrides.rowCountByStatus ?? FULL_COUNTS}
      rowCountByPaid={overrides.rowCountByPaid ?? { paid: 63, unpaid: 58 }}
      labels={sessionAuditLabels.aggregate}
      statusLabels={sessionAuditLabels.status}
    />,
    { wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper locale={locale}>{children}</TestWrapper> }
  );
}

afterEach(() => {
  cleanup();
});

describe("SessionAuditAggregateCard — total paid", () => {
  test("renders the total-paid label with the currency-formatted amount", () => {
    renderCard({ totalPaidAmount: "1234.00", totalPaidCurrency: CurrencyCode.Usd });
    expect(screen.getByText(sessionAuditLabels.aggregate.totalPaid)).toBeInTheDocument();
    expect(screen.getByText(formatLockedAmount("1234.00", CurrencyCode.Usd, locale))).toBeInTheDocument();
  });

  test("formats zero totals as a real amount rather than hiding them", () => {
    renderCard({ totalPaidAmount: "0.00", totalPaidCurrency: CurrencyCode.Egp });
    expect(screen.getByText(formatLockedAmount("0.00", CurrencyCode.Egp, locale))).toBeInTheDocument();
  });

  test("hides only the currency total while the currency is unknown; counts still render", () => {
    renderCard({ totalPaidCurrency: null });
    expect(screen.queryByText(sessionAuditLabels.aggregate.totalPaid)).not.toBeInTheDocument();
    for (const status of ALL_STATUSES) {
      expect(screen.getByLabelText(sessionAuditLabels.status[status])).toBeInTheDocument();
    }
    expect(screen.getByText(sessionAuditLabels.aggregate.paidRows)).toBeInTheDocument();
    expect(screen.getByText(sessionAuditLabels.aggregate.unpaidRows)).toBeInTheDocument();
  });
});

describe("SessionAuditAggregateCard — per-status row counts", () => {
  test("renders every audit status with its localized label and count", () => {
    renderCard({ rowCountByStatus: FULL_COUNTS });
    for (const status of ALL_STATUSES) {
      const chip = screen.getByLabelText(sessionAuditLabels.status[status]);
      expect(chip).toHaveClass("MuiChip-root");
      expect(chip.parentElement).toHaveTextContent(String(FULL_COUNTS[status]));
    }
  });

  test("renders an explicit zero counter for every status on an empty page", () => {
    renderCard({ rowCountByStatus: ZERO_COUNTS });
    for (const status of ALL_STATUSES) {
      const chip = screen.getByLabelText(sessionAuditLabels.status[status]);
      expect(chip.parentElement).toHaveTextContent("0");
    }
  });
});

describe("SessionAuditAggregateCard — paid/unpaid tallies", () => {
  test("renders paid and unpaid row labels with their counts", () => {
    renderCard({ rowCountByPaid: { paid: 63, unpaid: 58 } });
    const paidLabel = screen.getByText(sessionAuditLabels.aggregate.paidRows);
    expect(paidLabel.parentElement).toHaveTextContent("63");
    const unpaidLabel = screen.getByText(sessionAuditLabels.aggregate.unpaidRows);
    expect(unpaidLabel.parentElement).toHaveTextContent("58");
  });

  test("renders explicit zero tallies when no rows are paid or unpaid", () => {
    renderCard({ rowCountByPaid: { paid: 0, unpaid: 0 } });
    const paidLabel = screen.getByText(sessionAuditLabels.aggregate.paidRows);
    expect(paidLabel.parentElement).toHaveTextContent("0");
    const unpaidLabel = screen.getByText(sessionAuditLabels.aggregate.unpaidRows);
    expect(unpaidLabel.parentElement).toHaveTextContent("0");
  });
});
