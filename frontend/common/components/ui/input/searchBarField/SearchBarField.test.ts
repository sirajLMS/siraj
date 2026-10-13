import { describe, expect, it, mock } from "bun:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";

type ProbeProps = {
  readonly value?: string;
  readonly placeholder?: string;
  readonly helperText?: ReactNode;
  readonly onKeyDown?: (event: unknown) => void;
  readonly slotProps?: {
    readonly htmlInput?: {
      readonly "aria-label"?: string;
      readonly autoComplete?: string;
      readonly maxLength?: number;
    };
  };
};

function expectElement(node: ReactNode): ReactElement<ProbeProps> {
  if (!isValidElement<ProbeProps>(node)) {
    throw new Error("expected the component to return a React element");
  }
  return node;
}

describe("SearchBarField", () => {
  it("clears search value and stops propagation when Escape is pressed on non-empty field", () => {
    const onChange = mock();
    const element = expectElement(
      SearchBarField({
        value: "active search query",
        placeholder: "Search...",
        onChange,
      })
    );

    const stopPropagation = mock();
    element.props.onKeyDown?.({
      key: "Escape",
      stopPropagation,
    });

    expect(onChange).toHaveBeenCalledWith("");
    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });

  it("does not clear search value or stop propagation when Escape is pressed on empty field", () => {
    const onChange = mock();
    const element = expectElement(
      SearchBarField({
        value: "",
        placeholder: "Search...",
        onChange,
      })
    );

    const stopPropagation = mock();
    element.props.onKeyDown?.({
      key: "Escape",
      stopPropagation,
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
  });

  it("invokes consumer onKeyDown callback when provided", () => {
    const onChange = mock();
    const onKeyDown = mock();
    const element = expectElement(
      SearchBarField({
        value: "test",
        placeholder: "Search...",
        onChange,
        onKeyDown,
      })
    );

    const event = {
      key: "Enter",
      stopPropagation: mock(),
    };
    element.props.onKeyDown?.(event);

    expect(onKeyDown).toHaveBeenCalledWith(event);
  });

  it("sets htmlInput aria-label to placeholder", () => {
    const element = expectElement(
      SearchBarField({
        value: "",
        placeholder: "Search students...",
        onChange: () => {},
      })
    );

    expect(element.props.slotProps?.htmlInput?.["aria-label"]).toBe("Search students...");
  });
});
