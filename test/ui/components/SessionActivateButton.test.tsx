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
};

describe("SessionActivateButton", () => {
  test("renders activate button in ready state", () => {
    const onActivate = mock(() => {});
    renderWithWrapper(
      <SessionActivateButton disabled={false} isConnecting={false} onActivate={onActivate} {...mockLabels} />,
      { permissions: [] }
    );

    const button = screen.getByRole("button", { name: /activate session/i });
    expect(button).toBeVisible();
    expect(button).not.toBeDisabled();
  });

  test("renders connecting state with spinner", () => {
    const onActivate = mock(() => {});
    renderWithWrapper(
      <SessionActivateButton disabled={false} isConnecting={true} onActivate={onActivate} {...mockLabels} />,
      { permissions: [] }
    );

    const button = screen.getByRole("button", { name: /connecting/i });
    expect(button).toBeVisible();
    expect(button).toBeDisabled();
  });

  test("button is disabled when disabled prop is true", () => {
    const onActivate = mock(() => {});
    renderWithWrapper(
      <SessionActivateButton disabled={true} isConnecting={false} onActivate={onActivate} {...mockLabels} />,
      { permissions: [] }
    );

    const button = screen.getByRole("button", { name: /activate session/i });
    expect(button).toBeDisabled();
  });

  test("clicking button calls onActivate", async () => {
    const onActivate = mock(() => {});
    renderWithWrapper(
      <SessionActivateButton disabled={false} isConnecting={false} onActivate={onActivate} {...mockLabels} />,
      { permissions: [] }
    );

    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: /activate session/i });
    await user.click(button);

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  test("disabled button does not trigger onActivate", () => {
    const onActivate = mock(() => {});
    renderWithWrapper(
      <SessionActivateButton disabled={true} isConnecting={false} onActivate={onActivate} {...mockLabels} />,
      { permissions: [] }
    );

    const button = screen.getByRole("button", { name: /activate session/i });
    expect(button).toBeDisabled();
    expect(onActivate).not.toHaveBeenCalled();
  });
});
