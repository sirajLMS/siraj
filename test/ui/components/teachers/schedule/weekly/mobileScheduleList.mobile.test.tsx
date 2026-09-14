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
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import type { ScheduledClass } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import MobileScheduleList from "@/frontend/mobile/views/dashboard/teachers/schedule/weekly/mobileScheduleList.mobile";
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

function renderList({
  classes = [makeDeletableScheduledClass()],
  onRemoveClass = mock((_: string) => {}),
  hasScheduleDeleteClass = true,
  selectedDay = "monday",
  onSelectDay = mock((_: string) => {}),
}: {
  readonly classes?: readonly ScheduledClass[];
  readonly onRemoveClass?: (id: string) => void;
  readonly hasScheduleDeleteClass?: boolean;
  readonly selectedDay?: string;
  readonly onSelectDay?: (day: string) => void;
} = {}) {
  return render(
    <MobileScheduleList
      classes={classes}
      onRemoveClass={onRemoveClass}
      hasScheduleDeleteClass={hasScheduleDeleteClass}
      labels={weeklyScheduleLabels}
      meetingJoinLabels={meetingJoinLabels}
      selectedDay={selectedDay}
      onSelectDay={onSelectDay}
    />,
    {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <TestWrapper locale={weeklyScheduleLocale}>{children}</TestWrapper>
      ),
    }
  );
}

describe("MobileScheduleList delete affordance", () => {
  test("renders a focusable IconButton with DeleteOutlined instead of the material-symbols span", () => {
    const { container } = renderList();

    const button = findDeleteButton(container);
    expect(button.tagName).toBe("BUTTON");
    expect(button.disabled).toBe(false);
    expect(button.querySelector('[data-testid="DeleteOutlinedIcon"]')).not.toBeNull();
  });

  test("focus + Enter opens the mobile delete confirmation dialog", async () => {
    const { container } = renderList();
    const button = findDeleteButton(container);

    button.focus();
    expect(button).toHaveFocus();

    const user = userEvent.setup();
    await user.keyboard("{Enter}");

    const dialog = await waitFor(() => within(document.body).getByRole("dialog"));
    expect(dialog).toHaveTextContent(weeklyScheduleLabels.dialogs.deleteClassTitle);
  });

  test("cancel closes the dialog without removing the class", async () => {
    const onRemoveClass = mock((_: string) => {});
    const { container } = renderList({ onRemoveClass });

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

  test("confirm fires onRemoveClass with the slot id only after confirmation", async () => {
    const onRemoveClass = mock((_: string) => {});
    const { container } = renderList({ onRemoveClass });

    fireEvent.click(findDeleteButton(container));
    const dialog = await within(document.body).findByRole("dialog");
    expect(onRemoveClass).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: weeklyScheduleLabels.dialogs.confirmYes }));

    await waitFor(() => {
      expect(onRemoveClass).toHaveBeenCalledWith("class-delete-1");
    });
  });

  test("permission gating removes the delete affordance entirely", () => {
    const { container } = renderList({ hasScheduleDeleteClass: false });
    expect(container.querySelector(`button[aria-label="${weeklyScheduleLabels.actions.deleteClass}"]`)).toBeNull();
  });
});

describe("MobileScheduleList store-driven delete dialog", () => {
  test("a dialog opened via the store before render is shown for the matching slot item", async () => {
    useWeeklyScheduleStore.getState().openDeleteConfirm("class-delete-1");

    renderList();

    const dialog = await within(document.body).findByRole("dialog");
    expect(dialog).toHaveTextContent(weeklyScheduleLabels.dialogs.deleteClassTitle);
    expect(dialog).toHaveTextContent(weeklyScheduleLabels.dialogs.deleteClassMessage);
  });

  test("confirming the dialog clears the store dialog id", async () => {
    const onRemoveClass = mock((_: string) => {});
    const { container } = renderList({ onRemoveClass });

    fireEvent.click(findDeleteButton(container));
    const dialog = await within(document.body).findByRole("dialog");
    expect(useWeeklyScheduleStore.getState().deleteConfirmClassInstanceId).toBe("class-delete-1");

    fireEvent.click(within(dialog).getByRole("button", { name: weeklyScheduleLabels.dialogs.confirmYes }));

    await waitFor(() => {
      expect(onRemoveClass).toHaveBeenCalledWith("class-delete-1");
    });
    expect(useWeeklyScheduleStore.getState().deleteConfirmClassInstanceId).toBeNull();
  });
});

describe("MobileScheduleList day selector (props-driven)", () => {
  test("filters slots from the selectedDay prop only and reports day clicks via onSelectDay", () => {
    const mondayClass = makeDeletableScheduledClass({
      id: "class-mon",
      day: "monday",
      subjectName: "Fixture Monday Subject",
    });
    const tuesdayClass = makeDeletableScheduledClass({
      id: "class-tue",
      day: "tuesday",
      subjectName: "Fixture Tuesday Subject",
    });
    const onSelectDay = mock((_: string) => {});

    const { rerender } = renderList({ classes: [mondayClass, tuesdayClass], onSelectDay });

    expect(screen.getByText("Fixture Monday Subject")).toBeInTheDocument();
    expect(screen.queryByText("Fixture Tuesday Subject")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: weeklyScheduleLabels.days.tue }));
    expect(onSelectDay).toHaveBeenCalledWith("tuesday");

    rerender(
      <MobileScheduleList
        classes={[mondayClass, tuesdayClass]}
        onRemoveClass={mock((_: string) => {})}
        hasScheduleDeleteClass={true}
        labels={weeklyScheduleLabels}
        meetingJoinLabels={meetingJoinLabels}
        selectedDay="tuesday"
        onSelectDay={onSelectDay}
      />
    );

    expect(screen.queryByText("Fixture Monday Subject")).toBeNull();
    expect(screen.getByText("Fixture Tuesday Subject")).toBeInTheDocument();
  });
});
