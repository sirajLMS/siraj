import { afterEach, describe, expect, mock, test } from "bun:test";
import DeleteIcon from "@mui/icons-material/Delete";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

expect.extend(matchers);

import { TooltipIconButton } from "@/frontend/common/components/ui/button/TooltipIconButton";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

describe("TooltipIconButton", () => {
  test("renders enabled icon button with tooltip on hover", async () => {
    const handleClick = mock(() => {});
    renderWithWrapper(
      <TooltipIconButton label="Delete item" onClick={handleClick} icon={<DeleteIcon />} />
    );

    const button = screen.getByRole("button", { name: "Delete item" });
    expect(button).toBeVisible();
    expect(button).not.toBeDisabled();

    const user = userEvent.setup();
    await user.hover(button);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Delete item");

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("renders disabled icon button with custom disabledReason tooltip", async () => {
    const handleClick = mock(() => {});
    renderWithWrapper(
      <TooltipIconButton
        label="Delete item"
        disabled
        disabledReason="Cannot delete active item"
        onClick={handleClick}
        icon={<DeleteIcon />}
      />
    );

    const button = screen.getByRole("button", { name: "Delete item" });
    expect(button).toBeDisabled();

    expect(button.parentElement).not.toBeNull();

    const user = userEvent.setup();
    if (button.parentElement) {
      await user.hover(button.parentElement);
    }
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Cannot delete active item");
  });
});
