import { afterEach, describe, expect, mock, test } from "bun:test";

const loggerError = mock(() => {});

mock.module("@/frontend/common/utils/logger", () => ({
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
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const MOCK_LABELS: LessonReportFormLabels = {
  attendanceEvaluation: "Attendance",
  durationMinutes: "Duration (min)",
  completionPercentage: "Completion",
  teacherNotes: "Teacher Notes",
  present: "Present",
  absent: "Absent",
  late: "Late",
  submit: "Submit",
  dialogTitle: "Submit Lesson Report",
  cancel: "Cancel",
  submitting: "Submitting...",
  submitFailed: "Submission failed",
  attendanceRequired: "Attendance is required",
  durationMin: "Duration must be at least 1",
  durationMax: "Duration must be at most 600",
  completionMin: "Completion must be at least 0",
  completionMax: "Completion must be at most 100",
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
      />
    );

    expect(screen.getByText("Submit Lesson Report")).toBeVisible();
    expect(screen.getByText("Attendance")).toBeVisible();
    expect(screen.getByText("Duration (min)")).toBeVisible();
    expect(screen.getByLabelText("Teacher Notes")).toBeVisible();
    expect(screen.getByRole("button", { name: "Submit" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
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
      />
    );

    const submitButton = screen.getByText("Submit");
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
      />
    );

    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Submission failed")).toBeVisible();
    });

    expect(loggerError).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
