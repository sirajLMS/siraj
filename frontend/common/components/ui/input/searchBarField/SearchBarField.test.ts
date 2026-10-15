import { describe, expect, it, mock } from "bun:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";

type ProbeProps = Record<string, unknown> & {
  readonly value?: string;
  readonly placeholder?: string;
  readonly onChange?: (e: { target: { value: string } }) => void;
  readonly onKeyDown?: (e: { key: string; preventDefault: () => void; stopPropagation: () => void }) => void;
  readonly slotProps?: {
    readonly input?: {
      readonly startAdornment?: ReactNode;
      readonly endAdornment?: ReactNode;
    };
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
  it("renders TextField with placeholder aria-label and start adornment when empty", () => {
    const handleChange = mock(() => {});
    const node = SearchBarField({
      value: "",
      placeholder: "Search users...",
      onChange: handleChange,
    });

    const element = expectElement(node);
    expect(element.props.value).toBe("");
    expect(element.props.placeholder).toBe("Search users...");
    expect(element.props.slotProps?.htmlInput?.["aria-label"]).toBe("Search users...");
    expect(element.props.slotProps?.input?.endAdornment).toBeNull();
  });

  it("renders clear endAdornment when value is non-empty", () => {
    const handleChange = mock(() => {});
    const node = SearchBarField({
      value: "hello",
      placeholder: "Search...",
      onChange: handleChange,
      clearLabel: "Clear search query",
    });

    const element = expectElement(node);
    expect(element.props.slotProps?.input?.endAdornment).not.toBeNull();
  });

  it("clears value and stops propagation when Escape key is pressed on non-empty value", () => {
    const handleChange = mock(() => {});
    const node = SearchBarField({
      value: "active query",
      placeholder: "Search...",
      onChange: handleChange,
    });

    const element = expectElement(node);
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

    expect(handleChange).toHaveBeenCalledWith("");
    expect(preventDefaultCalled).toBe(true);
    expect(stopPropagationCalled).toBe(true);
  });

  it("does not clear value or stop propagation on Escape key when value is empty", () => {
    const handleChange = mock(() => {});
    const node = SearchBarField({
      value: "",
      placeholder: "Search...",
      onChange: handleChange,
    });

    const element = expectElement(node);
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

    expect(handleChange).not.toHaveBeenCalled();
    expect(preventDefaultCalled).toBe(false);
    expect(stopPropagationCalled).toBe(false);
  });
});
