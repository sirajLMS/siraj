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

await mock.module("@/frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel", () => ({
  useQuotaDetailViewModel: () => mockViewModel,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { QuotaItem, QuotaLedgerItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { QuotaDetailDesktop } from "@/frontend/desktop/views/dashboard/billing/quota/quotaDetail.desktop";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

await mockNextNavigation();

let mockViewModel = {
  t: mockLabels,
  quota: null as QuotaItem | null,
  loadingQuota: false,
  notFound: false,
  ledgerEntries: [] as QuotaLedgerItem[],
  ledgerTotalCount: 0,
  loadingLedger: false,
  ledgerPage: 0,
  setLedgerPage: (_page: number) => {},
  ledgerPageSize: 10,
  deleteDialogOpen: false,
  deleting: false,
  onDeleteDialogOpen: () => {},
  onDeleteDialogClose: () => {},
  onDeleteConfirm: () => {},
  deleteErrorOpen: false,
  onDeleteErrorClose: () => {},
};

function QuotaDetailDesktopTestView(): ReactElement {
  return <QuotaDetailDesktop {...mockViewModel} />;
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

describe("QuotaDetailContainer", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders loading skeleton while quota query is loading", async () => {
    mockViewModel = { ...mockViewModel, loadingQuota: true, quota: null };

    const { container } = renderWithWrapper(<QuotaDetailDesktopTestView />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  test("renders quota name as page title when quota is found", async () => {
    mockViewModel = { ...mockViewModel, quota: mockQuota, loadingQuota: false };

    renderWithWrapper(<QuotaDetailDesktopTestView />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(screen.getAllByText("Summer Package").length).toBeGreaterThan(0);
    });
  });

  test("renders ledger section title", async () => {
    mockViewModel = { ...mockViewModel, quota: mockQuota, loadingQuota: false };

    renderWithWrapper(<QuotaDetailDesktopTestView />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(screen.getAllByText(mockLabels.ledger.title).length).toBeGreaterThan(0);
    });
  });

  test("renders delete button in actions", async () => {
    mockViewModel = { ...mockViewModel, quota: mockQuota, loadingQuota: false };

    renderWithWrapper(<QuotaDetailDesktopTestView />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(screen.getByText(mockLabels.actions.delete)).toBeVisible();
    });
  });

  test("renders edit button in actions", async () => {
    mockViewModel = { ...mockViewModel, quota: mockQuota, loadingQuota: false };

    renderWithWrapper(<QuotaDetailDesktopTestView />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(screen.getByText(mockLabels.actions.edit)).toBeVisible();
    });
  });

  test("opens delete dialog when delete button clicked", async () => {
    const onDeleteDialogOpen = mock(() => {});
    mockViewModel = { ...mockViewModel, quota: mockQuota, loadingQuota: false, onDeleteDialogOpen };

    renderWithWrapper(<QuotaDetailDesktopTestView />, { locale, viewport: "desktop" });

    await waitFor(() => {
      expect(screen.getByText(mockLabels.actions.delete)).toBeVisible();
    });
    fireEvent.click(screen.getByText(mockLabels.actions.delete));
    expect(onDeleteDialogOpen).toHaveBeenCalledTimes(1);
  });

  test("renders null when quota is null and not loading", () => {
    mockViewModel = { ...mockViewModel, quota: null, loadingQuota: false };

    const { container } = renderWithWrapper(<QuotaDetailDesktopTestView />, { locale, viewport: "desktop" });

    expect(container.firstChild).toBeNull();
  });
});
