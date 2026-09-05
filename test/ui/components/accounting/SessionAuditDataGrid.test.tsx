import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const locale = "en";

const routerPush = mock((_href: string) => undefined);
await mockNextNavigation("/accounting/reports", { locale, mockPush: routerPush });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { run as runAxe } from "axe-core";

expect.extend(matchers);

import {
  CalculationStatus,
  CurrencyCode,
  OrderSortDirection,
  SessionAuditReportSortField,
  SessionAuditStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { formatPaidAmount } from "@/frontend/common/views/dashboard/billing/accounting/reports/formatters/sessionAuditCellFormatters";
import {
  SessionAuditDataGrid,
  type SessionAuditDataGridProps,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const labels = readTranslation(Translation.Dashboard.SessionAudit, locale);
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);

const DEFAULT_AGGREGATES: SessionAuditDataGridProps["aggregates"] = {
  rowCountByStatus: {
    [SessionAuditStatus.Open]: 0,
    [SessionAuditStatus.End]: 1,
    [SessionAuditStatus.Absent]: 0,
    [SessionAuditStatus.AbsentStudent]: 0,
  },
  rowCountByPaid: { paid: 1, unpaid: 0 },
  totalPaidAmount: "45.00",
  totalPaidCurrency: CurrencyCode.Usd,
};

function makeRow(overrides: Partial<SessionAuditReportRow> = {}): SessionAuditReportRow {
  return {
    id: "instance-1",
    instanceId: "instance-1",
    scheduledStartAt: "2026-08-26T08:00:00.000Z",
    scheduledEndAt: "2026-08-26T09:00:00.000Z",
    durationMinutes: 60,
    actualStartAt: "2026-08-26T08:05:00.000Z",
    actualEndAt: "2026-08-26T08:58:00.000Z",
    bookingTimezone: "Africa/Cairo",
    currentStatus: SessionAuditStatus.End,
    calculatedDuration: 53,
    teacherPaidAmount: "45.00",
    teacherPaidCurrency: CurrencyCode.Usd,
    calculationStatus: CalculationStatus.Paid,
    isPartialPercentage: null,
    payrollNote: "Approved after review.",
    teacherId: "teacher-1",
    teacherName: "Ahmed Hassan",
    studentId: "student-1",
    studentName: "Sarah Ahmed",
    subjectName: "Mathematics",
    teacherDuePaymentDate: "2026-08-28T10:00:00.000Z",
    ...overrides,
  };
}

type GridOverrides = Partial<
  Pick<
    SessionAuditDataGridProps,
    | "rows"
    | "totalCount"
    | "aggregates"
    | "isLoading"
    | "error"
    | "canManageReports"
    | "setSort"
    | "setPage"
    | "setPageSize"
    | "refetch"
    | "hasActiveFilters"
    | "clearFilters"
  >
>;

function renderGrid(overrides: GridOverrides = {}) {
  return render(
    <SessionAuditDataGrid
      labels={labels}
      rows={overrides.rows ?? [makeRow()]}
      totalCount={overrides.totalCount ?? 1}
      aggregates={overrides.aggregates ?? DEFAULT_AGGREGATES}
      isLoading={overrides.isLoading ?? false}
      error={overrides.error ?? null}
      refetch={overrides.refetch ?? (() => undefined)}
      sortField={SessionAuditReportSortField.ScheduledStartAt}
      sortDirection={OrderSortDirection.Desc}
      setSort={overrides.setSort ?? (() => undefined)}
      page={0}
      pageSize={50}
      setPage={overrides.setPage ?? (() => undefined)}
      setPageSize={overrides.setPageSize ?? (() => undefined)}
      canManageReports={overrides.canManageReports ?? false}
      hasActiveFilters={overrides.hasActiveFilters ?? false}
      clearFilters={overrides.clearFilters ?? (() => undefined)}
    />,
    { wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper locale={locale}>{children}</TestWrapper> }
  );
}

afterEach(() => {
  cleanup();
  routerPush.mockClear();
});

describe("SessionAuditDataGrid — rendering", () => {
  test("renders the report columns with localized headers", () => {
    renderGrid();
    expect(screen.getByText(labels.column.scheduledStart)).toBeInTheDocument();
    expect(screen.getByText(labels.column.openSessionTime)).toBeInTheDocument();
    expect(screen.getByText(labels.column.endSessionTime)).toBeInTheDocument();
    expect(screen.getByText(labels.column.paidAmount)).toBeInTheDocument();
  });

  test("renders row data from the view-model rows", () => {
    renderGrid();
    expect(screen.getByText("Ahmed Hassan")).toBeInTheDocument();
    expect(screen.getByText("Sarah Ahmed")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText(formatPaidAmount("45.00", CurrencyCode.Usd, locale, labels.cell))).toBeInTheDocument();
  });

  test("renders the audit status chip with the full status text as its aria-label", () => {
    renderGrid();
    expect(screen.getByLabelText(labels.status.end)).toBeInTheDocument();
  });

  test("renders the partial percentage column value for partially-calculated rows", () => {
    renderGrid({
      rows: [makeRow({ calculationStatus: CalculationStatus.Partially, isPartialPercentage: 50 })],
    });
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("renders the aggregate footer card when a dominant currency is reported", () => {
    renderGrid();
    expect(screen.getByText(labels.aggregate.totalPaid)).toBeInTheDocument();
  });

  test("omits only the currency total while the currency is unknown; counts still render", () => {
    renderGrid({ aggregates: { ...DEFAULT_AGGREGATES, totalPaidCurrency: null } });
    expect(screen.queryByText(labels.aggregate.totalPaid)).not.toBeInTheDocument();
    expect(screen.getByText(labels.aggregate.paidRows)).toBeInTheDocument();
    expect(screen.getAllByLabelText(labels.status.end).length).toBeGreaterThanOrEqual(1);
  });

  test("renders the empty state message when the report has no rows and is not loading", () => {
    renderGrid({ rows: [], totalCount: 0 });
    expect(screen.getByText(labels.emptyState.title)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.emptyState.cta })).not.toBeInTheDocument();
  });

  test("offers a clear-filters action in the empty state while filters are active", () => {
    const clearFilters = mock(() => undefined);
    renderGrid({ rows: [], totalCount: 0, hasActiveFilters: true, clearFilters });
    fireEvent.click(screen.getByRole("button", { name: labels.emptyState.cta }));
    expect(clearFilters).toHaveBeenCalled();
  });

  test("passes axe accessibility checks with a populated page", async () => {
    const { container } = renderGrid();
    const results = await runAxe(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});

describe("SessionAuditDataGrid — timestamp tooltips", () => {
  test("shows raw UTC and the booking timezone on hover over a room-entry cell", async () => {
    renderGrid();
    const row = screen.getByText("Ahmed Hassan").closest("[role='row']");
    expect(row).not.toBeNull();
    if (row === null) return;
    const timeCells = row.querySelectorAll("[data-field='actualStartAt'] span");
    const entryCell = timeCells[0];
    expect(entryCell).not.toBeNull();
    if (!(entryCell instanceof HTMLElement)) return;
    fireEvent.mouseOver(entryCell);
    expect(await screen.findByText(labels.tooltip.rawUtc("2026-08-26T08:05:00.000Z"))).toBeInTheDocument();
    expect(screen.getByText(labels.tooltip.bookingTimezone("Africa/Cairo"))).toBeInTheDocument();
  });

  test("renders not-joined placeholders in both time cells when the teacher never joined", () => {
    renderGrid({ rows: [makeRow({ actualStartAt: null, actualEndAt: null })] });
    expect(screen.getAllByText(labels.cell.notJoined)).toHaveLength(2);
    expect(screen.queryByText(labels.cell.inProgress)).not.toBeInTheDocument();
  });

  test("shows the in-progress placeholder only for a session that actually started", () => {
    renderGrid({ rows: [makeRow({ actualEndAt: null, currentStatus: SessionAuditStatus.Open })] });
    expect(screen.getByText(labels.cell.inProgress)).toBeInTheDocument();
    expect(screen.queryByText(labels.cell.notJoined)).not.toBeInTheDocument();
  });
});

describe("SessionAuditDataGrid — sorting", () => {
  test("maps a column-header click to the server sort pair", () => {
    const setSort = mock((_field: SessionAuditReportSortField, _direction: OrderSortDirection) => undefined);
    renderGrid({ setSort });
    fireEvent.click(screen.getByRole("columnheader", { name: labels.filters.teacher }));
    expect(setSort).toHaveBeenCalledWith(SessionAuditReportSortField.TeacherName, OrderSortDirection.Asc);
  });

  test("restores the default sort when the active sort is cleared (third click)", () => {
    const setSort = mock((_field: SessionAuditReportSortField, _direction: OrderSortDirection) => undefined);
    renderGrid({ setSort });
    fireEvent.click(screen.getByRole("columnheader", { name: labels.column.scheduledStart }));
    expect(setSort).toHaveBeenCalledWith(SessionAuditReportSortField.ScheduledStartAt, OrderSortDirection.Desc);
  });

  test("ignores header clicks on non-sortable columns", () => {
    const setSort = mock((_field: SessionAuditReportSortField, _direction: OrderSortDirection) => undefined);
    renderGrid({ setSort });
    fireEvent.click(screen.getByRole("columnheader", { name: labels.column.note }));
    expect(setSort).not.toHaveBeenCalled();
  });

  test("announces the active sort via aria-sort on the sorted column header", () => {
    renderGrid();
    expect(screen.getByRole("columnheader", { name: labels.column.scheduledStart })).toHaveAttribute(
      "aria-sort",
      "descending"
    );
  });
});

describe("SessionAuditDataGrid — pagination", () => {
  test("requests the next page from the 0-based server pager", () => {
    const setPage = mock((_page: number) => undefined);
    renderGrid({
      totalCount: 200,
      setPage,
      rows: Array.from({ length: 3 }, (_unused, index) =>
        makeRow({ id: `instance-${index}`, instanceId: `instance-${index}` })
      ),
    });
    fireEvent.click(screen.getByLabelText(adminLabels.nextPage));
    expect(setPage).toHaveBeenCalledWith(1);
  });
});

describe("SessionAuditDataGrid — navigation", () => {
  test("row click navigates to the session audit drawer without the override flag", () => {
    renderGrid();
    fireEvent.click(screen.getByText("Ahmed Hassan"));
    expect(routerPush).toHaveBeenCalledWith("/classes/instance-1/audit");
  });

  test("pressing Enter on a focused cell navigates to the session audit drawer", () => {
    renderGrid();
    const cell = screen.getByText("Sarah Ahmed").closest("[role='gridcell']");
    expect(cell).not.toBeNull();
    if (cell === null) return;
    fireEvent.keyDown(cell, { key: "Enter" });
    expect(routerPush).toHaveBeenCalledWith("/classes/instance-1/audit");
  });

  test("clicking the note cell does not navigate", () => {
    renderGrid();
    fireEvent.click(screen.getByText("Approved after review."));
    expect(routerPush).not.toHaveBeenCalled();
  });
});

describe("SessionAuditDataGrid — manage-gated row action", () => {
  test("renders the open-audit action and navigates with the override flag", () => {
    renderGrid({ canManageReports: true });
    fireEvent.click(screen.getByRole("button", { name: labels.action.openAuditPage }));
    expect(routerPush).toHaveBeenCalledWith("/classes/instance-1/audit?openOverride=1");
  });

  test("hides the open-audit action without the manage permission", () => {
    renderGrid({ canManageReports: false });
    expect(screen.queryByRole("button", { name: labels.action.openAuditPage })).not.toBeInTheDocument();
  });
});

describe("SessionAuditDataGrid — loading and error states", () => {
  test("keeps the grid busy while the query is loading", () => {
    renderGrid({ isLoading: true, rows: [] });
    expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "true");
  });

  test("renders the error state with a retry affordance when the query fails", () => {
    const refetch = mock(() => undefined);
    renderGrid({ error: new Error("query failed"), refetch });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});
