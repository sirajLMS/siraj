import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AttendanceEvaluation } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  LessonReportFormLabels,
  LessonReportFormSubmitInput,
} from "@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes";
import { LessonReportSubmitDialogDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/lessonReportSubmitDialog.desktop";
import { LessonReportSubmitDialogMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/lessonReportSubmitDialog.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const lessonReportTranslations = readTranslation(Translation.Dashboard.LmsLessonReports, locale);

const lessonReportLabels: LessonReportFormLabels = {
  attendanceEvaluation: lessonReportTranslations.attendanceEvaluation,
  durationMinutes: lessonReportTranslations.durationMinutes,
  completionPercentage: lessonReportTranslations.completionPercentage,
  teacherNotes: lessonReportTranslations.teacherNotes,
  present: lessonReportTranslations.present,
  absent: lessonReportTranslations.absent,
  late: lessonReportTranslations.late,
  submit: lessonReportTranslations.submit,
  dialogTitle: lessonReportTranslations.dialogTitle,
  cancel: lessonReportTranslations.cancel,
  submitting: lessonReportTranslations.submitting,
  submitFailed: lessonReportTranslations.submitFailed,
  attendanceRequired: lessonReportTranslations.attendanceRequired,
  durationMin: lessonReportTranslations.durationMin,
  durationMax: lessonReportTranslations.durationMax,
  completionMin: lessonReportTranslations.completionMin,
  completionMax: lessonReportTranslations.completionMax,
};

afterEach(() => {
  cleanup();
});

describe("LessonReportSubmitDialog tier shells", () => {
  test("desktop tier renders the inline (non-full-screen) shell and submits default form values", async () => {
    const onSubmit = mock((_input: LessonReportFormSubmitInput) => Promise.resolve());
    const onClose = mock(() => {});

    const { baseElement } = renderWithWrapper(
      <LessonReportSubmitDialogDesktop
        open={true}
        onClose={onClose}
        classInstanceId="cls-1"
        defaultDurationMinutes={60}
        labels={lessonReportLabels}
        onSubmit={onSubmit}
      />,
      { locale, viewport: "desktop" }
    );

    expect(baseElement.querySelector(".MuiDialog-paperFullScreen")).not.toBeInTheDocument();
    expect(baseElement.querySelector(".MuiDialog-paperWidthSm")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: lessonReportLabels.dialogTitle })).toBeVisible();

    screen.getByRole("button", { name: lessonReportLabels.submit }).click();

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

  test("mobile tier renders the full-screen shell and closes through the cancel action", () => {
    const onSubmit = mock((_input: LessonReportFormSubmitInput) => Promise.resolve());
    const onClose = mock(() => {});

    const { baseElement } = renderWithWrapper(
      <LessonReportSubmitDialogMobile
        open={true}
        onClose={onClose}
        classInstanceId="cls-1"
        labels={lessonReportLabels}
        onSubmit={onSubmit}
      />,
      { locale, viewport: "mobile" }
    );

    expect(baseElement.querySelector(".MuiDialog-paperFullScreen")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: lessonReportLabels.attendanceEvaluation })).toBeVisible();

    screen.getByRole("button", { name: lessonReportLabels.cancel }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
