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

await mock.module("@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel", () => ({
  useQuotaViewModel: () => mockViewModel,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { QuotaListDesktop } from "@/frontend/desktop/views/dashboard/billing/quota/quotaList.desktop";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

await mockNextNavigation();

function QuotaListDesktopTestView(): ReactElement {
  return <QuotaListDesktop {...mockViewModel} />;
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

describe("QuotaContainer — desktop", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders desktop view header", async () => {
    renderWithWrapper(<QuotaListDesktopTestView />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(screen.getAllByText(mockLabels.listTitle).length).toBeGreaterThan(0);
    });
  });

  test("renders DataGrid when quotas exist", async () => {
    mockViewModel = { ...mockViewModel, quotas: [mockQuota], totalCount: 1 };

    renderWithWrapper(<QuotaListDesktopTestView />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(document.querySelector(".MuiDataGrid-root")).not.toBeNull();
    });
  });

  test("renders quota name in DataGrid", async () => {
    mockViewModel = { ...mockViewModel, quotas: [mockQuota], totalCount: 1 };

    renderWithWrapper(<QuotaListDesktopTestView />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(screen.getByText("Summer Package")).toBeVisible();
    });
  });

  test("renders loading state when loading=true", async () => {
    mockViewModel = { ...mockViewModel, loading: true, quotas: [] };

    renderWithWrapper(<QuotaListDesktopTestView />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(document.querySelector(".MuiDataGrid-root")).not.toBeNull();
    });
  });

  test("renders empty state when no quotas", async () => {
    mockViewModel = { ...mockViewModel, quotas: [], totalCount: 0, loading: false };

    renderWithWrapper(<QuotaListDesktopTestView />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(document.querySelector(".MuiDataGrid-root")).not.toBeNull();
    });
  });
});
