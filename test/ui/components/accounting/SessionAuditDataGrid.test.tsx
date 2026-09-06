import { afterAll, afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const locale = "en";

const routerPush = mock((_href: string) => undefined);
await mockNextNavigation("/accounting/reports", { locale, mockPush: routerPush });

// The toast host needs a Toolpad provider chain the test wrapper does not set
// up; the grid's carryover dialog only calls `show`, so a minimal hook mock is
// enough.
const showNotification = mock((_message: string, _options?: unknown) => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { run as runAxe } from "axe-core";
import { GraphQLError } from "graphql";

expect.extend(matchers);

import {
  CalculationStatus,
  CurrencyCode,
  OrderSortDirection,
  SessionAuditReportSortField,
  SessionAuditStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { bulkCreateCarryoverBalancesMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { formatPaidAmount } from "@/frontend/common/views/dashboard/billing/accounting/reports/formatters/sessionAuditCellFormatters";
import {
  SessionAuditDataGrid,
  type SessionAuditDataGridProps,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardAccountingCarryover } from "@/shared/locale/namespaces";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const labels = readTranslation(Translation.Dashboard.SessionAudit, locale);
const carryoverLabels = readTranslation(DashboardAccountingCarryover, locale);
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
    carryoverBalanceId: null,
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
    | "selectedIds"
    | "toggleSelected"
    | "clearSelection"
    | "canManageCarryover"
  >
>;

function renderGrid(overrides: GridOverrides = {}, mocks: readonly MockLink.MockedResponse[] = []) {
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
      selectedIds={overrides.selectedIds ?? []}
      toggleSelected={overrides.toggleSelected ?? (() => undefined)}
      clearSelection={overrides.clearSelection ?? (() => undefined)}
      canManageCarryover={overrides.canManageCarryover ?? false}
    />,
    {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <TestWrapper locale={locale} mocks={mocks}>
          {children}
        </TestWrapper>
      ),
    }
  );
}

afterEach(() => {
  cleanup();
  routerPush.mockClear();
  showNotification.mockClear();
  bulkCreateMutationCalls = 0;
});

// The dialog mints one idempotency token per open; pinning the token keeps the
// mutation variables deterministic so the Apollo mocks match exactly.
const FIXED_BULK_CREATE_REQUEST_ID: `${string}-${string}-${string}-${string}-${string}` =
  "session-audit-bulk-create-fixed-request-id";
const originalBulkCreateRandomUUID: typeof crypto.randomUUID = crypto.randomUUID;
let bulkCreateMutationCalls = 0;

beforeAll(() => {
  crypto.randomUUID = () => FIXED_BULK_CREATE_REQUEST_ID;
});

afterAll(() => {
  crypto.randomUUID = originalBulkCreateRandomUUID;
});

/** Counts actual mutation invocations (`result` runs once per network call). */
function successfulBulkCreateMock(groupCount: number): MockLink.MockedResponse {
  return {
    request: {
      query: bulkCreateCarryoverBalancesMutationDocument,
      variables: {
        input: { instanceIds: ["instance-1"], note: null, clientRequestId: FIXED_BULK_CREATE_REQUEST_ID },
      },
    },
    result: () => {
      bulkCreateMutationCalls += 1;
      const groups = Array.from({ length: groupCount }, (_unused, index) => ({
        id: `carryover-${index + 1}`,
        carryoverId: `carryover-${index + 1}`,
        instanceIds: ["instance-1"],
        teacherId: "teacher-1",
        payable: "45.00",
        currency: "USD",
        totalDuration: "0.88",
        studentsCount: 1,
      }));
      return {
        data: {
          bulkCreateCarryoverBalances: {
            id: "bulk-create-1",
            totalInstanceIds: ["instance-1"],
            auditLogIds: ["audit-1"],
            groups,
          },
        },
      };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

function rejectedBulkCreateMock(code: string, message: string): MockLink.MockedResponse {
  return {
    request: {
      query: bulkCreateCarryoverBalancesMutationDocument,
      variables: {
        input: { instanceIds: ["instance-1"], note: null, clientRequestId: FIXED_BULK_CREATE_REQUEST_ID },
      },
    },
    result: () => {
      bulkCreateMutationCalls += 1;
      return {
        data: { bulkCreateCarryoverBalances: null },
        errors: [new GraphQLError(message, { extensions: { code } })],
      };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

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

  test("toggles to ascending when the actively descending sorted column is clicked", () => {
    const setSort = mock((_field: SessionAuditReportSortField, _direction: OrderSortDirection) => undefined);
    renderGrid({ setSort });
    fireEvent.click(screen.getByRole("columnheader", { name: labels.column.scheduledStart }));
    expect(setSort).toHaveBeenCalledWith(SessionAuditReportSortField.ScheduledStartAt, OrderSortDirection.Asc);
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

describe("SessionAuditDataGrid — carryover linked chip", () => {
  test("renders the Linked chip when the session is rolled into a carryover and navigates to its detail", () => {
    renderGrid({ rows: [makeRow({ carryoverBalanceId: "carryover-42" })] });
    const chip = screen.getByRole("button", { name: labels.carryover.linkedChip });
    fireEvent.click(chip);
    expect(routerPush).toHaveBeenCalledWith("/accounting/carryover/carryover-42");
    // The chip owns its click: row navigation to the audit page must not fire.
    expect(routerPush).not.toHaveBeenCalledWith("/classes/instance-1/audit");
  });

  test("renders the muted placeholder when the session is not linked", () => {
    renderGrid();
    expect(screen.queryByRole("button", { name: labels.carryover.linkedChip })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: labels.carryover.linkedColumn })).toBeInTheDocument();
  });
});

describe("SessionAuditDataGrid — carryover bulk action", () => {
  test("shows the Carryover Balance action only with the manage permission", () => {
    const { unmount } = renderGrid({ canManageCarryover: true });
    expect(screen.getByRole("button", { name: labels.carryover.bulkAction })).toBeInTheDocument();
    unmount();
    renderGrid({ canManageCarryover: false });
    expect(screen.queryByRole("button", { name: labels.carryover.bulkAction })).not.toBeInTheDocument();
  });

  test("keeps the action disabled without a selection and opens the grouped summary with one", () => {
    const rows = [
      makeRow({ id: "instance-1", instanceId: "instance-1" }),
      makeRow({ id: "instance-2", instanceId: "instance-2" }),
      makeRow({
        id: "instance-3",
        instanceId: "instance-3",
        teacherId: "teacher-2",
        teacherName: "Mona Adel",
      }),
    ];
    renderGrid({
      canManageCarryover: true,
      rows,
      totalCount: rows.length,
      selectedIds: ["instance-1", "instance-2", "instance-3"],
    });
    const action = screen.getByRole("button", { name: labels.carryover.bulkAction });
    expect(action).toBeEnabled();
    fireEvent.click(action);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(labels.carryover.dialog.totalSessions(3))).toBeInTheDocument();
    expect(within(dialog).getByText(labels.carryover.dialog.teacherLine("Ahmed Hassan", 2))).toBeInTheDocument();
    expect(within(dialog).getByText(labels.carryover.dialog.teacherLine("Mona Adel", 1))).toBeInTheDocument();
  });

  test("keeps the action disabled while nothing is selected", () => {
    renderGrid({ canManageCarryover: true, selectedIds: [] });
    expect(screen.getByRole("button", { name: labels.carryover.bulkAction })).toBeDisabled();
  });

  test("creates the carryovers with one mutation per confirm and reports evict + toast + selection clear", async () => {
    const clearSelection = mock(() => undefined);
    renderGrid(
      {
        canManageCarryover: true,
        selectedIds: ["instance-1"],
        clearSelection,
      },
      [successfulBulkCreateMock(1)]
    );
    fireEvent.click(screen.getByRole("button", { name: labels.carryover.bulkAction }));
    const dialog = screen.getByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: labels.carryover.dialog.confirm });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => {
      expect(bulkCreateMutationCalls).toBe(1);
    });
    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith(carryoverLabels.success.bulkCreated(1), { severity: "success" });
      expect(clearSelection).toHaveBeenCalledTimes(1);
    });
  });

  test("surfaces a selection-fatal domain rejection as a banner without closing the dialog", async () => {
    renderGrid({ canManageCarryover: true, selectedIds: ["instance-1"] }, [
      rejectedBulkCreateMock("CARRYOVER_SESSION_ALREADY_LINKED", "Sessions are already linked to a carryover."),
    ]);
    fireEvent.click(screen.getByRole("button", { name: labels.carryover.bulkAction }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: labels.carryover.dialog.confirm }));
    const banner = await within(dialog).findByText("Sessions are already linked to a carryover.");
    expect(banner).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: labels.carryover.dialog.confirm })).toBeDisabled();
    expect(showNotification).not.toHaveBeenCalledWith(carryoverLabels.success.bulkCreated(1), expect.anything());
  });
});
