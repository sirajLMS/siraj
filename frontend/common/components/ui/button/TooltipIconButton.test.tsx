import { describe, expect, it } from "bun:test";
import { createElement, type ReactElement } from "react";
import { TooltipIconButton } from "@/frontend/common/components/ui/button/TooltipIconButton";

describe("TooltipIconButton", () => {
  it("renders enabled IconButton directly inside Tooltip with label as title and aria-label", () => {
    const icon = createElement("span", { "data-testid": "test-icon" });
    const element = TooltipIconButton({
      label: "Edit item",
      icon,
    }) as ReactElement;

    expect(element.props.title).toBe("Edit item");

    const button = element.props.children as ReactElement;
    expect(button.props["aria-label"]).toBe("Edit item");
    expect(button.props.disabled).toBe(false);
  });

  it("wraps disabled IconButton in an aria-disabled span with disabledReason in title and aria-label", () => {
    const icon = createElement("span", { "data-testid": "test-icon" });
    const element = TooltipIconButton({
      label: "Delete item",
      disabled: true,
      disabledReason: "Cannot delete primary item",
      icon,
    }) as ReactElement;

    expect(element.props.title).toBe("Cannot delete primary item");

    const spanBox = element.props.children as ReactElement;
    expect(spanBox.props.component).toBe("span");
    expect(spanBox.props["aria-disabled"]).toBe(true);

    const button = spanBox.props.children as ReactElement;
    expect(button.props["aria-label"]).toBe("Delete item (Cannot delete primary item)");
    expect(button.props.disabled).toBe(true);
  });

  it("handles disabled state without disabledReason gracefully", () => {
    const icon = createElement("span", { "data-testid": "test-icon" });
    const element = TooltipIconButton({
      label: "Save item",
      disabled: true,
      icon,
    }) as ReactElement;

    expect(element.props.title).toBe("Save item");

    const spanBox = element.props.children as ReactElement;
    expect(spanBox.props["aria-disabled"]).toBe(true);

    const button = spanBox.props.children as ReactElement;
    expect(button.props["aria-label"]).toBe("Save item");
    expect(button.props.disabled).toBe(true);
  });
});
