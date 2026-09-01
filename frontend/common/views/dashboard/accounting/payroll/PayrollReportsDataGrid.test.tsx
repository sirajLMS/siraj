import { afterEach, describe, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
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

const { CalculationStatus, CurrencyCode } = await import("@/frontend/common/graphql/generated/gql/graphql");
const { readTranslation } = await import("@/shared/locale/client/translation-cache-store");
const { DashboardBillingPayroll } = await import("@/shared/locale/namespaces");
const { renderWithWrapper } = await import("@/test/ui/components/TestWrapper");
const { PayrollReportsDataGrid } = await import(
  "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsDataGrid"
);
const { run: runAxe } = await import("axe-core");

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

// Warm the lazy-loaded namespace so component renders resolve translations
// synchronously instead of suspending on an unresolved promise.
await warmNamespace(() => readTranslation(DashboardBillingPayroll, locale));
const payrollLabels = readTranslation(DashboardBillingPayroll, locale);

/** Bridges the locale status labels (literal keys) onto the generated enum keys the status chip consumes. */
const statusLabels: Record<(typeof CalculationStatus)[keyof typeof CalculationStatus], string> = {
  [CalculationStatus.NotCalculated]: payrollLabels.status.NOT_CALCULATED,
  [CalculationStatus.Calculated]: payrollLabels.status.CALCULATED,
  [CalculationStatus.Partially]: payrollLabels.status.PARTIALLY,
  [CalculationStatus.Refund]: payrollLabels.status.REFUND,
  [CalculationStatus.WaitingPaid]: payrollLabels.status.WAITING_PAID,
  [CalculationStatus.Paid]: payrollLabels.status.PAID,
};

const PAYROLL_ROW = {
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
} as const;

const AGGREGATES = {
  totalPaidAmount: "250.00",
  totalPaidCurrency: CurrencyCode.Egp,
  rowCountByStatus: {
    [CalculationStatus.NotCalculated]: 0,
    [CalculationStatus.Calculated]: 1,
    [CalculationStatus.Partially]: 0,
    [CalculationStatus.Refund]: 0,
    [CalculationStatus.WaitingPaid]: 0,
    [CalculationStatus.Paid]: 0,
  },
} as const;

const onOverride = mock((_row: unknown) => {});
const onExportCsv = mock(() => Promise.resolve({ truncated: false }));
const onPageChange = mock((_page: number) => {});
const onPageSizeChange = mock((_pageSize: number) => {});

interface GridRenderOptions {
  readonly rows?: readonly PayrollReportRow[];
  readonly canManagePayroll?: boolean;
}

function renderGrid(options: GridRenderOptions = {}) {
  return renderWithWrapper(
    <PayrollReportsDataGrid
      labels={payrollLabels}
      statusLabels={statusLabels}
      rows={options.rows ?? [PAYROLL_ROW]}
      loading={false}
      totalCount={(options.rows ?? [PAYROLL_ROW]).length}
      page={0}
      pageSize={25}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      aggregates={AGGREGATES}
      canManagePayroll={options.canManagePayroll ?? true}
      onExportCsv={onExportCsv}
      onOverride={onOverride}
    />,
    { locale }
  );
}

// Happy DOM cannot compute visual styles, so the color-contrast rule stays
// incomplete there; it is excluded and contrast is covered by the theme tokens.
async function expectNoAxeViolations(container: HTMLElement): Promise<void> {
  const results = await runAxe(container, { rules: { "color-contrast": { enabled: false } } });
  expect(results.violations).toEqual([]);
}

afterEach(() => {
  cleanup();
  onOverride.mockClear();
  onExportCsv.mockClear();
  onPageChange.mockClear();
  onPageSizeChange.mockClear();
});

describe("PayrollReportsDataGrid (component)", () => {
  test("row status chips expose the full localized status text as their accessible name", async () => {
    renderGrid();

    const grid = await screen.findByRole("grid");
    // The row chip renders the status label text; its root element must carry
    // the same text as the aria-label so screen readers announce the status
    // rather than an unnamed colored chip.
    const rowChip = within(grid).getByText(payrollLabels.status.CALCULATED).closest("[aria-label]");
    expect(rowChip).not.toBeNull();
    expect(rowChip).toHaveAttribute("aria-label", payrollLabels.status.CALCULATED);
  });

  test("announces the active sort direction on sortable column headers", async () => {
    renderGrid();

    const grid = await screen.findByRole("grid");
    const header = within(grid).getByRole("columnheader", { name: new RegExp(payrollLabels.column.scheduledStart) });
    // Headers start unsorted; activating one announces the applied direction.
    fireEvent.click(within(header).getByText(payrollLabels.column.scheduledStart));
    await waitFor(() => {
      expect(header).toHaveAttribute("aria-sort", "ascending");
    });
  });

  test("passes axe accessibility checks with rows and the manager action column", async () => {
    const { container } = renderGrid();

    await screen.findByRole("grid");
    expect(screen.getByRole("button", { name: payrollLabels.override.action })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  test("passes axe accessibility checks in the empty state", async () => {
    const { container } = renderGrid({ rows: [], canManagePayroll: false });

    expect(await screen.findByText(payrollLabels.empty)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
