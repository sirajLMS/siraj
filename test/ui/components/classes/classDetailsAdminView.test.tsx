import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { supportedCurrenciesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/currency-catalog.documents";
import { useClassDetailsStore } from "@/frontend/common/stores/classDetailsStore";
import { ClassDetailsAdminView } from "@/frontend/common/views/dashboard/classes/details/admin/ClassDetailsAdminView";
import {
  buildOverrideRateDialog,
  type ClassInstance,
  type OverrideRateDialogState,
} from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import type {
  AdminViewProps,
  ClassDetailsMetricGridSlot,
} from "@/frontend/common/views/dashboard/classes/details/types";
import { useAdminViewLabels } from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.ClassDetails, locale);

const SUPPORTED_CURRENCIES_MOCKS = [
  {
    request: { query: supportedCurrenciesQueryDocument, variables: { activeOnly: true } },
    result: {
      data: {
        supportedCurrencies: [
          {
            __typename: "SupportedCurrency",
            id: "currency-sar",
            code: CurrencyCode.Sar,
            symbol: "ر.س",
            countryCode: "SA",
            decimals: 2,
            sortOrder: 1,
            isActive: true,
          },
        ],
      },
    },
  },
];

const noop = () => {};
const noopAsync = () => Promise.resolve();

function makeInstance(overrides: Partial<ClassInstance> = {}): ClassInstance {
  return {
    id: "ci-1",
    courseName: "Math",
    classType: null,
    instanceId: "inst-1",
    scheduledDate: "2026-08-20",
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    status: null,
    remarks: null,
    hasTimezoneMismatch: false,
    studentTimezone: null,
    teacherTimezone: null,
    recurringScheduleId: null,
    payrollCredited: false,
    isRescheduled: false,
    isFrozen: false,
    executionState: null,
    outcome: null,
    avatarUrl: null,
    subjectId: "sub-1",
    subjectName: "Mathematics",
    subjectAvatarUrl: null,
    rateAmount: "75",
    rateCurrency: CurrencyCode.Sar,
    isRateOverridden: false,
    rateSource: null,
    effectiveMeeting: null,
    student: { id: "student-1", name: "Student One", grade: null, level: null, avatarUrl: null },
    teacher: { id: "teacher-1", name: "Teacher One", title: null, avatarUrl: null },
    performance: null,
    ...overrides,
  };
}

type OverrideCall = readonly [amount: string | null, currency: CurrencyCode | null];

function buildDialogProps(): { dialog: OverrideRateDialogState; calls: OverrideCall[] } {
  const calls: OverrideCall[] = [];
  const state = useClassDetailsStore.getState();
  const dialog = buildOverrideRateDialog(
    {
      open: state.overrideDialogOpen,
      amount: state.overrideRateAmount,
      currency: state.overrideRateCurrency,
      setAmount: state.setOverrideRateAmount,
      setCurrency: state.setOverrideRateCurrency,
      setOpen: state.setOverrideDialogOpen,
      openDialog: state.openOverrideDialog,
    },
    {
      handleForceActivate: noopAsync,
      handleStop: noopAsync,
      handleActivate: noopAsync,
      handleDeleteConfirm: noopAsync,
      handleReschedule: noop,
      handleInfoEdit: noop,
      handleOverrideRate: async (rateAmount: string | null, rateCurrency: CurrencyCode | null) => {
        calls.push([rateAmount, rateCurrency]);
      },
    },
    "75",
    CurrencyCode.Sar
  );
  return { dialog, calls };
}

const StubMetricGrid: ClassDetailsMetricGridSlot = () => <div data-testid="live-metric-grid" />;

interface HarnessProps extends Omit<AdminViewProps, "overrideRateDialog"> {
  readonly dialog: OverrideRateDialogState;
}

function AdminViewHarness(props: HarnessProps) {
  const labels = useAdminViewLabels("");
  return (
    <ClassDetailsAdminView
      {...props}
      overrideRateDialog={props.dialog}
      labels={labels}
      livePerformanceMetricGrid={StubMetricGrid}
    />
  );
}

function renderAdminView(overrides: Partial<ClassInstance> = {}) {
  const { dialog, calls } = buildDialogProps();
  renderWithWrapper(
    <AdminViewHarness
      instance={makeInstance(overrides)}
      dialog={dialog}
      isWarningDismissed={false}
      onDismissWarning={noop}
      onForceActivate={noop}
      onStop={noop}
      onGenerateLog={noop}
      onReschedule={noop}
      onDelete={noop}
      onStart={noopAsync}
      onAbsent={noopAsync}
      onLeave={noopAsync}
      onReset={noopAsync}
      isStarting={false}
      isMarkingAbsent={false}
      isProcessingLeave={false}
      isResetting={false}
      error={null}
      handlers={{
        handleForceActivate: noopAsync,
        handleStop: noopAsync,
        handleActivate: noopAsync,
        handleDeleteConfirm: noopAsync,
        handleReschedule: noop,
        handleInfoEdit: noop,
        handleOverrideRate: noopAsync,
      }}
      formattedScheduledDate="2026-08-20"
      formattedStartTime="10:00"
      formattedEndTime="11:00"
    />,
    { locale, mocks: SUPPORTED_CURRENCIES_MOCKS }
  );
  return { calls };
}

describe("ClassDetailsAdminView override-rate dialog", () => {
  beforeEach(() => {
    useClassDetailsStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
  });

  test("does not render the dialog while the store flag is closed", () => {
    renderAdminView();

    expect(screen.queryByText(t.instanceDetails.overrideRateDialogTitle)).toBeNull();
  });

  test("clicking the override action opens the dialog via the store with seeded values", () => {
    renderAdminView();

    fireEvent.click(screen.getByRole("button", { name: t.instanceDetails.overrideRateButton }));

    const state = useClassDetailsStore.getState();
    expect(state.overrideDialogOpen).toBe(true);
    expect(state.overrideRateAmount).toBe("75");
    expect(state.overrideRateCurrency).toBe(CurrencyCode.Sar);
  });

  test("renders the shared CurrencySelect-driven dialog when open and save forwards seeded values", async () => {
    useClassDetailsStore.getState().openOverrideDialog("75", CurrencyCode.Sar);
    const { calls } = renderAdminView();

    expect(await screen.findByText(t.instanceDetails.overrideRateDialogTitle)).toBeInTheDocument();
    expect(screen.getByDisplayValue("75")).toBeInTheDocument();
    // CurrencySelect is a searchable Autocomplete, not a bare enum Select.
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t.instanceDetails.saveButton }));

    await waitFor(() => {
      expect(calls).toEqual([["75", CurrencyCode.Sar]]);
    });
    expect(useClassDetailsStore.getState().overrideDialogOpen).toBe(false);
  });

  test("clear-override button submits nulls and closes the dialog", async () => {
    useClassDetailsStore.getState().openOverrideDialog("75", CurrencyCode.Sar);
    const { calls } = renderAdminView();

    fireEvent.click(await screen.findByRole("button", { name: t.instanceDetails.clearOverrideButton }));

    await waitFor(() => {
      expect(calls).toEqual([[null, null]]);
    });
    expect(useClassDetailsStore.getState().overrideDialogOpen).toBe(false);
  });
});
