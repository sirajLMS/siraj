import { expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentType, createElement } from "react";
import type { SessionActivateButtonProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const mockLabels = {
  activateLabel: "Activate Session",
  connectingLabel: "Connecting...",
  tooltip: "Activate Session",
};

export interface SessionActivateButtonTestCase {
  readonly name: string;
  readonly run: () => void | Promise<void>;
}

/**
 * Returns the shared test cases for `SessionActivateButton` desktop and mobile variants.
 * Both tier components share `SessionActivateButtonProps`, so the assertions are identical —
 * only the component reference differs.
 * Call `test(tc.name, tc.run)` for each entry inside a `describe` in the consumer test file.
 */
export function makeSessionActivateButtonTests(
  Component: ComponentType<SessionActivateButtonProps>
): readonly SessionActivateButtonTestCase[] {
  function renderButton(options: { disabled?: boolean; isConnecting?: boolean; onActivate?: () => void }) {
    const onActivate = options.onActivate ?? mock(() => {});
    renderWithWrapper(
      createElement(Component, {
        disabled: options.disabled ?? false,
        isConnecting: options.isConnecting ?? false,
        onActivate,
        ...mockLabels,
      }),
      { permissions: [] }
    );
    return { onActivate };
  }

  return [
    {
      name: "renders activate button in ready state",
      run: () => {
        renderButton({ disabled: false, isConnecting: false });
        const button = screen.getByRole("button", { name: /activate session/i });
        expect(button).toBeVisible();
        expect(button).not.toBeDisabled();
      },
    },
    {
      name: "renders connecting state with spinner",
      run: () => {
        renderButton({ disabled: false, isConnecting: true });
        const button = screen.getByRole("button", { name: /connecting/i });
        expect(button).toBeVisible();
        expect(button).toBeDisabled();
      },
    },
    {
      name: "button is disabled when disabled prop is true",
      run: () => {
        renderButton({ disabled: true, isConnecting: false });
        const button = screen.getByRole("button", { name: /activate session/i });
        expect(button).toBeDisabled();
      },
    },
    {
      name: "clicking button calls onActivate",
      run: async () => {
        const onActivate = mock(() => {});
        renderButton({ disabled: false, isConnecting: false, onActivate });
        const user = userEvent.setup();
        const button = screen.getByRole("button", { name: /activate session/i });
        await user.click(button);
        expect(onActivate).toHaveBeenCalledTimes(1);
      },
    },
    {
      name: "disabled button does not trigger onActivate",
      run: () => {
        const onActivate = mock(() => {});
        renderButton({ disabled: true, isConnecting: false, onActivate });
        const button = screen.getByRole("button", { name: /activate session/i });
        expect(button).toBeDisabled();
        expect(onActivate).not.toHaveBeenCalled();
      },
    },
  ];
}
