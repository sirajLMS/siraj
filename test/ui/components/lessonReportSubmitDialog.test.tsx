import { afterEach, describe, expect, mock, test } from "bun:test";

const loggerError = mock(() => {});

await mock.module("@/frontend/common/utils/logger", () => ({
  logger: {
    info: () => {},
    warn: () => {},
    debug: () => {},
    error: loggerError,
  },
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AttendanceEvaluation } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { LessonReportSubmitDialog } from "@/frontend/common/views/dashboard/teachers/dashboard/components/LessonReportSubmitDialog";
import type { LessonReportFormLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const lessonReportLabels = readTranslation(Translation.Dashboard.LmsLessonReports, locale);
const MOCK_LABELS: LessonReportFormLabels = {
  attendanceEvaluation: lessonReportLabels.attendanceEvaluation,
  durationMinutes: lessonReportLabels.durationMinutes,
  completionPercentage: lessonReportLabels.completionPercentage,
  teacherNotes: lessonReportLabels.teacherNotes,
  present: lessonReportLabels.present,
  absent: lessonReportLabels.absent,
  late: lessonReportLabels.late,
  submit: lessonReportLabels.submit,
  dialogTitle: lessonReportLabels.dialogTitle,
  cancel: lessonReportLabels.cancel,
  submitting: lessonReportLabels.submitting,
  submitFailed: lessonReportLabels.submitFailed,
  attendanceRequired: lessonReportLabels.attendanceRequired,
  durationMin: lessonReportLabels.durationMin,
  durationMax: lessonReportLabels.durationMax,
  completionMin: lessonReportLabels.completionMin,
  completionMax: lessonReportLabels.completionMax,
};

afterEach(() => {
  loggerError.mockClear();
  cleanup();
});

describe("LessonReportSubmitDialog", () => {
  test("renders form fields when open", () => {
    renderWithWrapper(
      <LessonReportSubmitDialog
        open={true}
        onClose={() => {}}
        classInstanceId="cls-1"
        labels={MOCK_LABELS}
        onSubmit={() => Promise.resolve()}
      />,
      { locale }
    );

    expect(screen.getByText(MOCK_LABELS.dialogTitle)).toBeVisible();
    expect(screen.getByText(MOCK_LABELS.attendanceEvaluation)).toBeVisible();
    expect(screen.getByText(MOCK_LABELS.durationMinutes)).toBeVisible();
    expect(screen.getByLabelText(MOCK_LABELS.teacherNotes)).toBeVisible();
    expect(screen.getByRole("button", { name: MOCK_LABELS.submit })).toBeVisible();
    expect(screen.getByRole("button", { name: MOCK_LABELS.cancel })).toBeVisible();
  });

  test("calls onSubmit with form data when submitted", async () => {
    const onSubmit = mock(() => Promise.resolve());
    const onClose = mock(() => {});

    renderWithWrapper(
      <LessonReportSubmitDialog
        open={true}
        onClose={onClose}
        classInstanceId="cls-1"
        defaultDurationMinutes={60}
        labels={MOCK_LABELS}
        onSubmit={onSubmit}
      />,
      { locale }
    );

    const submitButton = screen.getByText(MOCK_LABELS.submit);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      classInstanceId: "cls-1",
      attendanceEvaluation: AttendanceEvaluation.Present,
      durationMinutes: 60,
      completionPercentage: 100,
      teacherNotes: "",
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("shows error alert when onSubmit fails", async () => {
    const onSubmit = mock(() => Promise.reject(new Error("Network error")));
    const onClose = mock(() => {});

    renderWithWrapper(
      <LessonReportSubmitDialog
        open={true}
        onClose={onClose}
        classInstanceId="cls-1"
        labels={MOCK_LABELS}
        onSubmit={onSubmit}
      />,
      { locale }
    );

    fireEvent.click(screen.getByText(MOCK_LABELS.submit));

    await waitFor(() => {
      expect(screen.getByText(MOCK_LABELS.submitFailed)).toBeVisible();
    });

    expect(loggerError).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
