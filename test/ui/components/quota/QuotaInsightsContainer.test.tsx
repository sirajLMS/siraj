import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
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
  useQuotaInsightsViewModel: () => viewModelRef.current,
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

const mockViewModel = {
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

// Wrap in a ref so the mock factory always reads the current object
// (mock.module captures the closure at registration time, not per-test)
const viewModelRef = { current: mockViewModel };

function QuotaInsightsDesktopTestView(): ReactElement {
  return <QuotaInsightsDesktopView {...viewModelRef.current} />;
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
  beforeEach(() => {
    viewModelRef.current = mockViewModel;
  });

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
    viewModelRef.current = {
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

    await waitFor(
      () => {
        expect(screen.getByText("7 active quotas")).toBeVisible();
        expect(screen.getByText("120 classes remaining")).toBeVisible();
      },
      { timeout: 5000 }
    );
  });

  test("renders loading state when loading=true", async () => {
    viewModelRef.current = { ...mockViewModel, loading: true };

    renderInsights();

    await waitFor(() => {
      expect(screen.getAllByText("Quota Insights").length).toBeGreaterThan(0);
    });
  });

  test("renders error state when error=true", async () => {
    viewModelRef.current = { ...mockViewModel, error: true };

    renderInsights();

    await waitFor(() => {
      expect(screen.getByText("Failed to load quota data")).toBeVisible();
    });
  });

  test("renders insights view with data", async () => {
    viewModelRef.current = { ...mockViewModel, quotas: [mockQuota], loading: false, error: false };
    await assertInsightsRenders();
  });

  test("renders insights view with empty data", async () => {
    viewModelRef.current = { ...mockViewModel, quotas: [], loading: false, error: false };
    await assertInsightsRenders();
  });

  test("renders filter buttons for date range, kind, status, student", async () => {
    renderInsights();

    await waitFor(() => {
      expect(screen.getByText("Date Range")).toBeVisible();
    });
    expect(screen.getByText("Kind")).toBeVisible();
    expect(screen.getByText("Status")).toBeVisible();
    expect(screen.getByText("Student")).toBeVisible();
  });
});
