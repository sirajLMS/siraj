import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const locale = "ar";

const routerPush = mock((_href: string) => undefined);
const notificationsShow = mock((_message: string, _options?: unknown) => {});

await mockNextNavigation("/accounting/reports", { locale, mockPush: routerPush });

// Silence the shared logger — the CSV-export path and the responsive switch log
// through it and the project rule is that tests never see `console.*` output.
await mock.module("@/frontend/common/utils/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

// `@toolpad/core/useNotifications` needs the Toolpad provider chain, which the
// TestWrapper does not mount. The spy stands in so the truncation notice can be
// asserted without the provider.
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: notificationsShow }),
}));

// The person pickers run autocomplete queries of their own; plain button stubs
// keep the container test hermetically on the session-audit query document.
// mock.module registrations are process-global in Bun.
await mock.module("@/frontend/common/components/ui/input/userSelect", () => {
  interface MockPickerProps {
    readonly label?: string;
    readonly value: { readonly id: string; readonly name: string } | null;
    readonly onChange: (next: { readonly id: string; readonly name: string } | null) => void;
  }
  const buildPickerButton = (picked: { readonly id: string; readonly name: string }) =>
    function MockPicker({ label, value, onChange }: Readonly<MockPickerProps>) {
      return (
        <Button variant="outlined" onClick={() => onChange(picked)}>
          {label}:{value?.name ?? ""}
        </Button>
      );
    };
  return {
    TeacherAutocomplete: buildPickerButton({ id: "teacher-picked", name: "معلم محدد" }),
    StudentAutocomplete: buildPickerButton({ id: "student-picked", name: "طالب محدد" }),
  };
});

import { Button } from "@mui/material";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { run as runAxe } from "axe-core";

expect.extend(matchers);

