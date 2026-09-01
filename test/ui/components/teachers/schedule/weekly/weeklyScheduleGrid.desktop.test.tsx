import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import {
  makeDeletableScheduledClass,
  meetingJoinLabels,
  weeklyScheduleLabels,
  weeklyScheduleLocale,
} from "@/test/ui/components/teachers/schedule/weekly/weeklyScheduleFixtures";

await mockNextNavigation("/teachers", { locale: weeklyScheduleLocale });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import type { ScheduledClass } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import WeeklyScheduleGrid from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(() => {
  cleanup();
  useWeeklyScheduleStore.setState({ deleteConfirmClassInstanceId: null, selectedDay: "monday" });
});

function findDeleteButton(container: HTMLElement): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(
    `button[aria-label="${weeklyScheduleLabels.actions.deleteClass}"]`
  );
  if (!button) throw new Error("delete IconButton not found");
  return button;
}

function renderGrid({
  classes = [makeDeletableScheduledClass()],
  onRemoveClass = mock((_: string) => {}),
  hasScheduleDeleteClass = true,
}: {
  readonly classes?: readonly ScheduledClass[];
  readonly onRemoveClass?: (id: string) => void;
  readonly hasScheduleDeleteClass?: boolean;
} = {}) {
  return render(
    <WeeklyScheduleGrid
      classes={classes}
      onRemoveClass={onRemoveClass}
      hasScheduleDeleteClass={hasScheduleDeleteClass}
      labels={weeklyScheduleLabels}
      meetingJoinLabels={meetingJoinLabels}
    />,
    {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <TestWrapper locale={weeklyScheduleLocale}>{children}</TestWrapper>
      ),
    }
  );
}

describe("WeeklyScheduleGrid (desktop) delete affordance", () => {
  test("renders a real focusable IconButton with translated aria-label and DeleteOutlined icon", () => {
    const { container } = renderGrid();

    const button = findDeleteButton(container);
    expect(button.tagName).toBe("BUTTON");
    expect(button.disabled).toBe(false);
    expect(button.querySelector('[data-testid="DeleteOutlinedIcon"]')).not.toBeNull();
    expect(container.querySelector(".material-symbols-outlined")).toBeNull();
  });

  test("keyboard activation (Enter on the focused delete button) opens the delete confirmation dialog", async () => {
    const { container } = renderGrid();
    const button = findDeleteButton(container);

    button.focus();
    expect(button).toHaveFocus();

    const user = userEvent.setup();
    await user.keyboard("{Enter}");

    const dialog = await waitFor(() => within(document.body).getByRole("dialog"));
    expect(dialog).toHaveTextContent(weeklyScheduleLabels.dialogs.deleteClassTitle);
    expect(dialog).toHaveTextContent(weeklyScheduleLabels.dialogs.deleteClassMessage);
  });

  test("confirm fires onRemoveClass only after explicit confirmation", async () => {
    const onRemoveClass = mock((_: string) => {});
    const { container } = renderGrid({ onRemoveClass });

    expect(onRemoveClass).not.toHaveBeenCalled();

    fireEvent.click(findDeleteButton(container));
    const dialog = await within(document.body).findByRole("dialog");
    expect(onRemoveClass).not.toHaveBeenCalled();

    const confirm = within(dialog).getByRole("button", { name: weeklyScheduleLabels.dialogs.confirmYes });
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(onRemoveClass).toHaveBeenCalledWith("class-delete-1");
    });
  });

  test("cancel closes the dialog without removing the class", async () => {
    const onRemoveClass = mock((_: string) => {});
    const { container } = renderGrid({ onRemoveClass });

    fireEvent.click(findDeleteButton(container));
    const dialog = await within(document.body).findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: weeklyScheduleLabels.dialogs.cancel }));

    // Closed = fully unmounted or exiting (MUI Modal flips the portal root to
    // aria-hidden at exit start). Full unmount races happy-dom transition
    // timers, so both terminal states count as closed.
    await waitFor(
      () => {
        const dialogEl = document.body.querySelector('[role="dialog"]');
        const modal = dialogEl?.closest(".MuiModal-root");
        expect(!dialogEl || modal?.getAttribute("aria-hidden") === "true").toBe(true);
      },
      { timeout: 15000 }
    );
    expect(onRemoveClass).not.toHaveBeenCalled();
  });

  test("hides the delete affordance without the schedule-delete permission or for frozen/terminal classes", () => {
    const { container } = renderGrid({ hasScheduleDeleteClass: false });
    expect(container.querySelector(`button[aria-label="${weeklyScheduleLabels.actions.deleteClass}"]`)).toBeNull();

    cleanup();

    const frozen = renderGrid({
      classes: [makeDeletableScheduledClass({ id: "class-frozen", isFrozen: true })],
    });
    expect(
      frozen.container.querySelector(`button[aria-label="${weeklyScheduleLabels.actions.deleteClass}"]`)
    ).toBeNull();
  });
});
