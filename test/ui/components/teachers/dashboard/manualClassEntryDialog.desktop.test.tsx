import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";

expect.extend(matchers);

import type { ManualClassEntrySubmitData } from "@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog";
import { ManualClassEntryDialogDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/manualClassEntryDialog.desktop";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  clickManualEntryCreate,
  dialogLocale,
  fillAndSubmitManualEntry,
  MANUAL_ENTRY_STUDENT_ID,
  MANUAL_ENTRY_SUBJECT,
  makeManualEntryProps,
  manualEntryLabels,
  selectManualEntryStudent,
  selectManualEntrySubject,
} from "@/test/ui/components/teachers/dashboard/manualClassEntryDialog.fixtures";

afterEach(() => {
  cleanup();
});

function renderDesktopDialog(overrides: Parameters<typeof makeManualEntryProps>[0] = {}) {
  return renderWithWrapper(<ManualClassEntryDialogDesktop {...makeManualEntryProps(overrides)} />, {
    locale: dialogLocale,
    viewport: "desktop",
  });
}

describe("ManualClassEntryDialogDesktop", () => {
  test("renders the inline desktop shell with the shared date/time pickers and class type selector", () => {
    const { baseElement } = renderDesktopDialog();

    expect(baseElement.querySelector(".MuiDialog-paperFullScreen")).not.toBeInTheDocument();
    expect(baseElement.querySelector(".MuiDialog-paperWidthSm")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog", { name: manualEntryLabels.titleCreate });
    const fields = within(dialog);
    expect(fields.getByRole("group", { name: manualEntryLabels.scheduledDate })).toBeVisible();
    expect(fields.getByRole("group", { name: manualEntryLabels.startTime })).toBeVisible();
    expect(fields.getByRole("combobox", { name: manualEntryLabels.classType })).toBeVisible();
    expect(fields.getByText(manualEntryLabels.durationMinutes)).toBeVisible();
  });

  test("opens the date picker popover from the field action", async () => {
    const { baseElement } = renderDesktopDialog();

    fireEvent.click(screen.getByRole("button", { name: /choose date/i }));

    await waitFor(() => {
      expect(baseElement.querySelector(".MuiPickersLayout-root")).toBeInTheDocument();
    });
  });

  test("blocks submission until the student and subject are selected, then submits computed datetimes", async () => {
    const onSubmit = mock((_data: ManualClassEntrySubmitData) => Promise.resolve());
    renderDesktopDialog({ onSubmit });

    // Empty form never reaches onSubmit.
    clickManualEntryCreate();
    expect(onSubmit).not.toHaveBeenCalled();

    // Subject selected but no student → the student-required error surfaces.
    selectManualEntrySubject();
    clickManualEntryCreate();
    expect(await screen.findByText(manualEntryLabels.selectStudent)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();

    selectManualEntryStudent();
    clickManualEntryCreate();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0]?.[0];
    expect(submitted).toMatchObject({
      studentId: MANUAL_ENTRY_STUDENT_ID,
      subjectId: MANUAL_ENTRY_SUBJECT.id,
      classType: "REGULAR",
      durationMinutes: 60,
    });
    const start = Date.parse(submitted?.scheduledStartAt ?? "");
    const end = Date.parse(submitted?.scheduledEndAt ?? "");
    expect(start).not.toBeNaN();
    expect(end - start).toBe(60 * 60 * 1000);
  });

  test("propagates the selected class type into the submit payload", async () => {
    const onSubmit = mock((_data: ManualClassEntrySubmitData) => Promise.resolve());
    renderDesktopDialog({ onSubmit });

    fireEvent.mouseDown(screen.getByRole("combobox", { name: manualEntryLabels.classType }));
    fireEvent.click(screen.getByRole("option", { name: manualEntryLabels.classTypeTrial }));

    fillAndSubmitManualEntry();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ classType: "TRIAL" });
  });

  test("shows the failure alert and keeps the dialog open when submission rejects", async () => {
    const onSubmit = mock((_data: ManualClassEntrySubmitData) => Promise.reject(new Error("boom")));
    const onClose = mock(() => {});
    renderDesktopDialog({ onSubmit, onClose });

    fillAndSubmitManualEntry();

    expect(await screen.findByText(manualEntryLabels.createFailed)).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
  });
});
