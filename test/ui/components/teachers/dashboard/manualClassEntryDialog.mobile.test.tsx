import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import type { ManualClassEntrySubmitData } from "@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog";
import { ManualClassEntryDialogMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/manualClassEntryDialog.mobile";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  clickManualEntryCreate,
  dialogLocale,
  MANUAL_ENTRY_STUDENT_ID,
  makeManualEntryProps,
  manualEntryLabels,
  selectManualEntryStudent,
  selectManualEntrySubject,
} from "@/test/ui/components/teachers/dashboard/manualClassEntryDialog.fixtures";

afterEach(() => {
  cleanup();
});

function renderMobileDialog(overrides: Parameters<typeof makeManualEntryProps>[0] = {}) {
  return renderWithWrapper(<ManualClassEntryDialogMobile {...makeManualEntryProps(overrides)} />, {
    locale: dialogLocale,
    viewport: "mobile",
  });
}

describe("ManualClassEntryDialogMobile", () => {
  test("renders the full-screen mobile shell with the same shared form fields", () => {
    const { baseElement } = renderMobileDialog();

    expect(baseElement.querySelector(".MuiDialog-paperFullScreen")).toBeInTheDocument();
    expect(baseElement.querySelector(".MuiDialog-paperWidthSm")).not.toBeInTheDocument();

    expect(screen.getByRole("dialog", { name: manualEntryLabels.titleCreate })).toBeVisible();
    expect(screen.getByRole("group", { name: manualEntryLabels.scheduledDate })).toBeVisible();
    expect(screen.getByRole("group", { name: manualEntryLabels.startTime })).toBeVisible();
  });

  test("enforces the required-field validation order before submitting", async () => {
    const onSubmit = mock((_data: ManualClassEntrySubmitData) => Promise.resolve());
    renderMobileDialog({ onSubmit });

    clickManualEntryCreate();
    expect(onSubmit).not.toHaveBeenCalled();

    selectManualEntrySubject();
    clickManualEntryCreate();
    expect(await screen.findByText(manualEntryLabels.selectStudent)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();

    selectManualEntryStudent();
    clickManualEntryCreate();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ studentId: MANUAL_ENTRY_STUDENT_ID });
  });

  test("opens the start-time picker from the field action", async () => {
    const { baseElement } = renderMobileDialog();

    fireEvent.click(screen.getByRole("button", { name: /choose time/i }));

    await waitFor(() => {
      expect(baseElement.querySelector(".MuiPickersLayout-root")).toBeInTheDocument();
    });
  });
});
