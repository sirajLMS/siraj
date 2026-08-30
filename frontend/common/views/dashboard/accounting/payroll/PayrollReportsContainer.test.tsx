import { afterEach, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { ComponentType, ReactNode } from "react";
import type {
  AppPermission as AppPermissionValue,
  PayrollReportFilter,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PayrollReportRow } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";

// This suite lives next to the component it covers, so the happydom preloads
// wired into the shared component-test runner never load on this path. The DOM
// is registered first and every module that touches `document` at import time
// (testing-library above all) is imported dynamically afterwards, keeping the
// file runnable through the standard single-file test runner.
GlobalRegistrator.register();

const { configure: configureRtl, cleanup, fireEvent, screen, waitFor, within } = await import("@testing-library/react");
configureRtl({ asyncUtilTimeout: 5000 });

// Imported dynamically (it pulls in @testing-library/dom, which must first see
// the registered global document) and destructured to drop the interop
// `default` key: expect.extend types reject it while the named matchers pass.
const { default: _jestDomDefault, ...jestDomMatchers } = await import("@testing-library/jest-dom/matchers");
expect.extend(jestDomMatchers);

// The data grid routes its export outcome toasts through the Toolpad
// notifications hook; a minimal mock keeps the provider chain free.
const showNotification = mock((_message: string, _options?: unknown) => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

// The desktop tier view's page header derives its breadcrumbs from
// usePathname(), which returns null outside a Next router; the shared
// navigation mock pins the payroll route instead. Only next/navigation is
// mocked: the view chain also loads the real @/shared/i18n barrel, whose
// `export *` re-exports turn ambiguous once the routing module is replaced.
const { mockNextNavigation } = await import("@/test/ui/components/helpers/mockNavigation");
await mockNextNavigation("/accounting/payroll", { includeI18nMocks: false });

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

const { AppPermission, CalculationStatus, CurrencyCode } = await import(
  "@/frontend/common/graphql/generated/gql/graphql"
);
const { payrollReportQueryDocument } = await import("@/frontend/common/graphql/sharedDocuments");
const { readTranslation } = await import("@/shared/locale/client/translation-cache-store");
const { DashboardBillingPayroll } = await import("@/shared/locale/namespaces");
const { Translation } = await import("@/shared/locale/namespaces/translation");
const { renderWithWrapper } = await import("@/test/ui/components/TestWrapper");
const { usePayrollReportsFilterStore } = await import("@/frontend/common/stores/payrollReportsFilterStore");
const { buildPayrollExportCsvUrl } = await import(
  "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel"
);
const { PayrollReportsContainer } = await import(
  "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsContainer"
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
// synchronously instead of suspending on an unresolved promise.
await Promise.all([
  warmNamespace(() => readTranslation(DashboardBillingPayroll, locale)),
  warmNamespace(() => readTranslation(Translation.Common, locale)),
]);
const payrollLabels = readTranslation(DashboardBillingPayroll, locale);
const commonLabels = readTranslation(Translation.Common, locale);

const originalFetch = globalThis.fetch;

const PAYROLL_ROW: PayrollReportRow = {
  id: "instance-1",
  instanceId: "instance-1",
  scheduledStartAt: "2026-08-26T16:00:00.000Z",
  scheduledEndAt: "2026-08-26T17:00:00.000Z",
  scheduledDurationMinutes: 60,
  actualStartAt: "2026-08-26T16:02:00.000Z",
  actualEndAt: "2026-08-26T17:01:00.000Z",
  calculatedDuration: 60,
  teacherPaidAmount: "250.00",
  teacherPaidCurrency: CurrencyCode.Egp,
  calculationStatus: CalculationStatus.Calculated,
  isPartialPercentage: null,
  payrollNote: "Auto-calculated on completion",
  teacherId: "teacher-1",
  teacherName: "Karim Mansour",
  studentId: "student-1",
  studentName: "Layla Hassan",
  subjectId: "subject-1",
  subjectName: "Quran — Tajwid",
  isStudentAbsence: false,
  isTeacherAbsence: false,
};

/** Variables of the report query's first page at the store's default size. */
function reportQueryVariables(filter: PayrollReportFilter | null): {
  readonly filter: PayrollReportFilter | null;
  readonly limit: number;
  readonly offset: number;
} {
  return { filter, limit: 25, offset: 0 };
}

/** Filter the debounced "Karim" search settles into. */
const SEARCH_FILTER: PayrollReportFilter = {
  teacherId: null,
  studentId: null,
  dateFrom: null,
  dateTo: null,
  calculationStatuses: null,
  search: "Karim",
};

/** Serializes the fetch call target the same way the browser would report it. */
function requestUrl(input: RequestInfo | URL): string {
  if (input instanceof URL) return input.href;
  if (typeof input === "string") return input;
  return input.url;
}

/** Report page mock; the optional callback counts actual network requests. */
function reportMock(
  rows: readonly PayrollReportRow[],
  filter: PayrollReportFilter | null,
  onRequest?: () => void
): MockLink.MockedResponse {
  return {
    request: { query: payrollReportQueryDocument, variables: reportQueryVariables(filter) },
    result: () => {
      onRequest?.();
      return {
        data: {
          payrollReport: {
            id: "payroll-report-page-1",
            totalCount: rows.length,
            rows: [...rows],
            aggregates: {
              id: "payroll-report-aggregates-1",
              totalPaidAmount: "250.00",
              totalPaidCurrency: CurrencyCode.Egp,
              rowCountByStatus: {},
            },
          },
        },
      };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

interface ContainerRenderOptions {
  readonly mocks?: MockLink.MockedResponse[];
  readonly permissions?: AppPermissionValue[];
}

function renderContainer(options: ContainerRenderOptions = {}) {
  return renderWithWrapper(<PayrollReportsContainer />, {
    locale,
    viewport: "desktop",
    permissions: options.permissions ?? [AppPermission.AccountingPayrollView, AppPermission.AccountingPayrollManage],
    mocks: options.mocks ?? [],
  });
}

afterEach(() => {
  cleanup();
  usePayrollReportsFilterStore.getState().reset();
  globalThis.fetch = originalFetch;
  showNotification.mockClear();
});

describe("PayrollReportsContainer (component)", () => {
  test("renders report rows with their status chips and column headers", async () => {
    renderContainer({ mocks: [reportMock([PAYROLL_ROW], null)] });

    expect(await screen.findByText(PAYROLL_ROW.teacherName ?? "")).toBeInTheDocument();
    expect(screen.getByText(PAYROLL_ROW.studentName ?? "")).toBeInTheDocument();
    expect(screen.getByText(PAYROLL_ROW.subjectName ?? "")).toBeInTheDocument();
    // The row status chip and the aggregate footer chip both carry the label.
    expect(screen.getAllByText(payrollLabels.status.CALCULATED).length).toBeGreaterThan(1);
    expect(screen.getByText(payrollLabels.column.scheduledStart)).toBeInTheDocument();
    expect(screen.getByText(payrollLabels.column.paidAmount)).toBeInTheDocument();
  });

  test("debounces the search filter before re-querying the report", async () => {
    let queryRequests = 0;
    const countRequest = () => {
      queryRequests += 1;
    };
    renderContainer({
      mocks: [reportMock([PAYROLL_ROW], null, countRequest), reportMock([PAYROLL_ROW], SEARCH_FILTER, countRequest)],
    });

    expect(await screen.findByText(PAYROLL_ROW.teacherName ?? "")).toBeInTheDocument();
    expect(queryRequests).toBe(1);

    fireEvent.change(screen.getByLabelText(payrollLabels.filters.search), { target: { value: "Karim" } });

    // The keystroke is stored raw; the settled filter reaches the server only
    // after the debounce window.
    expect(queryRequests).toBe(1);
    await waitFor(() => {
      expect(queryRequests).toBe(2);
    });
  });

  test("shows the translated empty state when the report has no rows", async () => {
    renderContainer({ mocks: [reportMock([], null)] });

    expect(await screen.findByText(payrollLabels.empty)).toBeInTheDocument();
  });

  test("labels every filter control with its localized accessible name", async () => {
    renderContainer({ mocks: [reportMock([PAYROLL_ROW], null)] });

    expect(await screen.findByText(PAYROLL_ROW.teacherName ?? "")).toBeInTheDocument();
    // Each filter input exposes its localized label to assistive tech: the
    // free-text search via aria-label, the person autocompletes and the status
    // multi-select through their form labels, the date bounds through their
    // from/to labels.
    expect(screen.getByLabelText(payrollLabels.filters.search)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: payrollLabels.filters.teacher })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: payrollLabels.filters.student })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: payrollLabels.filters.status })).toBeInTheDocument();
    // The collapsed date-range trigger carries the range label; opening it
    // surfaces the from/to bounds, each with its own label.
    fireEvent.click(screen.getByRole("textbox", { name: payrollLabels.filters.dateRange }));
    await waitFor(() => {
      expect(screen.getByLabelText(payrollLabels.filters.dateFrom)).toBeInTheDocument();
      expect(screen.getByLabelText(payrollLabels.filters.dateTo)).toBeInTheDocument();
    });

    // Activating a filter surfaces the clear affordance, also named.
    fireEvent.change(screen.getByLabelText(payrollLabels.filters.search), { target: { value: "Karim" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: payrollLabels.filters.clear })).toBeInTheDocument();
    });
  });

  test("downloads the filtered CSV from the URL the view model builds", async () => {
    let queryRequests = 0;
    const countRequest = () => {
      queryRequests += 1;
    };
    // The CSV download runs through global fetch; the swapped-in stand-in
    // records the requested URLs and answers with a successful CSV response.
    const exportResponse = new Response("teacherId,studentId\n", {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="payroll-report.csv"',
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
      mocks: [reportMock([PAYROLL_ROW], null, countRequest), reportMock([PAYROLL_ROW], SEARCH_FILTER, countRequest)],
    });

    expect(await screen.findByText(PAYROLL_ROW.teacherName ?? "")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(payrollLabels.filters.search), { target: { value: "Karim" } });
    // The debounced filter must settle before the export serializes it.
    await waitFor(() => {
      expect(queryRequests).toBe(2);
    });

    fireEvent.click(screen.getByRole("button", { name: payrollLabels.exportCsv }));

    const expectedUrl = buildPayrollExportCsvUrl({
      teacherId: null,
      studentId: null,
      dateFrom: null,
      dateTo: null,
      calculationStatuses: [],
      search: "Karim",
    });
    await waitFor(() => {
      expect(requestedUrls).toHaveLength(1);
    });
    expect(requestedUrls[0]).toBe(expectedUrl);
    expect(expectedUrl).toBe("/api/payroll/export?search=Karim");
    // A successful, non-truncated download stays silent.
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("hides the Override action and its column without the manage permission", async () => {
    renderContainer({
      permissions: [AppPermission.AccountingPayrollView],
      mocks: [reportMock([PAYROLL_ROW], null)],
    });

    expect(await screen.findByText(PAYROLL_ROW.teacherName ?? "")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: payrollLabels.override.action })).toBeNull();
    // The actions column is not rendered at all, not merely emptied.
    expect(screen.queryByText(payrollLabels.column.actions)).toBeNull();
    // Read-only operators still export.
    expect(screen.getByRole("button", { name: payrollLabels.exportCsv })).toBeInTheDocument();
  });

  test("opens the override dialog from a row action and refetches the report on close", async () => {
    let queryRequests = 0;
    const countRequest = () => {
      queryRequests += 1;
    };
    renderContainer({ mocks: [reportMock([PAYROLL_ROW], null, countRequest)] });

    expect(await screen.findByText(PAYROLL_ROW.teacherName ?? "")).toBeInTheDocument();
    expect(queryRequests).toBe(1);
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: payrollLabels.override.action }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(payrollLabels.override.title)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: commonLabels.cancel }));

    // Closing the dialog refreshes the report rows.
    await waitFor(() => {
      expect(queryRequests).toBe(2);
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
