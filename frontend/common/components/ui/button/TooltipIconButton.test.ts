import { describe, expect, it } from "bun:test";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { TooltipIconButton } from "@/frontend/common/components/ui/button/TooltipIconButton";

/** Props the component's wrapper elements carry; the guard below narrows to this shape. */
type ProbeProps = {
  readonly title?: string;
  readonly children?: ReactNode;
  readonly component?: string;
  readonly "aria-label"?: string;
  readonly "aria-disabled"?: boolean;
  readonly disabled?: boolean;
};

function expectElement(node: ReactNode): ReactElement<ProbeProps> {
  if (!isValidElement<ProbeProps>(node)) {
    throw new Error("expected the component to return a React element");
  }
  return node;
}

const icon = createElement("span", { "data-testid": "test-icon" });

describe("TooltipIconButton", () => {
  it("renders enabled IconButton directly inside Tooltip with label as title and aria-label", () => {
    const element = expectElement(TooltipIconButton({ label: "Edit item", icon }));

    expect(element.props.title).toBe("Edit item");

    const button = expectElement(element.props.children);
    expect(button.props["aria-label"]).toBe("Edit item");
    expect(button.props.disabled).toBe(false);
  });

  it("wraps disabled IconButton in an aria-disabled span with disabledReason in title and aria-label", () => {
    const element = expectElement(
      TooltipIconButton({
        label: "Delete item",
        disabled: true,
        disabledReason: "Cannot delete primary item",
        icon,
      })
    );

    expect(element.props.title).toBe("Cannot delete primary item");

    const spanBox = expectElement(element.props.children);
    expect(spanBox.props.component).toBe("span");
    expect(spanBox.props["aria-disabled"]).toBe(true);

    const button = expectElement(spanBox.props.children);
    expect(button.props["aria-label"]).toBe("Delete item (Cannot delete primary item)");
    expect(button.props.disabled).toBe(true);
  });

  it("handles disabled state without disabledReason gracefully", () => {
    const element = expectElement(TooltipIconButton({ label: "Save item", disabled: true, icon }));

    expect(element.props.title).toBe("Save item");

    const spanBox = expectElement(element.props.children);
    expect(spanBox.props["aria-disabled"]).toBe(true);

    const button = expectElement(spanBox.props.children);
    expect(button.props["aria-label"]).toBe("Save item");
    expect(button.props.disabled).toBe(true);
  });
});
