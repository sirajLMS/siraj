import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

expect.extend(matchers);

import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { AdminActionsBar } from "@/frontend/views/dashboard/classes/details/admin/AdminActionsBar";
import { renderWithWrapper } from "./TestWrapper";

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
};

const createMockHandlers = () => ({
  onForceActivate: mock(() => {}),
  onStop: mock(() => {}),
  onGenerateLog: mock(() => {}),
  onReschedule: mock(() => {}),
  onDelete: mock(() => {}),
});

describe("AdminActionsBar", () => {
  test("renders force activate button", () => {
    const handlers = createMockHandlers();
    renderWithWrapper(<AdminActionsBar {...handlers} labels={mockLabels} />, { permissions: [] });

    const forceActivateButton = screen.getByRole("button", { name: /force-activate/i });
    expect(forceActivateButton).toBeVisible();
    expect(forceActivateButton).toHaveAttribute("title", "Force Activate");
  });

  test("renders stop button", () => {
    const handlers = createMockHandlers();
    renderWithWrapper(<AdminActionsBar {...handlers} labels={mockLabels} />, { permissions: [] });

    const stopButton = screen.getByRole("button", { name: /stop-pause/i });
    expect(stopButton).toBeVisible();
    expect(stopButton).toHaveAttribute("title", "Stop/Pause");
  });

  test("renders delete button", () => {
    const handlers = createMockHandlers();
    renderWithWrapper(<AdminActionsBar {...handlers} labels={mockLabels} />, { permissions: [] });

    const deleteButton = screen.getByRole("button", { name: /delete-instance/i });
    expect(deleteButton).toBeVisible();
    expect(deleteButton).toHaveAttribute("title", "Delete Instance");
  });

  test("reschedule button visible with SessionReschedule permission", () => {
    const handlers = createMockHandlers();
    renderWithWrapper(<AdminActionsBar {...handlers} labels={mockLabels} />, {
      permissions: [AppPermission.SessionReschedule],
    });

    const rescheduleButton = screen.getByRole("button", { name: /reschedule/i });
    expect(rescheduleButton).toBeVisible();
  });

  test("reschedule button hidden without SessionReschedule permission", () => {
    const handlers = createMockHandlers();
    renderWithWrapper(<AdminActionsBar {...handlers} labels={mockLabels} />, { permissions: [] });

    const rescheduleButton = screen.queryByRole("button", { name: /reschedule/i });
    expect(rescheduleButton).toBeNull();
  });

  test("clicking force activate calls handler", async () => {
    const handlers = createMockHandlers();
    renderWithWrapper(<AdminActionsBar {...handlers} labels={mockLabels} />, { permissions: [] });

    const user = userEvent.setup();
    const forceActivateButton = screen.getByRole("button", { name: /force-activate/i });
    await user.click(forceActivateButton);

    expect(handlers.onForceActivate).toHaveBeenCalledTimes(1);
  });
});
