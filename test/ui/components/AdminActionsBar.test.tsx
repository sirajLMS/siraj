import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { AdminActionsBar } from "@/frontend/common/views/dashboard/classes/details/admin/AdminActionsBar";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.AdminView, locale).adminActions;

const createMockHandlers = () => ({
  onForceActivate: mock(() => {}),
  onStop: mock(() => {}),
  onGenerateLog: mock(() => {}),
  onReschedule: mock(() => {}),
  onDelete: mock(() => {}),
  onOverrideRate: mock(() => {}),
});

type ExecutionState = "NOT_ACTIVATED" | "ACTIVATED" | "RUNNING" | "COMPLETED";

function setupAdminActionsBar(executionState: ExecutionState, permissions: AppPermission[] = []) {
  const handlers = createMockHandlers();
  renderWithWrapper(<AdminActionsBar {...handlers} executionState={executionState} labels={labels} />, {
    permissions,
    locale,
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

    expect(await screen.findByRole("tooltip")).toHaveTextContent(labels.disabledTooltips.forceActivate.activated);
  });

  test("shows disabled tooltip for stop when ACTIVATED", async () => {
    setupAdminActionsBar("ACTIVATED");

    const user = userEvent.setup();
    await user.hover(screen.getByTestId("tooltip-target-stop-pause"));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(labels.disabledTooltips.stop.activated);
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

    const deleteButton = screen.getByRole("button", { name: labels.deleteInstance });
    expect(deleteButton).toBeVisible();
    expect(deleteButton).toHaveAttribute("title", labels.deleteInstance);
  });

  test("reschedule button visible with SessionReschedule permission", () => {
    setupAdminActionsBar("NOT_ACTIVATED", [AppPermission.SessionReschedule]);

    const rescheduleButton = screen.getByRole("button", { name: labels.reschedule });
    expect(rescheduleButton).toBeVisible();
  });

  test("reschedule button hidden without SessionReschedule permission", () => {
    setupAdminActionsBar("NOT_ACTIVATED");

    const rescheduleButton = screen.queryByRole("button", { name: labels.reschedule });
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
