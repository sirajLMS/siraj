import { afterAll, afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import type { ApolloClient } from "@apollo/client";
import type { MockLink } from "@apollo/client/testing";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { RefObject } from "react";
import type { PayrollOverrideInput } from "@/frontend/common/graphql/generated/gql/graphql";
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

// The toast host needs a Toolpad provider chain the test wrapper does not set
// up; the dialog only calls `show`, so a minimal hook mock is enough.
const showNotification = mock((_message: string, _options?: unknown) => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

const { GraphQLError } = await import("graphql");
const { CalculationStatus, CurrencyCode } = await import("@/frontend/common/graphql/generated/gql/graphql");
const { applyPayrollOverrideMutationDocument, payrollReportQueryDocument } = await import(
  "@/frontend/common/graphql/sharedDocuments"
);
const { useApolloClient } = await import("@apollo/client/react");
const { useEffect } = await import("react");
const { useTheme } = await import("@mui/material/styles");
const { run: runAxe } = await import("axe-core");
const { readTranslation } = await import("@/shared/locale/client/translation-cache-store");
const { DashboardBillingPayroll } = await import("@/shared/locale/namespaces");
const { Translation } = await import("@/shared/locale/namespaces/translation");
const { renderWithWrapper } = await import("@/test/ui/components/TestWrapper");
const { OverrideDialog } = await import("@/frontend/common/views/dashboard/accounting/payroll/OverrideDialog");

const locale: AppLocale = "en";
const rtlLocale: AppLocale = "ar";

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
// synchronously instead of suspending on an unresolved promise. Both locales
// are warmed: the right-to-left suite renders the same dialog in Arabic.
await Promise.all([
  warmNamespace(() => readTranslation(DashboardBillingPayroll, locale)),
  warmNamespace(() => readTranslation(Translation.Common, locale)),
  warmNamespace(() => readTranslation(DashboardBillingPayroll, rtlLocale)),
  warmNamespace(() => readTranslation(Translation.Common, rtlLocale)),
]);
const payrollLabels = readTranslation(DashboardBillingPayroll, locale);
const commonLabels = readTranslation(Translation.Common, locale);
const payrollLabelsAr = readTranslation(DashboardBillingPayroll, rtlLocale);
const commonLabelsAr = readTranslation(Translation.Common, rtlLocale);

// The dialog mints one idempotency token per open session; pinning the token
// keeps the mutation variables deterministic so the Apollo mocks match exactly.
// The annotation mirrors the crypto.randomUUID template-literal return type so
// the pinned token can be installed as a drop-in replacement below.
const FIXED_CLIENT_REQUEST_ID: `${string}-${string}-${string}-${string}-${string}` =
  "payroll-override-fixed-request-id";
const originalRandomUUID: typeof crypto.randomUUID = crypto.randomUUID;

beforeAll(() => {
  // Explicit return type keeps the template-literal type from widening to
  // `string`, which the overloaded randomUUID property type rejects.
  crypto.randomUUID = (): `${string}-${string}-${string}-${string}-${string}` => FIXED_CLIENT_REQUEST_ID;
});

afterAll(() => {
  crypto.randomUUID = originalRandomUUID;
});

const INSTANCE_ID = "instance-1";

const PAYROLL_ROW: PayrollReportRow = {
  id: INSTANCE_ID,
  instanceId: INSTANCE_ID,
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

const REPORT_QUERY_VARIABLES = { filter: null, limit: 25, offset: 0 };
const REPORT_CACHE_DATA = {
  payrollReport: {
    id: "payroll-report-page-1",
    totalCount: 1,
    rows: [PAYROLL_ROW],
    aggregates: {
      id: "payroll-report-aggregates-1",
      totalPaidAmount: "250.00",
      totalPaidCurrency: CurrencyCode.Egp,
      rowCountByStatus: {},
    },
  },
};

const onClose = mock(() => {});

/** Counts actual mutation invocations (`result` runs once per network call). */
let mutationCalls = 0;

function refundInput(note: string, force = false): PayrollOverrideInput {
  return {
    instanceId: INSTANCE_ID,
    targetStatus: CalculationStatus.Refund,
    partialPercentage: null,
    note,
    force,
    clientRequestId: FIXED_CLIENT_REQUEST_ID,
  };
}

function partiallyInput(percentage: number, note: string, force = false): PayrollOverrideInput {
  return {
    instanceId: INSTANCE_ID,
    targetStatus: CalculationStatus.Partially,
    partialPercentage: percentage,
    note,
    force,
    clientRequestId: FIXED_CLIENT_REQUEST_ID,
  };
}

function overrideResult(input: PayrollOverrideInput) {
  return {
    id: input.instanceId,
    instanceId: input.instanceId,
    calculationStatus: input.targetStatus,
    teacherPaidAmount: "0.00",
    teacherPaidCurrency: CurrencyCode.Egp,
    calculatedDuration: 60,
    isPartialPercentage: input.partialPercentage ?? null,
    payrollNote: input.note ?? null,
    auditEventId: "audit-event-1",
  };
}

function successfulOverrideMock(input: PayrollOverrideInput): MockLink.MockedResponse {
  return {
    request: { query: applyPayrollOverrideMutationDocument, variables: { input } },
    result: () => {
      mutationCalls += 1;
      return { data: { applyPayrollOverride: overrideResult(input) } };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

function domainErrorMock(input: PayrollOverrideInput, code: string, message: string): MockLink.MockedResponse {
  return {
    request: { query: applyPayrollOverrideMutationDocument, variables: { input } },
    result: () => {
      mutationCalls += 1;
      return {
        data: { applyPayrollOverride: null },
        errors: [new GraphQLError(message, { extensions: { code } })],
      };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

let clientRef: RefObject<ApolloClient | null> = { current: null };

function ApolloClientCapture() {
  const client = useApolloClient();
  useEffect(() => {
    clientRef.current = client;
  });
  return null;
}

/** Exposes the active MUI theme direction so right-to-left renders can assert it. */
function ThemeDirectionProbe() {
  const theme = useTheme();
  return <span data-testid="theme-direction">{theme.direction}</span>;
}

interface DialogRenderOptions {
  readonly mocks?: MockLink.MockedResponse[];
  readonly row?: PayrollReportRow;
  readonly locale?: AppLocale;
}

function renderDialog(options: DialogRenderOptions = {}) {
  return renderWithWrapper(
    <>
      <ApolloClientCapture />
      <OverrideDialog open row={options.row ?? PAYROLL_ROW} onClose={onClose} />
    </>,
    { locale: options.locale ?? locale, mocks: options.mocks ?? [] }
  );
}

function submitButton() {
  return screen.getByRole("button", { name: payrollLabels.override.action });
}

function noteField() {
  return screen.getByRole("textbox", { name: payrollLabels.override.note });
}

function percentageField() {
  return screen.getByRole("spinbutton", { name: payrollLabels.override.percentage });
}

function selectTarget(label: string) {
  fireEvent.click(screen.getByRole("radio", { name: label }));
}

function fillNote(value: string) {
  fireEvent.change(noteField(), { target: { value } });
}

// Happy DOM cannot compute visual styles, so the color-contrast rule stays
// incomplete there; it is excluded and contrast is covered by the theme tokens.
async function expectNoAxeViolations(container: HTMLElement): Promise<void> {
  const results = await runAxe(container, { rules: { "color-contrast": { enabled: false } } });
  expect(results.violations).toEqual([]);
}

afterEach(() => {
  cleanup();
  onClose.mockClear();
  showNotification.mockClear();
  mutationCalls = 0;
  clientRef = { current: null };
});

describe("OverrideDialog (component)", () => {
  test("renders the row's current calculation summary and the four override targets", async () => {
    renderDialog();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(payrollLabels.status.CALCULATED)).toBeInTheDocument();
    expect(screen.getByText("250.00 EGP")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText(PAYROLL_ROW.payrollNote ?? "")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: commonLabels.cancel })).toBeInTheDocument();
    for (const label of [
      payrollLabels.override.target.Refund,
      payrollLabels.override.target.Calculated,
      payrollLabels.override.target.NotCalculated,
      payrollLabels.override.target.Partially,
    ]) {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByRole("spinbutton")).toBeNull();
    // Force only matters for Waiting Paid rows, so a Calculated row hides it.
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  test("toggles the percentage field visibility with the Partially target", async () => {
    renderDialog();

    selectTarget(payrollLabels.override.target.Partially);
    expect(await screen.findByRole("spinbutton", { name: payrollLabels.override.percentage })).toBeInTheDocument();

    selectTarget(payrollLabels.override.target.Calculated);
    await waitFor(() => {
      expect(screen.queryByRole("spinbutton")).toBeNull();
    });
  });

  test("blocks a Partially submit without a percentage", async () => {
    renderDialog();

    selectTarget(payrollLabels.override.target.Partially);
    fillNote("Half month settlement");
    fireEvent.click(submitButton());

    expect(await screen.findByText(payrollLabels.validation.percentageRequired)).toBeInTheDocument();
    expect(mutationCalls).toBe(0);
    expect(onClose).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("blocks a Refund submit without a note", async () => {
    renderDialog();

    selectTarget(payrollLabels.override.target.Refund);
    fireEvent.click(submitButton());

    expect(await screen.findByText(payrollLabels.validation.noteRequired)).toBeInTheDocument();
    expect(mutationCalls).toBe(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("blocks a Partially submit without a note", async () => {
    renderDialog();

    selectTarget(payrollLabels.override.target.Partially);
    fireEvent.change(percentageField(), { target: { value: "50" } });
    fireEvent.click(submitButton());

    expect(await screen.findByText(payrollLabels.validation.noteRequired)).toBeInTheDocument();
    expect(mutationCalls).toBe(0);
  });

  test("rejects percentages outside 0–100 and non-integer values", async () => {
    renderDialog();

    selectTarget(payrollLabels.override.target.Partially);
    fillNote("Custom split");
    fireEvent.change(percentageField(), { target: { value: "150" } });
    fireEvent.click(submitButton());

    expect(await screen.findByText(payrollLabels.validation.percentageRequired)).toBeInTheDocument();

    fireEvent.change(percentageField(), { target: { value: "12.5" } });
    fireEvent.click(submitButton());
    await waitFor(() => {
      expect(screen.getByText(payrollLabels.validation.percentageRequired)).toBeInTheDocument();
    });
    expect(mutationCalls).toBe(0);
  });

  test("a stale percentage left by a Partially attempt never blocks the other targets", async () => {
    renderDialog({ mocks: [successfulOverrideMock(refundInput("Refunding the parent"))] });

    // Type an out-of-range percentage, then switch targets: the hidden field
    // keeps its value, but only the Partially target validates it (server
    // parity), so the Refund submit goes through with a null percentage.
    selectTarget(payrollLabels.override.target.Partially);
    fireEvent.change(percentageField(), { target: { value: "150" } });
    selectTarget(payrollLabels.override.target.Refund);
    fillNote("Refunding the parent");
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("submits a valid Partially override with the exact mutation input", async () => {
    renderDialog({ mocks: [successfulOverrideMock(partiallyInput(50, "Half month settlement"))] });

    selectTarget(payrollLabels.override.target.Partially);
    fireEvent.change(percentageField(), { target: { value: "50" } });
    fillNote("Half month settlement");
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(showNotification).toHaveBeenCalledWith(payrollLabels.success.overridden, { severity: "success" });
  });

  test("a double-clicked submit fires exactly one mutation", async () => {
    renderDialog({ mocks: [successfulOverrideMock(refundInput("Refunding the parent"))] });

    selectTarget(payrollLabels.override.target.Refund);
    fillNote("Refunding the parent");
    const submit = submitButton();
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("PAYROLL_ALREADY_PAID renders a non-dismissable banner and keeps the dialog open", async () => {
    renderDialog({ mocks: [domainErrorMock(refundInput("Refund attempt"), "PAYROLL_ALREADY_PAID", "Already paid")] });

    selectTarget(payrollLabels.override.target.Refund);
    fillNote("Refund attempt");
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
    });
    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent(payrollLabels.error.alreadyPaid);
    expect(within(banner).queryByRole("button")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("PAYROLL_AWAITING_SETTLEMENT highlights the force checkbox and a forced retry succeeds", async () => {
    renderDialog({
      mocks: [
        domainErrorMock(
          refundInput("Override while awaiting settlement"),
          "PAYROLL_AWAITING_SETTLEMENT",
          "Awaiting settlement"
        ),
        successfulOverrideMock(refundInput("Override while awaiting settlement", true)),
      ],
    });

    selectTarget(payrollLabels.override.target.Refund);
    fillNote("Override while awaiting settlement");
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
    });
    expect(await screen.findByText(payrollLabels.error.awaitingSettlement)).toBeInTheDocument();
    const forceCheckbox = screen.getByRole("checkbox", { name: payrollLabels.override.force });
    const describedById = forceCheckbox.getAttribute("aria-describedby");
    expect(describedById).not.toBeNull();
    expect(document.getElementById(describedById ?? "")?.textContent).toContain(payrollLabels.error.awaitingSettlement);

    fireEvent.click(forceCheckbox);
    await waitFor(() => {
      expect(screen.queryByText(payrollLabels.error.awaitingSettlement)).toBeNull();
    });
    expect(forceCheckbox.getAttribute("aria-describedby")).toBeNull();

    fireEvent.click(submitButton());
    await waitFor(() => {
      expect(mutationCalls).toBe(2);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(showNotification).toHaveBeenCalledWith(payrollLabels.success.overridden, { severity: "success" });
  });

  test("shows the force checkbox for a Waiting Paid row without any rejection", async () => {
    renderDialog({ row: { ...PAYROLL_ROW, calculationStatus: CalculationStatus.WaitingPaid } });

    expect(await screen.findByRole("checkbox", { name: payrollLabels.override.force })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("a successful override evicts the cached report, toasts, and closes the dialog", async () => {
    renderDialog({ mocks: [successfulOverrideMock(refundInput("Zeroing the session pay"))] });

    await waitFor(() => {
      expect(clientRef.current).not.toBeNull();
    });
    const client = clientRef.current;
    if (client === null) throw new Error("Apollo client was not captured");
    client.cache.writeQuery({
      query: payrollReportQueryDocument,
      variables: REPORT_QUERY_VARIABLES,
      data: REPORT_CACHE_DATA,
    });
    expect(
      client.cache.readQuery({ query: payrollReportQueryDocument, variables: REPORT_QUERY_VARIABLES })
    ).not.toBeNull();

    selectTarget(payrollLabels.override.target.Refund);
    fillNote("Zeroing the session pay");
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(client.cache.readQuery({ query: payrollReportQueryDocument, variables: REPORT_QUERY_VARIABLES })).toBeNull();
    expect(showNotification).toHaveBeenCalledWith(payrollLabels.success.overridden, { severity: "success" });
  });

  test("passes injection-laden notes through as plain mutation data", async () => {
    const payload = `<img src=x onerror="alert('payroll-xss')"><script>alert("note")</script>`;
    renderDialog({
      row: { ...PAYROLL_ROW, payrollNote: `<script>alert("summary-note")</script>` },
      mocks: [successfulOverrideMock(refundInput(payload))],
    });

    // The existing row note renders as inert text; React escapes markup.
    expect(await screen.findByText(`<script>alert("summary-note")</script>`)).toBeInTheDocument();

    selectTarget(payrollLabels.override.target.Refund);
    fillNote(payload);
    fireEvent.click(submitButton());

    // The exact-variable mock match proves the payload crossed to the mutation
    // byte-for-byte; sanitization is the server's responsibility.
    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("Escape requests the dialog close", async () => {
    renderDialog();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("passes axe accessibility checks in the default state", async () => {
    const { container } = renderDialog();

    expect(await screen.findByRole("radiogroup")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  test("passes axe accessibility checks with the Partially target selected", async () => {
    const { container } = renderDialog();

    selectTarget(payrollLabels.override.target.Partially);
    expect(await screen.findByRole("spinbutton")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  test("moves focus into the dialog on open and names the target radiogroup", async () => {
    renderDialog();

    const dialog = await screen.findByRole("dialog");
    // The dialog modal traps focus: the initial focus lands inside the
    // surface, so keyboard users never start behind the overlay.
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByRole("radiogroup", { name: payrollLabels.column.status })).toBeInTheDocument();
  });

  test("renders right-to-left with Arabic labels across the override surface", async () => {
    renderDialog({ locale: rtlLocale });

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(payrollLabelsAr.override.title)).toBeInTheDocument();
    for (const label of [
      payrollLabelsAr.override.target.Refund,
      payrollLabelsAr.override.target.Calculated,
      payrollLabelsAr.override.target.NotCalculated,
      payrollLabelsAr.override.target.Partially,
    ]) {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: commonLabelsAr.cancel })).toBeInTheDocument();

    // The conditional percentage field surfaces with its Arabic label.
    fireEvent.click(screen.getByRole("radio", { name: payrollLabelsAr.override.target.Partially }));
    expect(await screen.findByRole("spinbutton", { name: payrollLabelsAr.override.percentage })).toBeInTheDocument();

    // Escape still requests the close under the right-to-left direction.
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("applies the right-to-left theme direction for the Arabic locale", async () => {
    renderWithWrapper(
      <>
        <ThemeDirectionProbe />
        <OverrideDialog open row={PAYROLL_ROW} onClose={onClose} />
      </>,
      { locale: rtlLocale, mocks: [] }
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("theme-direction")).toHaveTextContent("rtl");
  });

  test("passes axe accessibility checks under the Arabic right-to-left locale", async () => {
    const { container } = renderDialog({ locale: rtlLocale });

    await screen.findByRole("radiogroup");
    await expectNoAxeViolations(container);
  });
});
