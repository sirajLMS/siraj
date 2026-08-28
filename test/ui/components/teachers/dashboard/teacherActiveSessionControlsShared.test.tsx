import { afterEach, describe, expect, mock, test } from "bun:test";

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  TeacherActiveSessionControlsShared,
  type TeacherActiveSessionControlsSharedOptions,
  type TeacherActiveSessionControlsSharedProps,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/teacherActiveSessionControlsShared";
import type { AppLocale } from "@/shared/locale/AppLocale";
import type { TeacherDashboardLabels } from "@/shared/locale/types/dashboard/teachers/dashboard";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

const locale: AppLocale = "en";

const activeControlsLabels: TeacherDashboardLabels["activeControls"] = {
  liveNow: "Fixture Live Now",
  sessionControls: "Fixture Session Controls",
  startSession: "Fixture Start Session",
  markAbsent: "Fixture Mark Absent",
  requestLeave: "Fixture Request Leave",
  markAbsentDialogTitle: "Fixture Mark Absent Dialog Title",
  markAbsentConfirmation: "Fixture Mark Absent Confirmation",
  markAbsentConfirm: "Fixture Mark Absent Confirm",
  cancel: "Fixture Cancel",
};

const desktopOptions: TeacherActiveSessionControlsSharedOptions = {
  buttonSize: 32,
  iconFontSize: "small",
};

afterEach(() => {
  cleanup();
});

function renderControls(overrides: Partial<TeacherActiveSessionControlsSharedProps> = {}) {
  const handlers = {
    onStart: mock(() => {}),
    onMarkAbsent: mock(() => {}),
    onRequestLeave: mock(() => {}),
    onAbsentDialogOpen: mock(() => {}),
    onAbsentDialogClose: mock(() => {}),
  };
  const props: TeacherActiveSessionControlsSharedProps = {
    labels: activeControlsLabels,
    absentDialogOpen: false,
    ...handlers,
    ...overrides,
    options: desktopOptions,
  };
  const result = render(<TeacherActiveSessionControlsShared {...props} />, {
    wrapper: ({ children }: { readonly children: ReactNode }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
  return { ...result, ...handlers };
}

describe("TeacherActiveSessionControlsShared mark-absent confirmation", () => {
  test("clicking Mark Absent opens the confirmation dialog without firing the mutation", () => {
    const { container, onAbsentDialogOpen, onMarkAbsent } = renderControls();

    const trigger = container.querySelector(`button[aria-label="${activeControlsLabels.markAbsent}"]`);
    if (!trigger) throw new Error("mark-absent IconButton not found");

    fireEvent.click(trigger);
    expect(onAbsentDialogOpen).toHaveBeenCalledTimes(1);
    expect(onMarkAbsent).not.toHaveBeenCalled();
  });

  test("renders the destructive confirm scaffold with the warning icon and translated copy", async () => {
    renderControls({ absentDialogOpen: true });

    const dialog = await within(document.body).findByRole("dialog");
    expect(dialog).toHaveTextContent(activeControlsLabels.markAbsentDialogTitle);
    expect(dialog).toHaveTextContent(activeControlsLabels.markAbsentConfirmation);
    expect(dialog.querySelector('[data-testid="WarningAmberOutlinedIcon"]')).not.toBeNull();
  });

  test("confirm fires onMarkAbsent and closes; cancel only closes", async () => {
    const { onMarkAbsent, onAbsentDialogClose } = renderControls({ absentDialogOpen: true });

    const dialog = await within(document.body).findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: activeControlsLabels.markAbsentConfirm });

    fireEvent.click(confirm);
    expect(onMarkAbsent).toHaveBeenCalledTimes(1);
    expect(onAbsentDialogClose).toHaveBeenCalledTimes(1);

    fireEvent.click(within(dialog).getByRole("button", { name: activeControlsLabels.cancel }));
    expect(onAbsentDialogClose).toHaveBeenCalledTimes(2);
  });

  test("loading state disables actions and keeps the mutation from firing", async () => {
    const { onMarkAbsent } = renderControls({ absentDialogOpen: true, markAbsentLoading: true });

    const dialog = await within(document.body).findByRole("dialog");
    const confirm = dialog.querySelector('button[aria-busy="true"]');
    const cancel = within(dialog).getByRole("button", { name: activeControlsLabels.cancel });

    expect(confirm).not.toBeNull();
    expect(confirm).toBeDisabled();
    expect(cancel).toBeDisabled();
    expect(within(dialog).getByRole("progressbar")).toBeInTheDocument();

    if (confirm) {
      fireEvent.click(confirm);
    }
    expect(onMarkAbsent).not.toHaveBeenCalled();
  });

  test("renders no dialog when the mark-absent control is hidden", () => {
    renderControls({ absentDialogOpen: true, showMarkAbsent: false });
    expect(within(document.body).queryByRole("dialog")).toBeNull();
  });
});
