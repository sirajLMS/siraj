import { afterEach, describe, expect, type Mock, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

// The person pickers are replaced with plain buttons so the suite exercises the
// filter bar's id-setter wiring without any autocomplete query traffic. Note:
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
    TeacherAutocomplete: buildPickerButton({ id: "teacher-picked", name: "Picked Teacher" }),
    StudentAutocomplete: buildPickerButton({ id: "student-picked", name: "Picked Student" }),
  };
});

import { Button } from "@mui/material";
import { SessionAuditStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  SessionAuditFilterBar,
  type SessionAuditFilterBarProps,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditFilterBar";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.SessionAudit, locale);

afterEach(() => {
  cleanup();
});

interface FilterBarMocks {
  readonly setTeacherId: Mock<(teacherId: string | null) => void>;
  readonly setStudentId: Mock<(studentId: string | null) => void>;
  readonly setDateFrom: Mock<(dateFrom: string | null) => void>;
  readonly setDateTo: Mock<(dateTo: string | null) => void>;
  readonly setCurrentStatuses: Mock<(currentStatuses: readonly SessionAuditStatus[]) => void>;
  readonly setSearch: Mock<(search: string) => void>;
  readonly clearFilters: Mock<() => void>;
}

function makeRow(overrides: Partial<SessionAuditReportRow> = {}): SessionAuditReportRow {
  return {
    id: "row-1",
    instanceId: "instance-1",
    scheduledStartAt: "2026-09-01T10:00:00.000Z",
    scheduledEndAt: "2026-09-01T11:00:00.000Z",
    durationMinutes: 60,
    actualStartAt: null,
    actualEndAt: null,
    bookingTimezone: "Africa/Cairo",
    currentStatus: SessionAuditStatus.Open,
    calculatedDuration: null,
    teacherPaidAmount: null,
    teacherPaidCurrency: null,
    calculationStatus: null,
    isPartialPercentage: null,
    payrollNote: null,
    teacherId: "teacher-1",
    teacherName: "Row Teacher",
    studentId: "student-1",
    studentName: "Row Student",
    subjectName: "Mathematics",
    teacherDuePaymentDate: null,
    ...overrides,
  };
}

function renderFilterBar(overrides: Partial<SessionAuditFilterBarProps> = {}): FilterBarMocks {
  const mocks: FilterBarMocks = {
    setTeacherId: mock(() => {}),
    setStudentId: mock(() => {}),
    setDateFrom: mock(() => {}),
    setDateTo: mock(() => {}),
    setCurrentStatuses: mock(() => {}),
    setSearch: mock(() => {}),
    clearFilters: mock(() => {}),
  };
  const props: SessionAuditFilterBarProps = {
    labels,
    rows: [],
    teacherId: null,
    studentId: null,
    dateFrom: null,
    dateTo: null,
    currentStatuses: [],
    search: "",
    hasActiveFilters: false,
    ...mocks,
    ...overrides,
  };
  render(<SessionAuditFilterBar {...props} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
  return mocks;
}

describe("SessionAuditFilterBar — control labels", () => {
  test("renders search, teacher, student, date range, and status controls with localized labels", () => {
    renderFilterBar();
    expect(screen.getByLabelText(labels.filters.search)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${labels.filters.teacher}:` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${labels.filters.student}:` })).toBeInTheDocument();
    expect(screen.getByLabelText(labels.filters.dateRange)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: labels.filters.status })).toBeInTheDocument();
  });

  test("hides the clear-filters affordance when no filter is active", () => {
    renderFilterBar({ hasActiveFilters: false });
    expect(screen.queryByRole("button", { name: labels.filters.clear })).toBeNull();
  });

  test("shows the clear-filters affordance when a filter is active", () => {
    renderFilterBar({ hasActiveFilters: true });
    expect(screen.getByRole("button", { name: labels.filters.clear })).toBeInTheDocument();
  });

  test("renders the inverted date-range error text when the from date follows the to date", () => {
    renderFilterBar({ dateFrom: "2026-09-10", dateTo: "2026-09-01", hasActiveFilters: true });
    expect(screen.getByText(labels.error.dateRangeInvalid)).toBeInTheDocument();
  });

  test("omits the date-range error when the range is ordered", () => {
    renderFilterBar({ dateFrom: "2026-09-01", dateTo: "2026-09-10", hasActiveFilters: true });
    expect(screen.queryByText(labels.error.dateRangeInvalid)).toBeNull();
  });
});

