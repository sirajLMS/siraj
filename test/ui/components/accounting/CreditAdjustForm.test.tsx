import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const mockPush = mock(() => {});

await mockNextNavigation("/accounting/credits/adjust", {
  mockPush,
  locales: ["ar", "en"],
  defaultLocale: "en",
  routingIncludeReplaceAndPrefetch: false,
  includeReplaceAndPrefetch: false,
});

// The toast host needs a Toolpad provider chain TestWrapper does not set up;
// the form only calls `show`, so a minimal hook mock is enough.
const showNotification = mock((_message: string, _options?: unknown) => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

import type { MockLink } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import {
  CreditAdjustmentType as CreditAdjustmentGqlType,
  type CreditAdjustmentInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { recordCreditAdjustmentMutationDocument } from "@/frontend/common/graphql/sharedDocuments/billing/credit-adjustment.documents";
import { studentByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student.documents";
import { studentsDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-directory.documents";
import { teachersQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/teacher.documents";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import { useUserAutocompleteStore } from "@/frontend/common/stores/userAutocompleteStore";
import { CreditAdjustForm } from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm";
import { CreditAdjustmentType } from "@/shared/constants/billing";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardBillingCreditAdjustment } from "@/shared/locale/namespaces";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";

// Namespace not part of the shared preload — warm it here so reads resolve
// synchronously inside component renders.
try {
  readTranslation(DashboardBillingCreditAdjustment, locale);
} catch (thrown) {
  if (thrown instanceof Promise) {
    await thrown;
  }
}

const credits = readTranslation(DashboardBillingCreditAdjustment, locale);
const userSelect = readTranslation(Translation.Ui.UserSelect, locale);

const STUDENT_ID = "s-1";
const STUDENT_NAME = "Layla Haddad";
const TEACHER_ID = "t-1";
const TEACHER_NAME = "Karim Mansour";
const NOTES_HTML = "<p>Welcome bonus</p>";

/** Counts actual mutation invocations (`newData` runs once per network call). */
let mutationCalls = 0;

afterEach(() => {
  cleanup();
  mockPush.mockClear();
  showNotification.mockClear();
  mutationCalls = 0;
  useCreditAdjustFormStore.getState().reset();
  useUserAutocompleteStore.setState({ byAudience: { teacher: {}, student: {}, parent: {}, user: {}, staff: {} } });
});

const studentDirectoryMock: MockLink.MockedResponse = {
  request: { query: studentsDirectoryQueryDocument, variables: { search: null, limit: 20 } },
  result: {
    data: {
      studentsDirectory: [
        {
          __typename: "StudentDirectoryRow",
          id: STUDENT_ID,
          name: STUDENT_NAME,
          email: null,
          avatarUrl: null,
          status: "REGULAR",
          classesRemaining: 14,
          classesTotal: 20,
          hoursPerWeek: 2,
          teacherName: TEACHER_NAME,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

// After an option is picked, the picker echoes the label back as the search
// term (reason "selectOption"), which re-fires the autocomplete query.
const studentSelectionEchoMock: MockLink.MockedResponse = {
  request: { query: studentsDirectoryQueryDocument, variables: { search: STUDENT_NAME, limit: 20 } },
  result: studentDirectoryMock.result,
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const teachersMock: MockLink.MockedResponse = {
  request: { query: teachersQueryDocument, variables: { search: "", limit: 20 } },
  result: {
    data: {
      teachers: [{ __typename: "TeacherSimple", id: TEACHER_ID, name: TEACHER_NAME, avatarUrl: null }],
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const teacherSelectionEchoMock: MockLink.MockedResponse = {
  request: { query: teachersQueryDocument, variables: { search: TEACHER_NAME, limit: 20 } },
  result: teachersMock.result,
  maxUsageCount: Number.POSITIVE_INFINITY,
};

function preselectedStudentMock(studentId: string): MockLink.MockedResponse {
  return {
    request: { query: studentByIdQueryDocument, variables: { studentId } },
    result: {
      data: {
        studentById: {
          __typename: "AssociatedStudent",
          id: STUDENT_ID,
          name: STUDENT_NAME,
          avatarUrl: null,
          status: "REGULAR",
          primaryTeacherId: TEACHER_ID,
          teacherName: TEACHER_NAME,
          hoursPerWeek: 2,
          classesRemaining: 14,
          classesTotal: 20,
          language: "en",
          gender: "FEMALE",
          version: 3,
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    },
  };
}

function adjustmentResult(input: CreditAdjustmentInput) {
  return {
    __typename: "CreditAdjustmentResult",
    id: "tx-1",
    studentId: input.studentId,
    changeAmount: input.adjustmentType === CreditAdjustmentGqlType.Add ? input.hours : -input.hours,
    changeAmountHours: String(input.hours),
    reason: "Adjustment",
    adjustmentType: input.adjustmentType,
    carryoverTeacherId: input.carryoverTeacherId ?? null,
    carryoverFromDate: input.carryoverFromDate ?? null,
    carryoverToDate: input.carryoverToDate ?? null,
    carryoverPaymentDate: input.carryoverPaymentDate ?? null,
    notes: input.notes ?? "",
    creditedByUserId: "admin-1",
    createdAt: "2026-08-29T00:00:00.000Z",
    updatedAt: "2026-08-29T00:00:00.000Z",
  };
}

function successfulAdjustmentMock(input: CreditAdjustmentInput): MockLink.MockedResponse {
  return {
    request: { query: recordCreditAdjustmentMutationDocument, variables: { input } },
    result: () => {
      mutationCalls += 1;
      return { data: { recordCreditAdjustment: adjustmentResult(input) } };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

function insufficientClassesMock(input: CreditAdjustmentInput): MockLink.MockedResponse {
  return {
    request: { query: recordCreditAdjustmentMutationDocument, variables: { input } },
    result: () => {
      mutationCalls += 1;
      return {
        data: { recordCreditAdjustment: null },
        errors: [new GraphQLError("Insufficient class balance", { extensions: { code: "INSUFFICIENT_CLASSES" } })],
      };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

/** Seeds the store with a fully valid Add draft (notes seeded; editor behavior is covered elsewhere). */
function seedAddDraft(): void {
  useCreditAdjustFormStore.setState({
    studentId: STUDENT_ID,
    adjustmentType: CreditAdjustmentType.ADD,
    hours: 3,
    notes: NOTES_HTML,
  });
}

const addInput: CreditAdjustmentInput = {
  studentId: STUDENT_ID,
  adjustmentType: CreditAdjustmentGqlType.Add,
  hours: 3,
  notes: NOTES_HTML,
  carryoverTeacherId: null,
  carryoverFromDate: null,
  carryoverToDate: null,
  carryoverPaymentDate: null,
};

const carryoverInput: CreditAdjustmentInput = {
  studentId: STUDENT_ID,
  adjustmentType: CreditAdjustmentGqlType.SubtractWithCarryover,
  hours: 4,
  notes: NOTES_HTML,
  carryoverTeacherId: TEACHER_ID,
  carryoverFromDate: "2026-08-01",
  carryoverToDate: "2026-08-15",
  carryoverPaymentDate: "2026-08-20",
};

describe("credit adjust form (component)", () => {
  test("shows the carryover banner only while the carryover radio is selected", async () => {
    renderWithWrapper(<CreditAdjustForm studentId={null} />, { locale, mocks: [studentDirectoryMock, teachersMock] });

    expect(screen.queryByText(credits.carryover.bannerTitle)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: credits.adjustmentType.subtractWithCarryover }));
    expect(await screen.findByText(credits.carryover.bannerTitle)).toBeVisible();

    fireEvent.click(screen.getByRole("radio", { name: credits.adjustmentType.subtract }));
    await waitFor(() => {
      expect(screen.queryByText(credits.carryover.bannerTitle)).not.toBeInTheDocument();
    });
  });

  test("switching back to Add clears the carryover fields from the store (E3)", async () => {
    renderWithWrapper(<CreditAdjustForm studentId={null} />, { locale, mocks: [studentDirectoryMock, teachersMock] });

    fireEvent.click(screen.getByRole("radio", { name: credits.adjustmentType.subtractWithCarryover }));
    expect(await screen.findByText(credits.carryover.bannerTitle)).toBeVisible();

    await act(async () => {
      useCreditAdjustFormStore.setState({
        carryoverTeacherId: TEACHER_ID,
        fromDate: "2026-08-01",
        toDate: "2026-08-15",
        paymentDate: "2026-08-20",
      });
    });

    fireEvent.click(screen.getByRole("radio", { name: credits.adjustmentType.add }));

    const state = useCreditAdjustFormStore.getState();
    expect(state.adjustmentType).toBe(CreditAdjustmentType.ADD);
    expect(state.carryoverTeacherId).toBeNull();
    expect(state.fromDate).toBeNull();
    expect(state.toDate).toBeNull();
    expect(state.paymentDate).toBeNull();
    await waitFor(() => {
      expect(screen.queryByText(credits.carryover.bannerTitle)).not.toBeInTheDocument();
    });
  });

  test("submitting an Add sends positive hours without carryover fields and navigates back", async () => {
    renderWithWrapper(<CreditAdjustForm studentId={null} />, {
      locale,
      mocks: [studentDirectoryMock, studentSelectionEchoMock, successfulAdjustmentMock(addInput)],
    });

    // Pick the student through the real autocomplete; hours via the number field;
    // the reason seed goes through the store (editor behavior has its own suite).
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: userSelect.studentLabel })).toBeEnabled();
    });
    fireEvent.mouseDown(screen.getByRole("combobox", { name: userSelect.studentLabel }));
    fireEvent.click(await screen.findByRole("option", { name: new RegExp(STUDENT_NAME) }));
    fireEvent.change(screen.getByRole("spinbutton", { name: credits.hours.label }), { target: { value: "3" } });
    await act(async () => {
      useCreditAdjustFormStore.setState({ notes: NOTES_HTML });
    });

    fireEvent.click(screen.getByRole("button", { name: credits.adjustCredits }));

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(showNotification).toHaveBeenCalledWith(credits.success.added(3), { severity: "success" });
      expect(mockPush).toHaveBeenCalledWith("/accounting/credits");
    });
  });

  test("submitting a carryover sends all carryover fields and names the teacher in the toast", async () => {
    renderWithWrapper(<CreditAdjustForm studentId={null} />, {
      locale,
      mocks: [studentDirectoryMock, teachersMock, teacherSelectionEchoMock, successfulAdjustmentMock(carryoverInput)],
    });

    await act(async () => {
      useCreditAdjustFormStore.setState({
        studentId: STUDENT_ID,
        hours: 4,
        notes: NOTES_HTML,
        fromDate: "2026-08-01",
        toDate: "2026-08-15",
        paymentDate: "2026-08-20",
      });
    });

    fireEvent.click(screen.getByRole("radio", { name: credits.adjustmentType.subtractWithCarryover }));
    expect(await screen.findByText(credits.carryover.bannerTitle)).toBeVisible();

    // The teacher is picked through the real autocomplete so the result cache
    // can supply the display name for the success toast.
    fireEvent.mouseDown(screen.getByRole("combobox", { name: credits.carryover.teacher }));
    fireEvent.click(await screen.findByRole("option", { name: new RegExp(TEACHER_NAME) }));

    expect(useCreditAdjustFormStore.getState().carryoverTeacherId).toBe(TEACHER_ID);

    fireEvent.click(screen.getByRole("button", { name: credits.adjustCredits }));

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(showNotification).toHaveBeenCalledWith(credits.success.carryover(4, TEACHER_NAME), {
        severity: "success",
      });
      expect(mockPush).toHaveBeenCalledWith("/accounting/credits");
    });
  });

  test("fromDate after toDate blocks submission with the inline range error (AC-4.3)", async () => {
    renderWithWrapper(<CreditAdjustForm studentId={null} />, {
      locale,
      mocks: [studentDirectoryMock, teachersMock],
    });

    fireEvent.click(screen.getByRole("radio", { name: credits.adjustmentType.subtractWithCarryover }));
    expect(await screen.findByText(credits.carryover.bannerTitle)).toBeVisible();

    await act(async () => {
      useCreditAdjustFormStore.setState({
        studentId: STUDENT_ID,
        hours: 2,
        notes: NOTES_HTML,
        carryoverTeacherId: TEACHER_ID,
        fromDate: "2026-08-20",
        toDate: "2026-08-01",
        paymentDate: "2026-08-25",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: credits.adjustCredits }));

    expect((await screen.findAllByText(credits.validation.fromAfterTo)).length).toBeGreaterThan(0);
    expect(mutationCalls).toBe(0);
    expect(showNotification).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("a double click submits exactly one mutation", async () => {
    renderWithWrapper(<CreditAdjustForm studentId={null} />, {
      locale,
      mocks: [studentDirectoryMock, successfulAdjustmentMock(addInput)],
    });

    await act(async () => {
      seedAddDraft();
    });

    const submit = screen.getByRole("button", { name: credits.adjustCredits });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/accounting/credits");
      expect(mutationCalls).toBe(1);
    });
  });

  test("INSUFFICIENT_CLASSES surfaces as an inline hours error without navigating", async () => {
    renderWithWrapper(<CreditAdjustForm studentId={null} />, {
      locale,
      mocks: [studentDirectoryMock, insufficientClassesMock(addInput)],
    });

    await act(async () => {
      seedAddDraft();
    });

    fireEvent.click(screen.getByRole("button", { name: credits.adjustCredits }));

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
    });
    expect(await screen.findByText(credits.validation.insufficientClasses)).toBeVisible();
    expect(mockPush).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("a deep-linked student is seeded into the store and shown in the picker (AC-1.5)", async () => {
    renderWithWrapper(<CreditAdjustForm studentId={STUDENT_ID} />, {
      locale,
      mocks: [studentDirectoryMock, preselectedStudentMock(STUDENT_ID)],
    });

    expect(useCreditAdjustFormStore.getState().studentId).toBe(STUDENT_ID);
    // The summary row carries the resolved name + balance (the picker itself
    // only echoes typed search text when a value is set programmatically).
    expect(await screen.findByText(STUDENT_NAME)).toBeVisible();
    expect(screen.getByText("14 / 20")).toBeVisible();
  });
});
