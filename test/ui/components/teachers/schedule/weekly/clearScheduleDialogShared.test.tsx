import { afterEach, describe, expect, mock, test } from "bun:test";

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, within } from "@testing-library/react";
import { ClearScheduleDialogShared } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/__shared__/teacherWeeklyScheduleViewShared";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  weeklyScheduleLabels,
  weeklyScheduleLocale,
} from "@/test/ui/components/teachers/schedule/weekly/weeklyScheduleFixtures";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

function renderClearDialog({
  open = true,
  isLoading = false,
  onCancel = mock(() => {}),
  onConfirm = mock(() => {}),
}: {
  readonly open?: boolean;
  readonly isLoading?: boolean;
  readonly onCancel?: () => void;
  readonly onConfirm?: () => void;
} = {}) {
  const result = renderWithWrapper(
    <ClearScheduleDialogShared
      labels={weeklyScheduleLabels}
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />,
    { locale: weeklyScheduleLocale }
  );
  return { ...result, onCancel, onConfirm };
}

describe("ClearScheduleDialogShared (BaseDeleteDialog scaffold)", () => {
  test("renders the destructive-confirm scaffold with warning icon, title and body", async () => {
    renderClearDialog();

    const dialog = await within(document.body).findByRole("dialog");
    expect(dialog).toHaveTextContent(weeklyScheduleLabels.dialogs.clearScheduleTitle);
    expect(dialog).toHaveTextContent(weeklyScheduleLabels.dialogs.clearScheduleMessage);
    expect(dialog.querySelector('[data-testid="WarningAmberOutlinedIcon"]')).not.toBeNull();
  });

  test("confirm fires onConfirm; cancel fires onCancel only", async () => {
    const onCancel = mock(() => {});
    const onConfirm = mock(() => {});
    renderClearDialog({ onCancel, onConfirm });

    const dialog = await within(document.body).findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: weeklyScheduleLabels.actions.clearSchedule }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: weeklyScheduleLabels.dialogs.cancel }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("loading state disables both buttons and marks the confirm control busy", async () => {
    const onConfirm = mock(() => {});
    renderClearDialog({ isLoading: true, onConfirm });

    const dialog = await within(document.body).findByRole("dialog");
    const confirm = dialog.querySelector('button[aria-busy="true"]');
    const cancel = within(dialog).getByRole("button", { name: weeklyScheduleLabels.dialogs.cancel });

    expect(confirm).not.toBeNull();
    expect(confirm).toBeDisabled();
    expect(cancel).toBeDisabled();
    expect(within(dialog).getByRole("progressbar")).toBeInTheDocument();

    if (confirm) {
      fireEvent.click(confirm);
    }
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("closed dialog renders nothing", () => {
    renderClearDialog({ open: false });
    expect(within(document.body).queryByRole("dialog")).toBeNull();
  });
});
