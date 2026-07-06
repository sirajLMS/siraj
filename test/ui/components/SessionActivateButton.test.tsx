import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

expect.extend(matchers);

import { SessionActivateButton } from "@/frontend/views/dashboard/teachers/dashboard/components/SessionActivateButton";
import { renderWithWrapper } from "./TestWrapper";

afterEach(() => {
  cleanup();
});

const mockLabels = {
  activateLabel: "Activate Session",
  connectingLabel: "Connecting...",
  tooltip: "Activate Session",
};

function renderButton(options: { disabled?: boolean; isConnecting?: boolean; onActivate?: () => void }) {
  const onActivate = options.onActivate ?? mock(() => {});
  renderWithWrapper(
    <SessionActivateButton
      disabled={options.disabled ?? false}
      isConnecting={options.isConnecting ?? false}
      onActivate={onActivate}
      {...mockLabels}
    />,
    { permissions: [] }
  );
  return { onActivate };
}

describe("SessionActivateButton", () => {
  test("renders activate button in ready state", () => {
    renderButton({ disabled: false, isConnecting: false });

    const button = screen.getByRole("button", { name: /activate session/i });
    expect(button).toBeVisible();
    expect(button).not.toBeDisabled();
  });

  test("renders connecting state with spinner", () => {
    renderButton({ disabled: false, isConnecting: true });

    const button = screen.getByRole("button", { name: /connecting/i });
    expect(button).toBeVisible();
    expect(button).toBeDisabled();
  });

  test("button is disabled when disabled prop is true", () => {
    renderButton({ disabled: true, isConnecting: false });

    const button = screen.getByRole("button", { name: /activate session/i });
    expect(button).toBeDisabled();
  });

  test("clicking button calls onActivate", async () => {
    const onActivate = mock(() => {});
    renderButton({ disabled: false, isConnecting: false, onActivate });

    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: /activate session/i });
    await user.click(button);

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  test("disabled button does not trigger onActivate", () => {
    const onActivate = mock(() => {});
    renderButton({ disabled: true, isConnecting: false, onActivate });

    const button = screen.getByRole("button", { name: /activate session/i });
    expect(button).toBeDisabled();
    expect(onActivate).not.toHaveBeenCalled();
  });
});
