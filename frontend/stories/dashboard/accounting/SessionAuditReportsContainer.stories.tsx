import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotificationsProvider } from "@toolpad/core/useNotifications";
import { type ReactNode, useEffect, useReducer } from "react";
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
import {
  sessionAuditReportQueryDocument,
  studentsDirectoryQueryDocument,
  teachersQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  SESSION_AUDIT_DEFAULT_PAGE_SIZE,
  useSessionAuditFilterStore as sessionAuditFilterStore,
} from "@/frontend/common/stores/sessionAuditFilterStore";
import { seedPermissions } from "@/frontend/common/stories";
import { SessionAuditReportsContainer } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditReportsContainer";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";

/** Manage permission unlocks the per-row audit/override action column. */
const REPORT_STORY_PERMISSIONS = [AppPermission.AccountingReportsManage];

/** Teacher directory rows the filter bar's autocomplete pulls on mount. */
const TEACHER_OPTIONS = [
  { id: "t-701", name: "Sheikh Bilal Owens", avatarUrl: null },
  { id: "t-702", name: "Ustaz Kareem Mansour", avatarUrl: null },
  { id: "t-703", name: "Ustaza Hala Nasser", avatarUrl: null },
];

const teacherAutocompleteMock: MockLink.MockedResponse = {
  request: { query: teachersQueryDocument, variables: { search: "", limit: 20 } },
  result: { data: { teachers: TEACHER_OPTIONS } },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const studentAutocompleteMock: MockLink.MockedResponse = {
  request: { query: studentsDirectoryQueryDocument, variables: { search: null, limit: 20 } },
  result: {
    data: {
      studentsDirectory: [
        {
          id: "s-301",
          name: "Adam Whitfield",
          email: null,
          avatarUrl: null,
          status: "REGULAR",
          classesRemaining: 9,
          classesTotal: 12,
          hoursPerWeek: 2,
          teacherName: "Sheikh Bilal Owens",
          createdAt: "2026-01-10T00:00:00.000Z",
          updatedAt: "2026-08-20T00:00:00.000Z",
        },
        {
          id: "s-302",
          name: "Layla Haddad",
          email: null,
          avatarUrl: null,
          status: "REGULAR",
          classesRemaining: 14,
          classesTotal: 20,
          hoursPerWeek: 3,
          teacherName: "Ustaz Kareem Mansour",
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-08-25T00:00:00.000Z",
        },
      ],
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const ROW_FIELD_DEFAULTS = {
  instanceId: null,
  scheduledStartAt: null,
  scheduledEndAt: null,
  durationMinutes: null,
  actualStartAt: null,
  actualEndAt: null,
  bookingTimezone: null,
  currentStatus: null,
  calculatedDuration: null,
  teacherPaidAmount: null,
  teacherPaidCurrency: null,
  calculationStatus: null,
  isPartialPercentage: null,
  payrollNote: null,
  teacherId: null,
  teacherName: null,
  studentId: null,
  studentName: null,
  subjectName: null,
  teacherDuePaymentDate: null,
} as const;

function makeRow(overrides: Partial<SessionAuditReportRow> & { readonly id: string }): SessionAuditReportRow {
  return { ...ROW_FIELD_DEFAULTS, ...overrides };
}

/** Long enough to exceed the payroll-note preview budget, rendering the popover trigger. */
const LONG_PARTIAL_NOTE =
  "Student had to leave the session 25 minutes early because of a family medical appointment that was " +
  "booked before the reschedule went out. The teacher agreed to cover the memorization review portion in " +
  "the first fifteen minutes of the next session, so only half of the scheduled hour is billable. Confirmed " +
  "with the parent over WhatsApp on the same day and recorded the agreement reference in the class notes.";

const POPULATED_ROWS: readonly SessionAuditReportRow[] = [
  makeRow({
    id: "row-1",
    instanceId: "inst-1001",
    scheduledStartAt: "2026-09-01T09:00:00.000Z",
    scheduledEndAt: "2026-09-01T10:00:00.000Z",
    durationMinutes: 60,
    actualStartAt: "2026-09-01T09:02:00.000Z",
    bookingTimezone: "Asia/Riyadh",
    currentStatus: SessionAuditStatus.Open,
    calculationStatus: CalculationStatus.NotCalculated,
    teacherId: "t-701",
    teacherName: "Sheikh Bilal Owens",
    studentId: "s-301",
    studentName: "Adam Whitfield",
    subjectName: "Quran Memorization",
  }),
  makeRow({
    id: "row-2",
    instanceId: "inst-1002",
    scheduledStartAt: "2026-08-31T11:00:00.000Z",
    scheduledEndAt: "2026-08-31T12:00:00.000Z",
    durationMinutes: 60,
    actualStartAt: "2026-08-31T11:03:00.000Z",
    actualEndAt: "2026-08-31T12:05:00.000Z",
    bookingTimezone: "Africa/Cairo",
    currentStatus: SessionAuditStatus.End,
    calculatedDuration: 62,
    teacherPaidAmount: "180.00",
    teacherPaidCurrency: CurrencyCode.Sar,
    calculationStatus: CalculationStatus.Calculated,
    teacherId: "t-702",
    teacherName: "Ustaz Kareem Mansour",
    studentId: "s-302",
    studentName: "Layla Haddad",
    subjectName: "Tajweed Basics",
  }),
  makeRow({
    id: "row-3",
    instanceId: "inst-1003",
    scheduledStartAt: "2026-08-30T15:00:00.000Z",
    scheduledEndAt: "2026-08-30T16:00:00.000Z",
    durationMinutes: 60,
    bookingTimezone: "Asia/Riyadh",
    currentStatus: SessionAuditStatus.Absent,
    calculationStatus: CalculationStatus.Refund,
    payrollNote: "Teacher no-show — full refund credited to the student balance.",
    teacherId: "t-703",
    teacherName: "Ustaza Hala Nasser",
    studentId: "s-303",
    studentName: "Omar Saeed",
    subjectName: "Arabic Grammar",
  }),
  makeRow({
    id: "row-4",
    instanceId: "inst-1004",
    scheduledStartAt: "2026-08-30T17:30:00.000Z",
    scheduledEndAt: "2026-08-30T18:30:00.000Z",
    durationMinutes: 60,
    actualStartAt: "2026-08-30T17:30:00.000Z",
    actualEndAt: "2026-08-30T18:25:00.000Z",
    bookingTimezone: "Europe/London",
    currentStatus: SessionAuditStatus.AbsentStudent,
    calculatedDuration: 55,
    teacherPaidAmount: "40.00",
    teacherPaidCurrency: CurrencyCode.Usd,
    calculationStatus: CalculationStatus.Calculated,
    teacherId: "t-701",
    teacherName: "Sheikh Bilal Owens",
    studentId: "s-304",
    studentName: "Noor Ahmed",
    subjectName: "Quran Recitation",
  }),
  makeRow({
    id: "row-5",
    instanceId: "inst-1005",
    scheduledStartAt: "2026-08-29T14:00:00.000Z",
    scheduledEndAt: "2026-08-29T15:30:00.000Z",
    durationMinutes: 90,
    actualStartAt: "2026-08-29T14:00:00.000Z",
    actualEndAt: "2026-08-29T15:30:00.000Z",
    bookingTimezone: "Africa/Cairo",
    currentStatus: SessionAuditStatus.End,
    calculatedDuration: 90,
    teacherPaidAmount: "120.50",
    teacherPaidCurrency: CurrencyCode.Usd,
    calculationStatus: CalculationStatus.Paid,
    teacherDuePaymentDate: "2026-09-03T14:30:00.000Z",
    teacherId: "t-702",
    teacherName: "Ustaz Kareem Mansour",
    studentId: "s-305",
    studentName: "Sara Mansour",
    subjectName: "Ijazah Track",
  }),
  makeRow({
    id: "row-6",
    instanceId: "inst-1006",
    scheduledStartAt: "2026-08-28T10:00:00.000Z",
    scheduledEndAt: "2026-08-28T11:00:00.000Z",
    durationMinutes: 60,
    actualStartAt: "2026-08-28T10:01:00.000Z",
    actualEndAt: "2026-08-28T10:36:00.000Z",
    bookingTimezone: "Europe/London",
    currentStatus: SessionAuditStatus.End,
    calculatedDuration: 35,
    teacherPaidAmount: "62.50",
    teacherPaidCurrency: CurrencyCode.Usd,
    calculationStatus: CalculationStatus.Partially,
    isPartialPercentage: 50,
    payrollNote: LONG_PARTIAL_NOTE,
    teacherId: "t-703",
    teacherName: "Ustaza Hala Nasser",
    studentId: "s-306",
    studentName: "Yusuf Karim",
    subjectName: "Tafsir Reading Circle",
  }),
];

const ZERO_STATUS_COUNTS = { open: 0, end: 0, Absent: 0, absent_student: 0 };

const populatedData: SessionAuditReportQuery = {
  sessionAuditReport: {
    id: "session-audit-report",
    rows: [...POPULATED_ROWS],
    totalCount: POPULATED_ROWS.length,
    aggregates: {
      id: "session-audit-aggregates",
      rowCountByStatus: { open: 1, end: 3, Absent: 1, absent_student: 1 },
      rowCountByPaid: { paid: 1, unpaid: 5 },
      totalPaidAmount: "120.50",
      totalPaidCurrency: CurrencyCode.Usd,
    },
  },
};

const emptyData: SessionAuditReportQuery = {
  sessionAuditReport: {
    id: "session-audit-report",
    rows: [],
    totalCount: 0,
    aggregates: {
      id: "session-audit-aggregates",
      rowCountByStatus: { ...ZERO_STATUS_COUNTS },
      rowCountByPaid: { paid: 0, unpaid: 0 },
      totalPaidAmount: "0.00",
      totalPaidCurrency: null,
    },
  },
};

const FILTER_TEACHER = { id: "t-702", name: "Ustaz Kareem Mansour" };
const FILTERED_STATUSES: readonly SessionAuditStatus[] = [SessionAuditStatus.End];
const FILTERED_SEARCH = "Kareem";

/**
 * Subset of POPULATED_ROWS that honestly satisfies the filtered story's seeded
 * filters (teacher Kareem Mansour, Ended status): the data grid's filter chips
 * and its rows tell the same story.
 */
const FILTERED_ROWS: readonly SessionAuditReportRow[] = POPULATED_ROWS.filter(
  row => row.teacherName === FILTER_TEACHER.name && row.currentStatus === SessionAuditStatus.End
);

const filteredData: SessionAuditReportQuery = {
  sessionAuditReport: {
    id: "session-audit-report",
    rows: [...FILTERED_ROWS],
    totalCount: FILTERED_ROWS.length,
    aggregates: {
      id: "session-audit-aggregates",
      rowCountByStatus: { open: 0, end: FILTERED_ROWS.length, Absent: 0, absent_student: 0 },
      rowCountByPaid: { paid: 1, unpaid: FILTERED_ROWS.length - 1 },
      totalPaidAmount: "120.50",
      totalPaidCurrency: CurrencyCode.Usd,
    },
  },
};

/** Build the exact query-variable set the view-model assembles for a given filter. */
function reportVariables(filter: SessionAuditReportFilter | null): SessionAuditReportQueryVariables {
  return {
    filter,
    sort: { field: SessionAuditReportSortField.ScheduledStartAt, direction: OrderSortDirection.Desc },
    limit: SESSION_AUDIT_DEFAULT_PAGE_SIZE,
    offset: 0,
  };
}

function reportMock(
  filter: SessionAuditReportFilter | null,
  data: SessionAuditReportQuery,
  extra?: Partial<MockLink.MockedResponse>
): MockLink.MockedResponse {
  return {
    request: { query: sessionAuditReportQueryDocument, variables: reportVariables(filter) },
    result: { data },
    maxUsageCount: Number.POSITIVE_INFINITY,
    ...extra,
  };
}

const defaultFilterMock = (data: SessionAuditReportQuery, extra?: Partial<MockLink.MockedResponse>) =>
  reportMock(null, data, extra);

function baseMocks(reportMocks: readonly MockLink.MockedResponse[]): readonly MockLink.MockedResponse[] {
  return [teacherAutocompleteMock, studentAutocompleteMock, ...reportMocks];
}

/**
 * Re-seeds permissions right after mount and forces one second paint: the
 * preview-level wrapper rewrites the user store in its own mount effect, which
 * lands after a story's render-time seed, so the first render runs on the
 * story permissions and the reseed wins once the wrapper's seed has run.
 */
function SessionAuditReportProviders({
  children,
  mocks,
}: Readonly<{ children: ReactNode; mocks: readonly MockLink.MockedResponse[] }>) {
  seedPermissions(REPORT_STORY_PERMISSIONS);
  const [, forcePaint] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    const timer = setTimeout(() => {
      seedPermissions(REPORT_STORY_PERMISSIONS);
      forcePaint();
    }, 0);
    return () => {
      clearTimeout(timer);
      sessionAuditFilterStore.getState().reset();
    };
  }, []);
  return (
    <MockedProvider mocks={[...mocks]}>
      <NotificationsProvider>{children}</NotificationsProvider>
    </MockedProvider>
  );
}

/** Filter seed for the filtered story, driven through the same URL hydration the page mount uses. */
const FILTERED_URL_SEED = {
  teacherId: FILTER_TEACHER.id,
  currentStatuses: FILTERED_STATUSES.join(","),
  search: FILTERED_SEARCH,
};

/** Hydrates the filter store from the current iframe URL (render-time caller in FilteredUrlSeed). */
function hydrateSessionAuditFiltersFromUrl(): void {
  sessionAuditFilterStore.getState().hydrateFromUrl();
}

/**
 * Seeds the report filters through the real address-bar hydration path so the
 * seeded state is identical to a pasted filtered link, and restores both the
 * URL and the store when the story unmounts.
 */
function FilteredUrlSeed({ children }: Readonly<{ children: ReactNode }>) {
  window.history.replaceState({}, "", seedIntoLocationSearch());
  hydrateSessionAuditFiltersFromUrl();
  useEffect(() => {
    return () => {
      window.history.replaceState({}, "", pristineIframeUrl);
      sessionAuditFilterStore.getState().reset();
    };
  }, []);
  return children;
}

/** Iframe address exactly as the story opened, captured before the fixture params are merged in. */
let pristineIframeUrl = "";

/**
 * Appends the fixture filter params to the current iframe URL, preserving the
 * Storybook selection params. The first capture (before any seed param exists)
 * is remembered for the unmount cleanup.
 */
function seedIntoLocationSearch(): string {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("teacherId")) {
    pristineIframeUrl = url.toString();
  }
  for (const [key, value] of Object.entries(FILTERED_URL_SEED)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

const meta = {
  title: "Views/dashboard/accounting/SessionAuditReportsContainer",
  component: SessionAuditReportsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SessionAuditReportsContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PopulatedDesktop: Story = {
  decorators: [
    Story => (
      <SessionAuditReportProviders mocks={baseMocks([defaultFilterMock(populatedData)])}>
        <Story />
      </SessionAuditReportProviders>
    ),
  ],
};

export const EmptyState: Story = {
  decorators: [
    Story => (
      <SessionAuditReportProviders mocks={baseMocks([defaultFilterMock(emptyData)])}>
        <Story />
      </SessionAuditReportProviders>
    ),
  ],
};

export const ErrorState: Story = {
  decorators: [
    Story => (
      <SessionAuditReportProviders
        mocks={baseMocks([
          {
            request: {
              query: sessionAuditReportQueryDocument,
              variables: reportVariables(null),
            },
            error: new Error("Session audit report is temporarily unavailable."),
          },
        ])}
      >
        <Story />
      </SessionAuditReportProviders>
    ),
  ],
};

export const LoadingState: Story = {
  decorators: [
    Story => (
      <SessionAuditReportProviders mocks={baseMocks([defaultFilterMock(populatedData, { delay: 3_600_000 })])}>
        <Story />
      </SessionAuditReportProviders>
    ),
  ],
};

export const FilteredState: Story = {
  decorators: [
    Story => (
      <FilteredUrlSeed>
        <SessionAuditReportProviders
          mocks={baseMocks([
            reportMock(
              {
                teacherId: FILTER_TEACHER.id,
                studentId: null,
                dateFrom: null,
                dateTo: null,
                currentStatuses: [...FILTERED_STATUSES],
                search: FILTERED_SEARCH,
                includeDeleted: null,
              },
              filteredData
            ),
          ])}
        >
          <Story />
        </SessionAuditReportProviders>
      </FilteredUrlSeed>
    ),
  ],
};