describe("SessionAuditFilterBar — setters", () => {
  test("typing in the search box forwards each keystroke to setSearch", () => {
    const mocks = renderFilterBar();
    fireEvent.change(screen.getByLabelText(labels.filters.search), { target: { value: "أحمد" } });
    expect(mocks.setSearch).toHaveBeenCalledWith("أحمد");
  });

  test("picking a teacher forwards the option id to setTeacherId", () => {
    const mocks = renderFilterBar();
    fireEvent.click(screen.getByRole("button", { name: `${labels.filters.teacher}:` }));
    expect(mocks.setTeacherId).toHaveBeenCalledWith("teacher-picked");
  });

  test("picking a student forwards the option id to setStudentId", () => {
    const mocks = renderFilterBar();
    fireEvent.click(screen.getByRole("button", { name: `${labels.filters.student}:` }));
    expect(mocks.setStudentId).toHaveBeenCalledWith("student-picked");
  });

  test("selecting a status option forwards the status list to setCurrentStatuses", () => {
    const mocks = renderFilterBar();
    fireEvent.click(screen.getByRole("combobox", { name: labels.filters.status }));
    fireEvent.click(screen.getByRole("option", { name: labels.status.Absent }));
    expect(mocks.setCurrentStatuses).toHaveBeenCalledWith([SessionAuditStatus.Absent]);
  });

  test("picking a from date forwards the two range setters", async () => {
    const mocks = renderFilterBar();
    fireEvent.click(screen.getByLabelText(labels.filters.dateRange));

    const fromGroup = await screen.findByRole("group", { name: labels.filters.dateFrom });
    expect(screen.getByRole("group", { name: labels.filters.dateTo })).toBeInTheDocument();

    const openCalendarButton = fromGroup.querySelector("button");
    if (!openCalendarButton) {
      throw new Error("expected a calendar open button inside the from picker");
    }
    fireEvent.click(openCalendarButton);

    const gridCells = await screen.findAllByRole("gridcell");
    const firstCell = gridCells[0];
    if (!firstCell) {
      throw new Error("expected a day gridcell in the calendar popup");
    }
    fireEvent.click(firstCell);

    await waitFor(() => {
      expect(mocks.setDateFrom).toHaveBeenCalled();
    });
    expect(mocks.setDateFrom).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    expect(mocks.setDateTo).toHaveBeenCalledWith(null);
  });

  test("clicking clear filters invokes clearFilters", () => {
    const mocks = renderFilterBar({ hasActiveFilters: true });
    fireEvent.click(screen.getByRole("button", { name: labels.filters.clear }));
    expect(mocks.clearFilters).toHaveBeenCalledTimes(1);
  });
});

describe("SessionAuditFilterBar — value display", () => {
  test("resolves a hydrated teacher id against the loaded report rows for display", () => {
    renderFilterBar({ teacherId: "teacher-1", rows: [makeRow()], hasActiveFilters: true });
    expect(screen.getByRole("button", { name: `${labels.filters.teacher}:Row Teacher` })).toBeInTheDocument();
  });

  test("renders selected statuses as localized chips in the collapsed select", () => {
    renderFilterBar({ currentStatuses: [SessionAuditStatus.Open], hasActiveFilters: true });
    expect(screen.getAllByText(labels.status.open).length).toBeGreaterThan(0);
  });
});
