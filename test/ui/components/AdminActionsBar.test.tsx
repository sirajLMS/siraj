import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

expect.extend(matchers);

import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { AdminActionsBar } from "@/frontend/views/dashboard/classes/details/admin/AdminActionsBar";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

const mockLabels = {
  administrativeActions: "Administrative Actions",
  generateLog: "Generate Log",
  reschedule: "Reschedule",
  forceActivate: "Force Activate",
  stopPause: "Stop/Pause",
  deleteInstance: "Delete Instance",
  disabledTooltips: {
    forceActivate: {
      activated: "You cannot force activate because this class is already activated.",
      running: "You cannot force activate because the session is running.",
      completed: "You cannot force activate because this class is completed.",
    },
    stop: {
      notActivated: "You cannot stop because this class has not been activated yet.",
      activated: "You cannot stop because the session has not started. Start the session first.",
      completed: "You cannot stop because this class is completed.",
    },
  },
};

const createMockHandlers = () => ({
  onForceActivate: mock(() => {}),
  onStop: mock(() => {}),
  onGenerateLog: mock(() => {}),
  onReschedule: mock(() => {}),
  onDelete: mock(() => {}),
});

type ExecutionState = "NOT_ACTIVATED" | "ACTIVATED" | "RUNNING" | "COMPLETED";

function setupAdminActionsBar(executionState: ExecutionState, permissions: AppPermission[] = []) {
  const handlers = createMockHandlers();
  renderWithWrapper(<AdminActionsBar {...handlers} executionState={executionState} labels={mockLabels} />, {
    permissions,
  });
  return handlers;
}

describe("AdminActionsBar", () => {
  test("renders force activate button enabled when NOT_ACTIVATED", () => {
    setupAdminActionsBar("NOT_ACTIVATED");

    const forceActivateButton = screen.getByRole("button", { name: /force-activate/i });
    expect(forceActivateButton).toBeVisible();
    expect(forceActivateButton).not.toBeDisabled();
  });

  test("disables force activate button when already ACTIVATED", () => {
    setupAdminActionsBar("ACTIVATED");

    const forceActivateButton = screen.getByRole("button", { name: /force-activate/i });
    expect(forceActivateButton).toBeDisabled();
  });

  test("shows disabled tooltip for force activate when ACTIVATED", async () => {
    setupAdminActionsBar("ACTIVATED");

    const user = userEvent.setup();
    await user.hover(screen.getByTestId("tooltip-target-force-activate"));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(mockLabels.disabledTooltips.forceActivate.activated);
  });

  test("shows disabled tooltip for stop when ACTIVATED", async () => {
    setupAdminActionsBar("ACTIVATED");

    const user = userEvent.setup();
    await user.hover(screen.getByTestId("tooltip-target-stop-pause"));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(mockLabels.disabledTooltips.stop.activated);
  });

  test("renders stop button disabled when not RUNNING", () => {
    setupAdminActionsBar("ACTIVATED");

    const stopButton = screen.getByRole("button", { name: /stop-pause/i });
    expect(stopButton).toBeVisible();
    expect(stopButton).toBeDisabled();
  });

  test("renders stop button enabled when RUNNING", () => {
    setupAdminActionsBar("RUNNING");

    const stopButton = screen.getByRole("button", { name: /stop-pause/i });
    expect(stopButton).not.toBeDisabled();
  });

  test("renders delete button", () => {
    setupAdminActionsBar("NOT_ACTIVATED");

    const deleteButton = screen.getByRole("button", { name: /delete-instance/i });
    expect(deleteButton).toBeVisible();
    expect(deleteButton).toHaveAttribute("title", "Delete Instance");
  });

  test("reschedule button visible with SessionReschedule permission", () => {
    setupAdminActionsBar("NOT_ACTIVATED", [AppPermission.SessionReschedule]);

    const rescheduleButton = screen.getByRole("button", { name: /reschedule/i });
    expect(rescheduleButton).toBeVisible();
  });

  test("reschedule button hidden without SessionReschedule permission", () => {
    setupAdminActionsBar("NOT_ACTIVATED");

    const rescheduleButton = screen.queryByRole("button", { name: /reschedule/i });
    expect(rescheduleButton).toBeNull();
  });

  test("clicking force activate calls handler when NOT_ACTIVATED", async () => {
    const handlers = setupAdminActionsBar("NOT_ACTIVATED");

    const user = userEvent.setup();
    const forceActivateButton = screen.getByRole("button", { name: /force-activate/i });
    await user.click(forceActivateButton);

    expect(handlers.onForceActivate).toHaveBeenCalledTimes(1);
  });
});
