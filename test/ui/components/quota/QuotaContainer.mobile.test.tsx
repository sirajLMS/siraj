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

import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "en";
const mockLabels = readTranslation(Translation.Dashboard.BillingQuota, locale);

await mock.module("@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel", () => ({
  useQuotaViewModel: () => mockViewModel,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { QuotaListMobile } from "@/frontend/mobile/views/dashboard/billing/quota/quotaList.mobile";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

await mockNextNavigation();

let mockViewModel = {
  t: mockLabels,
  quotas: [] as QuotaItem[],
  totalCount: 0,
  loading: false,
  page: 0,
  pageSize: 10,
  setPage: (_page: number) => {},
  setPageSize: (_size: number) => {},
  filterStatus: null as QuotaStatus | null,
  filterKind: null as QuotaKind | null,
  searchQuery: "",
  setFilterStatus: (_status: QuotaStatus | null) => {},
  setFilterKind: (_kind: QuotaKind | null) => {},
  setSearchQuery: (_query: string) => {},
  handleDelete: async () => {},
};

function QuotaListMobileTestView(): ReactElement {
  return <QuotaListMobile {...mockViewModel} />;
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

describe("QuotaContainer — mobile", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders mobile view header", async () => {
    renderWithWrapper(<QuotaListMobileTestView />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getAllByText(mockLabels.title).length).toBeGreaterThan(0);
    });
  });

  test("no MuiDataGrid-root on mobile view", async () => {
    mockViewModel = { ...mockViewModel, quotas: [mockQuota], totalCount: 1 };

    renderWithWrapper(<QuotaListMobileTestView />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getByText("Summer Package")).toBeVisible();
    });
    expect(document.querySelector(".MuiDataGrid-root")).toBeNull();
  });

  test("renders quota name in card list on mobile", async () => {
    mockViewModel = { ...mockViewModel, quotas: [mockQuota], totalCount: 1 };

    renderWithWrapper(<QuotaListMobileTestView />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getByText("Summer Package")).toBeVisible();
    });
  });

  test("renders loading state when loading=true on mobile", async () => {
    mockViewModel = { ...mockViewModel, loading: true, quotas: [] };

    renderWithWrapper(<QuotaListMobileTestView />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getAllByText(mockLabels.title).length).toBeGreaterThan(0);
    });
  });

  test("renders empty state when no quotas on mobile", async () => {
    mockViewModel = { ...mockViewModel, quotas: [], totalCount: 0, loading: false };

    renderWithWrapper(<QuotaListMobileTestView />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getAllByText(mockLabels.title).length).toBeGreaterThan(0);
    });
  });
});