import type { MockLink } from "@apollo/client/testing";
import {
  AppPermission,
  CalculationStatus,
  CurrencyCode,
  OrderSortDirection,
  type SessionAuditReportFilter,
  type SessionAuditReportQuery,
  type SessionAuditReportQueryVariables,
  SessionAuditReportSortField,
  SessionAuditStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { sessionAuditReportQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { useSessionAuditFilterStore } from "@/frontend/common/stores/sessionAuditFilterStore";
import { SessionAuditReportsContainer } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditReportsContainer";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const labels = readTranslation(Translation.Dashboard.SessionAudit, locale);

const ROW_A_TEACHER = "أمينة فؤاد";
const ROW_B_TEACHER = "هالة سمير";
const SEARCH_HIT_TEACHER = "نور الدين محمود";
const HYDRATED_TEACHER = "محمود عبد الله";
const TOTAL_PAID_AMOUNT = "450.75";

// The CSV flow is fetched with the global fetch; capturing the requested URLs
// here asserts the exact export-route call the button drives. The blob download
// plumbing is stubbed to stay deterministic in Happy DOM.
const requestedExportUrls: string[] = [];
let exportTruncated = false;

function toRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

const exportFetch = mock((input: RequestInfo | URL) => {
  requestedExportUrls.push(toRequestUrl(input));
  return Promise.resolve(
    new Response("csv-payload", {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="session-audit-report.csv"',
        "X-Export-Truncated": exportTruncated ? "true" : "false",
      },
    })
  );
});

Object.defineProperty(globalThis, "fetch", { value: exportFetch, writable: true, configurable: true });
Object.defineProperty(URL, "createObjectURL", {
  value: () => "blob:session-audit-export",
  writable: true,
  configurable: true,
});
Object.defineProperty(URL, "revokeObjectURL", { value: () => undefined, writable: true, configurable: true });

function makeRow(overrides: Partial<SessionAuditReportRow> = {}): SessionAuditReportRow {
  return {
    id: "instance-a1",
    instanceId: "instance-a1",
    scheduledStartAt: "2026-08-30T10:00:00.000Z",
    scheduledEndAt: "2026-08-30T11:00:00.000Z",
    durationMinutes: 60,
    actualStartAt: null,
    actualEndAt: null,
    bookingTimezone: "Africa/Cairo",
    currentStatus: SessionAuditStatus.End,
    calculatedDuration: 58,
    teacherPaidAmount: "225.50",
    teacherPaidCurrency: CurrencyCode.Egp,
    calculationStatus: CalculationStatus.Paid,
    isPartialPercentage: null,
    payrollNote: null,
    teacherId: "teacher-1",
    teacherName: ROW_A_TEACHER,
    studentId: "student-1",
    studentName: "كريم عادل",
    subjectName: "رياضيات",
    teacherDuePaymentDate: null,
    ...overrides,
  };
}

const AGGREGATES = {
  id: "aggregates",
  rowCountByStatus: { open: 0, end: 2, Absent: 0, absent_student: 0 },
  rowCountByPaid: { paid: 2, unpaid: 0 },
  totalPaidAmount: TOTAL_PAID_AMOUNT,
  totalPaidCurrency: CurrencyCode.Egp,
};

/** Default store state expands to the unfiltered default-sort first page. */
const DEFAULT_VARIABLES: SessionAuditReportQueryVariables = {
  filter: null,
  sort: { field: SessionAuditReportSortField.ScheduledStartAt, direction: OrderSortDirection.Desc },
  limit: 50,
  offset: 0,
};

function searchVariables(search: string): SessionAuditReportQueryVariables {
  const filter: SessionAuditReportFilter = {
    teacherId: null,
    studentId: null,
    dateFrom: null,
    dateTo: null,
    currentStatuses: null,
    search,
    includeDeleted: null,
  };
  return { ...DEFAULT_VARIABLES, filter };
}

function reportMock(
  variables: SessionAuditReportQueryVariables,
  report: SessionAuditReportQuery["sessionAuditReport"]
): MockLink.MockedResponse {
  return {
    request: { query: sessionAuditReportQueryDocument, variables },
    result: { data: { sessionAuditReport: report } satisfies SessionAuditReportQuery },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

/** Unfiltered page: two populated rows plus the aggregate block. */
function buildBaseMocks(): MockLink.MockedResponse[] {
  return [
    reportMock(DEFAULT_VARIABLES, {
      id: "page",
      totalCount: 2,
      rows: [
        makeRow(),
        makeRow({ id: "instance-b2", instanceId: "instance-b2", teacherName: ROW_B_TEACHER, studentName: "يوسف نبيل" }),
      ],
      aggregates: AGGREGATES,
    }),
    reportMock(searchVariables("نور"), {
      id: "page",
      totalCount: 1,
      rows: [makeRow({ id: "instance-f1", instanceId: "instance-f1", teacherName: SEARCH_HIT_TEACHER })],
      aggregates: AGGREGATES,
    }),
  ];
}

/** Empty result page for the no-rows state. */
function buildEmptyMocks(): MockLink.MockedResponse[] {
  return [reportMock(DEFAULT_VARIABLES, { id: "page", totalCount: 0, rows: [], aggregates: AGGREGATES })];
}

interface RenderContainerOptions {
  readonly permissions?: AppPermission[];
  readonly mocks: MockLink.MockedResponse[];
  readonly viewport?: "desktop" | "mobile";
}

function renderContainer({ permissions = [], mocks, viewport = "desktop" }: RenderContainerOptions) {
  return renderWithWrapper(<SessionAuditReportsContainer />, { locale, permissions, mocks, viewport });
}

/** The lazy tier view and the query both resolve asynchronously. */
async function awaitRow(teacherName: string) {
  return screen.findByText(teacherName, {}, { timeout: 4000 });
}

afterEach(() => {
  cleanup();
  useSessionAuditFilterStore.getState().reset();
  window.history.replaceState(null, "", "/accounting/reports");
  routerPush.mockClear();
  notificationsShow.mockClear();
  exportFetch.mockClear();
  requestedExportUrls.length = 0;
  exportTruncated = false;
});

describe("SessionAuditReportsContainer — rendering", () => {
  test("renders the page chrome, filter bar, and report rows for a desktop viewport", async () => {
    renderContainer({ mocks: buildBaseMocks() });
    await awaitRow(ROW_A_TEACHER);
    expect(screen.getAllByText(labels.title).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(ROW_B_TEACHER)).toBeInTheDocument();
    expect(screen.getByLabelText(labels.filters.search)).toBeInTheDocument();
  });

  test("renders the mobile tier view for a phone viewport", async () => {
    renderContainer({ mocks: buildBaseMocks(), viewport: "mobile" });
    await awaitRow(ROW_A_TEACHER);
    expect(screen.getAllByText(labels.title).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: labels.action.exportCsv })).toBeInTheDocument();
  });

  test("renders the empty state when the report has no rows", async () => {
    renderContainer({ mocks: buildEmptyMocks() });
    expect(await screen.findByText(labels.emptyState.titleNoFilters, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.queryByText(labels.emptyState.title)).not.toBeInTheDocument();
  });

  test("disables the CSV export while the report has no rows", async () => {
    renderContainer({ mocks: buildEmptyMocks() });
    await screen.findByText(labels.emptyState.titleNoFilters, {}, { timeout: 4000 });
    expect(screen.getByRole("button", { name: labels.action.exportCsv })).toBeDisabled();
  });
});

describe("SessionAuditReportsContainer — aggregate footer", () => {
  test("renders the localized aggregate totals from the query aggregates", async () => {
    renderContainer({ mocks: buildBaseMocks() });
    await awaitRow(ROW_A_TEACHER);
    expect(screen.getByText(labels.aggregate.totalPaid)).toBeInTheDocument();
    expect(screen.getByText(labels.aggregate.paidRows)).toBeInTheDocument();
    expect(screen.getByText(formatLockedAmount(TOTAL_PAID_AMOUNT, CurrencyCode.Egp, locale))).toBeInTheDocument();
  });
});

describe("SessionAuditReportsContainer — filter propagation", () => {
  test("propagates a debounced search through the store into the report query", async () => {
    renderContainer({ mocks: buildBaseMocks() });
    await awaitRow(ROW_A_TEACHER);

    const searchInput = screen.getByLabelText(labels.filters.search);
    fireEvent.change(searchInput, { target: { value: "ن" } });
    fireEvent.change(searchInput, { target: { value: "نو" } });
    fireEvent.change(searchInput, { target: { value: "نور" } });

    expect(await screen.findByText(SEARCH_HIT_TEACHER, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(useSessionAuditFilterStore.getState().search).toBe("نور");
    expect(screen.queryByText(ROW_A_TEACHER)).not.toBeInTheDocument();
    expect(screen.queryByText(ROW_B_TEACHER)).not.toBeInTheDocument();
  });
});

describe("SessionAuditReportsContainer — CSV export", () => {
  test("calls the export endpoint with the current sort pair when the CSV button is clicked", async () => {
    renderContainer({ mocks: buildBaseMocks() });
    await awaitRow(ROW_A_TEACHER);

    fireEvent.click(screen.getByRole("button", { name: labels.action.exportCsv }));

    await waitFor(() => {
      expect(requestedExportUrls.length).toBeGreaterThan(0);
    });
    const exportUrl = requestedExportUrls[0];
    if (!exportUrl) {
      throw new Error("expected the export request URL to be captured");
    }
    expect(exportUrl).toContain("/api/accounting/reports/export?");
    expect(exportUrl).toContain("sortField=scheduledStartAt");
    expect(exportUrl).toContain("sortDirection=desc");
  });

  test("surfaces the truncation notice when the export exceeds the row ceiling", async () => {
    exportTruncated = true;
    renderContainer({ mocks: buildBaseMocks() });
    await awaitRow(ROW_A_TEACHER);

    fireEvent.click(screen.getByRole("button", { name: labels.action.exportCsv }));

    await waitFor(() => {
      expect(notificationsShow).toHaveBeenCalled();
    });
    expect(notificationsShow).toHaveBeenCalledWith(
      labels.exportTruncated,
      expect.objectContaining({ severity: "warning" })
    );
  });
});

describe("SessionAuditReportsContainer — row navigation", () => {
  test("navigates to the session audit drawer when a row is clicked", async () => {
    renderContainer({ mocks: buildBaseMocks() });
    fireEvent.click(await awaitRow(ROW_A_TEACHER));
    expect(routerPush).toHaveBeenCalledWith("/classes/instance-a1/audit");
  });

  test("hides the open-audit action without the reports manage permission", async () => {
    renderContainer({ mocks: buildBaseMocks(), permissions: [AppPermission.AccountingReportsView] });
    await awaitRow(ROW_A_TEACHER);
    expect(screen.queryByRole("button", { name: labels.action.openAuditPage })).not.toBeInTheDocument();
  });

  test("shows the open-audit action with the manage permission and navigates with the override flag", async () => {
    renderContainer({
      mocks: buildBaseMocks(),
      permissions: [AppPermission.AccountingReportsView, AppPermission.AccountingReportsManage],
    });
    const actions = await screen.findAllByRole("button", { name: labels.action.openAuditPage }, { timeout: 4000 });
    const action = actions[0];
    if (!action) {
      throw new Error("expected at least one open-audit action button");
    }
    fireEvent.click(action);
    expect(routerPush).toHaveBeenCalledWith("/classes/instance-a1/audit?openOverride=1");
  });
});

describe("SessionAuditReportsContainer — URL state", () => {
  test("hydrates filters from the query string and writes later changes back to the URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/accounting/reports?teacherId=teacher-9&currentStatuses=Absent&search=Karim"
    );

    const hydratedFilter: SessionAuditReportFilter = {
      teacherId: "teacher-9",
      studentId: null,
      dateFrom: null,
      dateTo: null,
      currentStatuses: [SessionAuditStatus.Absent],
      search: "Karim",
      includeDeleted: null,
    };

    renderContainer({
      mocks: [
        reportMock(DEFAULT_VARIABLES, { id: "page", totalCount: 0, rows: [], aggregates: AGGREGATES }),
        reportMock(
          { ...DEFAULT_VARIABLES, filter: hydratedFilter },
          {
            id: "page",
            totalCount: 1,
            rows: [makeRow({ id: "instance-h1", instanceId: "instance-h1", teacherName: HYDRATED_TEACHER })],
            aggregates: AGGREGATES,
          }
        ),
        reportMock(searchVariables("نور"), { id: "page", totalCount: 0, rows: [], aggregates: AGGREGATES }),
      ],
    });

    expect(await screen.findByText(HYDRATED_TEACHER, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(useSessionAuditFilterStore.getState().teacherId).toBe("teacher-9");
    expect(useSessionAuditFilterStore.getState().currentStatuses).toEqual([SessionAuditStatus.Absent]);

    fireEvent.change(screen.getByLabelText(labels.filters.search), { target: { value: "نور" } });

    await waitFor(() => {
      expect(window.location.search).toContain(`search=${encodeURIComponent("نور")}`);
    });
    expect(window.location.search).toContain("teacherId=teacher-9");
    expect(window.location.search).toContain("currentStatuses=Absent");
  });
});

describe("SessionAuditReportsContainer — RTL and accessibility", () => {
  test("renders the RTL page with Arabic labels across filters, grid, and actions", async () => {
    renderContainer({ mocks: buildBaseMocks() });
    await awaitRow(ROW_A_TEACHER);

    expect(screen.getAllByText(labels.title).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: labels.action.exportCsv })).toBeInTheDocument();
    expect(screen.getByLabelText(labels.filters.search)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: labels.filters.status })).toBeInTheDocument();
    expect(screen.getByText(labels.column.paidAmount)).toBeInTheDocument();
    expect(screen.getByLabelText(labels.status.end)).toBeInTheDocument();
  });

  test("has no detectable accessibility violations on the populated page", async () => {
    const { container } = renderContainer({ mocks: buildBaseMocks() });
    await awaitRow(ROW_A_TEACHER);

    const results = await runAxe(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
