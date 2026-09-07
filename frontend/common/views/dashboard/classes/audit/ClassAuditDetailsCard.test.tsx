import { afterEach, describe, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { GroupClassAuditQuery_groupClassAudit } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PayrollReportRow } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";
import type { ClassAuditPayrollSnapshot } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard";
import type { AppLocale } from "@/shared/locale/AppLocale";

// This suite lives next to the component it covers, so the happydom preloads
// wired into the shared component-test runner never load on this path. The DOM
// is registered first and every module that touches `document` at import time
// (testing-library above all) is imported dynamically afterwards, keeping the
// file runnable through the standard single-file test runner.
GlobalRegistrator.register();

const { configure: configureRtl, cleanup, fireEvent, screen } = await import("@testing-library/react");
configureRtl({ asyncUtilTimeout: 5000 });

// Imported dynamically (it pulls in @testing-library/dom, which must first see
// the registered global document) and destructured to drop the interop
// `default` key: expect.extend types reject it while the named matchers pass.
const { default: _jestDomDefault, ...jestDomMatchers } = await import("@testing-library/jest-dom/matchers");
expect.extend(jestDomMatchers);

// The override dialog in the container-pattern harness routes its toast through
// the Toolpad notifications hook; a minimal mock keeps the provider chain free.
const showNotification = mock((_message: string, _options?: unknown) => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

const { AppPermission, CalculationStatus, CurrencyCode } = await import(
  "@/frontend/common/graphql/generated/gql/graphql"
);
const { readTranslation } = await import("@/shared/locale/client/translation-cache-store");
const { DashboardBillingPayroll } = await import("@/shared/locale/namespaces");
const { Translation } = await import("@/shared/locale/namespaces/translation");
const { renderWithWrapper } = await import("@/test/ui/components/TestWrapper");
const { ClassAuditDetailsCard } = await import("@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard");
const { OverrideDialog } = await import("@/frontend/common/views/dashboard/accounting/payroll/OverrideDialog");
const { run: runAxe } = await import("axe-core");
const { useState } = await import("react");

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

type Audit = NonNullable<GroupClassAuditQuery_groupClassAudit>;

const AUDIT: Audit = {
  id: "instance-1",
  className: "Tajwid — Level 2",
  courseCode: "QR-201",
  teacherName: "Karim Mansour",
  originalDate: "2026-08-20",
  rescheduledDate: "2026-08-27",
  timeSlot: "16:00 – 17:00",
  venue: "Room 204",
  status: null,
  outcome: null,
  isFrozen: false,
  auditRemark: "Rescheduled at parent request",
  auditLoggedAt: "2026-08-21 09:12",
  isOneOnOne: false,
  registeredStudentCount: 3,
  totalStudentCount: 4,
  students: null,
  meetingInfo: null,
  communications: null,
  adminNote: null,
};

const DETAILS_LABELS = {
  courseCode: "Course code",
  teacher: "Teacher",
  originalDate: "Original date",
  rescheduledDate: "Rescheduled date",
  timeSlot: "Time slot",
  venue: "Venue",
  auditTrailTitle: "Audit trail",
  auditTrailEmpty: "No audit notes",
  statusRescheduled: "Rescheduled",
  classDetails: "Class details",
} as const;

const PAYROLL: ClassAuditPayrollSnapshot = {
  calculationStatus: CalculationStatus.Calculated,
  calculatedDuration: 60,
  teacherPaidAmount: "250.00",
  teacherPaidCurrency: CurrencyCode.Egp,
  isPartialPercentage: null,
  payrollNote: "Auto-calculated on completion",
};

const PARTIAL_PAYROLL: ClassAuditPayrollSnapshot = {
  calculationStatus: CalculationStatus.Partially,
  calculatedDuration: 60,
  teacherPaidAmount: "125.00",
  teacherPaidCurrency: CurrencyCode.Egp,
  isPartialPercentage: 50,
  payrollNote: "Half-session settlement",
};

/** Newest first, mirroring the descending createdAt order the events query returns. */
const STATUS_EVENTS = [
  {
    id: "evt-2",
    eventType: "PAYROLL_OVERRIDE",
    description: "Partial pay after complaint",
    createdAt: "2026-08-28T09:30:00.000Z",
  },
  {
    id: "evt-1",
    eventType: "PAYROLL_OVERRIDE",
    description: "Refund requested by parent",
    createdAt: "2026-08-27T18:00:00.000Z",
  },
  {
    id: "evt-0",
    eventType: "STATE_CHANGE",
    description: "Session completed",
    createdAt: "2026-08-26T17:05:00.000Z",
  },
];

const onOverride = mock(() => {});

interface CardRenderOptions {
  readonly payroll?: ClassAuditPayrollSnapshot | null;
  readonly statusEvents?: typeof STATUS_EVENTS | null;
  readonly managePermission?: boolean;
  readonly onOverride?: () => void;
}

function renderCard(options: CardRenderOptions = {}) {
  const permissions = options.managePermission === false ? [] : [AppPermission.AccountingPayrollManage];
  return renderWithWrapper(
    <ClassAuditDetailsCard
      audit={AUDIT}
      labels={DETAILS_LABELS}
      payroll={options.payroll}
      statusEvents={options.statusEvents}
      onOverride={options.onOverride}
    />,
    { locale, permissions }
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
  showNotification.mockClear();
});

describe("ClassAuditDetailsCard (payroll audit drawer)", () => {
  test("renders the class details card without the payroll card while no payroll snapshot exists", () => {
    renderCard({ managePermission: false });

    expect(screen.getByText(AUDIT.className ?? "")).toBeInTheDocument();
    expect(screen.getByText(AUDIT.teacherName ?? "")).toBeInTheDocument();
    expect(screen.queryByText(payrollLabels.audit.title)).toBeNull();
    expect(screen.queryByText(payrollLabels.audit.overrideHistory)).toBeNull();
    expect(screen.queryByRole("button", { name: payrollLabels.override.action })).toBeNull();
  });

  test("renders the payroll calculation card with the current snapshot values", () => {
    renderCard({ payroll: PAYROLL, statusEvents: STATUS_EVENTS });

    expect(screen.getByText(payrollLabels.audit.title)).toBeInTheDocument();
    expect(screen.getByText(payrollLabels.status.CALCULATED)).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("250.00 EGP")).toBeInTheDocument();
    expect(screen.getByText(PAYROLL.payrollNote ?? "")).toBeInTheDocument();
  });

  test("shows the partial percentage only for partial snapshots", () => {
    renderCard({ payroll: PARTIAL_PAYROLL, statusEvents: null });

    expect(screen.getByText(payrollLabels.status.PARTIALLY)).toBeInTheDocument();
    expect(screen.getByText("125.00 EGP")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  test("lists override events chronologically and ignores other event types", () => {
    renderCard({ payroll: PAYROLL, statusEvents: STATUS_EVENTS });

    const entries = screen.getAllByText(/Refund requested by parent|Partial pay after complaint/);
    expect(entries.map(entry => entry.textContent)).toEqual([
      "Refund requested by parent",
      "Partial pay after complaint",
    ]);
    expect(screen.queryByText("Session completed")).toBeNull();
  });

  test("shows the empty history message when no override events exist", () => {
    renderCard({ payroll: PAYROLL, statusEvents: [STATUS_EVENTS[2]] });

    expect(screen.getByText(payrollLabels.audit.noOverrideEvents)).toBeInTheDocument();
    expect(screen.queryByText("Refund requested by parent")).toBeNull();
  });

  test("hides the Override action without the payroll manage permission", () => {
    renderCard({ payroll: PAYROLL, statusEvents: STATUS_EVENTS, managePermission: false });

    expect(screen.getByText(payrollLabels.audit.title)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: payrollLabels.override.action })).toBeNull();
  });

  test("raises the override request when the action is clicked", () => {
    renderCard({ payroll: PAYROLL, statusEvents: STATUS_EVENTS, onOverride });

    fireEvent.click(screen.getByRole("button", { name: payrollLabels.override.action }));

    expect(onOverride).toHaveBeenCalledTimes(1);
  });

  test("opens the override dialog from the audit card via the container pattern", async () => {
    const row: PayrollReportRow = {
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

    function AuditCardWithOverrideDialog() {
      const [overrideOpen, setOverrideOpen] = useState(false);
      return (
        <>
          <ClassAuditDetailsCard
            audit={AUDIT}
            labels={DETAILS_LABELS}
            payroll={PAYROLL}
            statusEvents={STATUS_EVENTS}
            onOverride={() => setOverrideOpen(true)}
          />
          <OverrideDialog open={overrideOpen} row={row} onClose={() => setOverrideOpen(false)} />
        </>
      );
    }

    renderWithWrapper(<AuditCardWithOverrideDialog />, {
      locale,
      permissions: [AppPermission.AccountingPayrollManage],
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: payrollLabels.override.action }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(payrollLabels.override.title)).toBeInTheDocument();
    expect(screen.getAllByText(payrollLabels.status.CALCULATED).length).toBeGreaterThan(0);
  });

  test("payroll card markup passes the accessibility checks", async () => {
    const { container } = renderCard({ payroll: PAYROLL, statusEvents: STATUS_EVENTS });

    await expectNoAxeViolations(container);
  });
});
