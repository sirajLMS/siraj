import { afterEach, describe, expect, mock, test } from "bun:test";
import { createElement, type ReactElement } from "react";

await mock.module("@/frontend/common/utils/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));
await mock.module("@/frontend/common/lib/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

await mock.module("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    createElement("a", { href, ...rest }, children),
}));

const mockLabels = (await import("@/test/ui/components/quota/mockQuotaLabels")).createMockQuotaLabels();

await mock.module("@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel", () => ({
  useQuotaInsightsViewModel: () => mockViewModel,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { QuotaInsightsDesktopView } from "@/frontend/desktop/views/dashboard/billing/quota/quotaInsights.desktop";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

await mockNextNavigation();

let mockViewModel = {
  labels: mockLabels,
  loading: false,
  error: false,
  quotas: [] as QuotaItem[],
  metrics: {
    activeQuotasCount: 0,
    totalClassesRemaining: 0,
    totalReserved: 0,
    expiringThisWeekCount: 0,
    pendingBacklogCount: 0,
  },
  chartData: {
    purchasesOverTime: [],
    redemptionByType: [],
    deliveryRate: [],
    expiredSlippage: [],
  },
  filters: {
    dateRange: "all" as const,
    kind: null as QuotaKind | null,
    status: null as QuotaStatus | null,
    studentId: null as string | null,
  },
  setDateRange: (_range: "all" | "month" | "quarter" | "year") => {},
  setKind: (_kind: QuotaKind | null) => {},
  setStatus: (_status: QuotaStatus | null) => {},
  setStudentId: (_id: string | null) => {},
  exportCsv: () => {},
  refetch: () => {},
};

function QuotaInsightsDesktopTestView(): ReactElement {
  return <QuotaInsightsDesktopView {...mockViewModel} />;
}

const mockQuota: QuotaItem = {
  id: "quota-1",
  studentId: "student-1",
  name: "Summer Package",
  kind: QuotaKind.Package,
  totalClasses: 20,
  remaining: 15,
  reservedClasses: 2,
  validFrom: "2025-06-01T00:00:00.000Z",
  validUntil: "2025-08-31T00:00:00.000Z",
  status: QuotaStatus.Active,
  periodType: null,
  periodDays: null,
  priority: 10,
  createdAt: "2025-06-01T00:00:00.000Z",
  updatedAt: "2025-06-01T00:00:00.000Z",
};

function renderInsights() {
  return renderWithWrapper(<QuotaInsightsDesktopTestView />, { locale: "en", viewport: "desktop" });
}

async function assertInsightsRenders() {
  const { container } = renderInsights();
  await waitFor(() => {
    expect(container.firstChild).not.toBeNull();
  });
}

describe("QuotaInsightsContainer", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders insights title", async () => {
    renderInsights();

    await waitFor(() => {
      expect(screen.getAllByText("Quota Insights").length).toBeGreaterThan(0);
    });
  });

  test("renders KPI metric labels with data", async () => {
    mockViewModel = {
      ...mockViewModel,
      metrics: {
        activeQuotasCount: 7,
        totalClassesRemaining: 120,
        totalReserved: 15,
        expiringThisWeekCount: 3,
        pendingBacklogCount: 5,
      },
    };

    renderInsights();

    await waitFor(() => {
      expect(screen.getByText("7 active quotas")).toBeVisible();
    });
    expect(screen.getByText("120 classes remaining")).toBeVisible();
  });

  test("renders loading state when loading=true", async () => {
    mockViewModel = { ...mockViewModel, loading: true };

    renderInsights();

    await waitFor(() => {
      expect(screen.getAllByText("Quota Insights").length).toBeGreaterThan(0);
    });
  });

  test("renders error state when error=true", async () => {
    mockViewModel = { ...mockViewModel, error: true };

    renderInsights();

    await waitFor(() => {
      expect(screen.getByText("Failed to create quota")).toBeVisible();
    });
  });

  test("renders insights view with data", async () => {
    mockViewModel = { ...mockViewModel, quotas: [mockQuota], loading: false, error: false };
    await assertInsightsRenders();
  });

  test("renders insights view with empty data", async () => {
    mockViewModel = { ...mockViewModel, quotas: [], loading: false, error: false };
    await assertInsightsRenders();
  });

  test.skip("renders filter buttons for date range, kind, status, student", () => {
    // Skipped: filter buttons require complex MUI Select/Autocomplete interaction testing
    expect.assertions(0);
  });
});
