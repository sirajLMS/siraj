import { describe, expect, it, mock } from "bun:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";

type ProbeProps = {
  readonly placeholder?: string;
  readonly slotProps?: {
    readonly htmlInput?: {
      readonly "aria-label"?: string;
    };
  };
  readonly onKeyDown?: (event: {
    key: string;
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => void;
};

function expectElement(node: ReactNode): ReactElement<ProbeProps> {
  if (!isValidElement<ProbeProps>(node)) {
    throw new Error("expected the component to return a React element");
  }
  return node;
}

describe("SearchBarField", () => {
  it("renders TextField with correct placeholder and aria-label", () => {
    const onChange = mock(() => {});
    const element = expectElement(SearchBarField({ value: "", placeholder: "Search items...", onChange }));

    expect(element.type).toBeDefined();
    expect(element.props.placeholder).toBe("Search items...");
    expect(element.props.slotProps?.htmlInput?.["aria-label"]).toBe("Search items...");
  });

  it("clears search query and stops propagation on Escape key press when non-empty", () => {
    const onChange = mock(() => {});
    const element = expectElement(SearchBarField({ value: "test query", placeholder: "Search items...", onChange }));

    let preventDefaultCalled = false;
    let stopPropagationCalled = false;

    element.props.onKeyDown?.({
      key: "Escape",
      preventDefault: () => {
        preventDefaultCalled = true;
      },
      stopPropagation: () => {
        stopPropagationCalled = true;
      },
    });

    expect(preventDefaultCalled).toBe(true);
    expect(stopPropagationCalled).toBe(true);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("does not clear search query on Escape key press when search text is empty", () => {
    const onChange = mock(() => {});
    const element = expectElement(SearchBarField({ value: "", placeholder: "Search items...", onChange }));

    let preventDefaultCalled = false;
    let stopPropagationCalled = false;

    element.props.onKeyDown?.({
      key: "Escape",
      preventDefault: () => {
        preventDefaultCalled = true;
      },
      stopPropagation: () => {
        stopPropagationCalled = true;
      },
    });

    expect(preventDefaultCalled).toBe(false);
    expect(stopPropagationCalled).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });
});
