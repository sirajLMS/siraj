import { afterEach, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { ComponentType, ReactNode } from "react";
import type {
  AppPermission as AppPermissionValue,
  CarryoverFilter,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  CarryoverFilterFields,
  CarryoverRow,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";

// This suite lives next to the component it covers, so the happydom preloads
// wired into the shared component-test runner never load on this path. The DOM
// is registered first and every module that touches `document` at import time
// (testing-library above all) is imported dynamically afterwards, keeping the
// file runnable through the standard single-file test runner.
GlobalRegistrator.register();

const { configure: configureRtl, cleanup, fireEvent, screen, waitFor } = await import("@testing-library/react");
configureRtl({ asyncUtilTimeout: 5000 });

// Imported dynamically (it pulls in @testing-library/dom, which must first see
// the registered global document) and destructured to drop the interop
// `default` key: expect.extend types reject it while the named matchers pass.
const { default: _jestDomDefault, ...jestDomMatchers } = await import("@testing-library/jest-dom/matchers");
expect.extend(jestDomMatchers);

// The grid routes its export outcome toasts through the Toolpad notifications
// hook; a minimal mock keeps the provider chain free.
const showNotification = mock((_message: string, _options?: unknown) => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

// The desktop tier view's page header derives its breadcrumbs from
// usePathname(), which returns null outside a Next router; the shared
// navigation mock pins the carryover route instead. Only next/navigation is
// mocked: the view chain also loads the real @/shared/i18n barrel, whose
// `export *` re-exports turn ambiguous once the routing module is replaced.
const { mockNextNavigation } = await import("@/test/ui/components/helpers/mockNavigation");
await mockNextNavigation("/accounting/carryover", { includeI18nMocks: false });

// The container lazily loads its responsive tier views through next/dynamic,
// which needs a Next runtime the single-file test runner does not provide. The
// stand-in resolves the importer once and swaps the view in when it settles,
// mirroring the shared component-test preload.
const { createElement, useState } = await import("react");

await mock.module("next/dynamic", () => {
  function dynamic<TProps extends Record<string, unknown>>(
    importer: () => Promise<{ default: ComponentType<TProps> }>,
    options?: { readonly ssr?: boolean; readonly loading?: () => ReactNode }
  ): ComponentType<TProps> {
    let resolved: ComponentType<TProps> | null = null;
    let pending: Promise<ComponentType<TProps>> | null = null;
    function DynamicComponent(props: TProps): ReactNode {
      const [, forceRender] = useState({});
      if (resolved === null) {
        pending ??= importer().then(mod => {
          resolved = mod.default;
          forceRender({});
          return mod.default;
        });
        pending.catch(() => {});
      }
      return resolved !== null ? createElement(resolved, props) : (options?.loading?.() ?? null);
    }
    return DynamicComponent;
  }
  return { default: dynamic };
});

const { AppPermission, CurrencyCode } = await import("@/frontend/common/graphql/generated/gql/graphql");
const { carryoverBalancesQueryDocument } = await import("@/frontend/common/graphql/sharedDocuments");
const { readTranslation } = await import("@/shared/locale/client/translation-cache-store");
const { DashboardAccountingCarryover, DashboardAccountingPayments } = await import("@/shared/locale/namespaces");
const { Translation } = await import("@/shared/locale/namespaces/translation");
const { renderWithWrapper } = await import("@/test/ui/components/TestWrapper");
const { useCarryoverFilterStore } = await import("@/frontend/common/stores/carryoverFilterStore");
const { buildCarryoverExportCsvUrl } = await import(
  "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel"
);
const { run: runAxe } = await import("axe-core");
const { CarryoverContainer } = await import(
  "@/frontend/common/views/dashboard/accounting/carryover/CarryoverContainer"
);

const locale: AppLocale = "en";

/** Resolves a lazy namespace warm-up: readTranslation throws its pending
 * promise on a cache miss, which must be awaited before the read resolves. */
async function warmNamespace(warm: () => void): Promise<void> {
  try {
    warm();
  } catch (thrown) {
    if (thrown instanceof Promise) await thrown;
  }
}

// Warm the lazy-loaded namespaces so component renders resolve translations
// synchronously instead of suspending on an unresolved promise. The grid also
// borrows the payments column labels (actions/createdAt), so both warm here.
await Promise.all([
  warmNamespace(() => readTranslation(DashboardAccountingCarryover, locale)),
  warmNamespace(() => readTranslation(Translation.Common, locale)),
  warmNamespace(() => readTranslation(DashboardAccountingPayments, locale)),
]);
const labels = readTranslation(DashboardAccountingCarryover, locale);
const paymentsLabels = readTranslation(DashboardAccountingPayments, locale);

const originalFetch = globalThis.fetch;

const CARRYOVER_ROW: CarryoverRow = {
  id: "carryover-1",
  teacherId: "teacher-1",
  teacherName: "Karim Mansour",
  teacherAvatarUrl: null,
  isDisabledTeacher: false,
  studentsCount: 2,
  studentsText: "Layla Hassan, Omar Adel",
  totalDuration: "4.50",
  payable: "1250.00",
  teacherCurrency: CurrencyCode.Egp,
  isPaid: false,
  paid: null,
  paidAt: null,
  paymentDate: null,
  expenseId: null,
  fromDate: "2026-08-01",
  toDate: "2026-08-15",
  note: null,
  linkedSessionCount: 2,
  createdAt: "2026-08-20T00:00:00.000Z",
};

const PAID_ROW: CarryoverRow = {
  ...CARRYOVER_ROW,
  id: "carryover-2",
  teacherId: "teacher-2",
  teacherName: "Sara Adel",
  isPaid: true,
  payable: "800.00",
  paid: "800.00",
  paidAt: "2026-08-25T10:00:00.000Z",
  paymentDate: "2026-08-25",
};

/** The debounced "Karim" search settles into this filter on the second query. */
const SEARCH_FILTER: CarryoverFilter = {
  teacherId: null,
  paidStatus: null,
  dateFrom: null,
  dateTo: null,
  includeDisabledTeachers: false,
  search: "Karim",
};

/** Variables of the list query's first page at the store's default page size. */
function listQueryVariables(filter: CarryoverFilter | null): {
  readonly filter: CarryoverFilter | null;
  readonly limit: number;
  readonly offset: number;
} {
  return { filter, limit: 50, offset: 0 };
}

/** Serializes the fetch call target the same way the browser would report it. */
function requestUrl(input: RequestInfo | URL): string {
  if (input instanceof URL) return input.href;
  if (typeof input === "string") return input;
  return input.url;
}

/** List-page mock; the optional callback counts actual network requests. */
function pageMock(
  rows: readonly CarryoverRow[],
  filter: CarryoverFilter | null,
  onRequest?: () => void
): MockLink.MockedResponse {
  return {
    request: { query: carryoverBalancesQueryDocument, variables: listQueryVariables(filter) },
    result: () => {
      onRequest?.();
      return {
        data: {
          carryoverBalances: {
            id: "carryover-page-1",
            totalCount: rows.length,
            rows: [...rows],
            aggregates: {
              id: "carryover-aggregates-1",
              totalPayable: "2050.00",
              totalPaid: "800.00",
              dominantCurrency: CurrencyCode.Egp,
              rowCountByPaid: { paid: 1, unpaid: 1 },
            },
          },
        },
      };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

/** Export-serialized filter fields for the settled "Karim" search. */
const EXPORT_FIELDS: CarryoverFilterFields = {
  teacherId: null,
  paidStatus: "Both",
  dateFrom: null,
  dateTo: null,
  includeDisabledTeachers: false,
  search: "Karim",
};

interface ContainerRenderOptions {
  readonly mocks?: MockLink.MockedResponse[];
  readonly permissions?: AppPermissionValue[];
}

// Happy DOM cannot compute visual styles, so the color-contrast rule stays
// incomplete there; it is excluded and contrast is covered by the theme tokens.
// Heading order is owned by the shared desktop layout primitives (page header
// then section-panel title), not by this page's markup, so the rule is left to
// the shared-component owners.
async function expectNoAxeViolations(container: HTMLElement): Promise<void> {
  const results = await runAxe(container, {
    rules: { "color-contrast": { enabled: false }, "heading-order": { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

function renderContainer(options: ContainerRenderOptions = {}) {
  return renderWithWrapper(<CarryoverContainer />, {
    locale,
    viewport: "desktop",
    permissions: options.permissions ?? [
      AppPermission.AccountingCarryoverView,
      AppPermission.AccountingCarryoverManage,
    ],
    mocks: options.mocks ?? [],
  });
}

afterEach(() => {
  cleanup();
  useCarryoverFilterStore.getState().reset();
  globalThis.fetch = originalFetch;
  showNotification.mockClear();
});

describe("CarryoverContainer (component)", () => {
  test("renders carryover rows with their chips and column headers", async () => {
    const { container } = renderContainer({ mocks: [pageMock([CARRYOVER_ROW, PAID_ROW], null)] });

    expect(await screen.findByText(CARRYOVER_ROW.teacherName ?? "")).toBeInTheDocument();
    expect(screen.getByText(PAID_ROW.teacherName ?? "")).toBeInTheDocument();
    expect(screen.getByText(CARRYOVER_ROW.studentsText ?? "")).toBeInTheDocument();
    expect(screen.getByText(labels.column.teacher)).toBeInTheDocument();
    expect(screen.getByText(labels.column.payable)).toBeInTheDocument();
    // The row chips and the aggregate footer tally chips share the paid label.
    expect(screen.getAllByText(labels.chip.paid).length).toBeGreaterThan(1);
    expect(screen.getByText(labels.chip.unpaid)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  test("debounces the search filter before re-querying the list", async () => {
    let queryRequests = 0;
    const countRequest = () => {
      queryRequests += 1;
    };
    renderContainer({
      mocks: [pageMock([CARRYOVER_ROW], null, countRequest), pageMock([CARRYOVER_ROW], SEARCH_FILTER, countRequest)],
    });

    expect(await screen.findByText(CARRYOVER_ROW.teacherName ?? "")).toBeInTheDocument();
    expect(queryRequests).toBe(1);

    fireEvent.change(screen.getByLabelText(labels.filters.searchPlaceholder), { target: { value: "Karim" } });

    // The keystroke stays local instantly; the settled filter reaches the
    // server only after the filter-bar and view-model debounce windows close.
    expect(queryRequests).toBe(1);
    await waitFor(() => {
      expect(queryRequests).toBe(2);
    });
  });

  test("shows the translated empty state when no carryovers match", async () => {
    renderContainer({ mocks: [pageMock([], null)] });

    expect(await screen.findByText(labels.empty)).toBeInTheDocument();
  });

  test("downloads the filtered CSV from the URL the view model builds", async () => {
    let queryRequests = 0;
    const countRequest = () => {
      queryRequests += 1;
    };
    // The CSV download runs through global fetch; the swapped-in stand-in
    // records the requested URLs and answers with a successful CSV response.
    const exportResponse = new Response("teacherId,payable\n", {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="carryover-balances.csv"',
        "X-Export-Truncated": "false",
      },
    });
    const requestedUrls: string[] = [];
    const exportFetch: typeof fetch = Object.assign(
      async (input: RequestInfo | URL) => {
        requestedUrls.push(requestUrl(input));
        return exportResponse;
      },
      { preconnect: () => {} }
    );
    globalThis.fetch = exportFetch;

    renderContainer({
      mocks: [pageMock([CARRYOVER_ROW], null, countRequest), pageMock([CARRYOVER_ROW], SEARCH_FILTER, countRequest)],
    });

    expect(await screen.findByText(CARRYOVER_ROW.teacherName ?? "")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(labels.filters.searchPlaceholder), { target: { value: "Karim" } });
    // The debounced filter must settle before the export serializes it.
    await waitFor(() => {
      expect(queryRequests).toBe(2);
    });

    fireEvent.click(screen.getByRole("button", { name: labels.action.exportCsv }));

    const expectedUrl = buildCarryoverExportCsvUrl(EXPORT_FIELDS);
    await waitFor(() => {
      expect(requestedUrls).toHaveLength(1);
    });
    expect(requestedUrls[0]).toBe(expectedUrl);
    expect(expectedUrl).toBe("/api/carryover/export?search=Karim&includeDisabledTeachers=false");
    // A successful, non-truncated download stays silent.
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("keeps read affordances and hides write controls without the manage permission", async () => {
    renderContainer({
      permissions: [AppPermission.AccountingCarryoverView],
      mocks: [pageMock([CARRYOVER_ROW], null)],
    });

    expect(await screen.findByText(CARRYOVER_ROW.teacherName ?? "")).toBeInTheDocument();
    // Write actions stay manage-gated: no bulk controls and no Add New.
    expect(screen.queryByRole("button", { name: labels.action.addNew })).toBeNull();
    expect(screen.queryByRole("button", { name: labels.action.bulkToExpense })).toBeNull();
    expect(screen.queryByRole("button", { name: labels.action.bulkDelete })).toBeNull();
    // Export is a read-level download and stays available to viewers.
    expect(screen.getByRole("button", { name: labels.action.exportCsv })).toBeInTheDocument();
    // The actions column still renders: it hosts the viewer-facing View Sessions entry.
    expect(screen.getByText(paymentsLabels.columns.actions)).toBeInTheDocument();
  });
});
