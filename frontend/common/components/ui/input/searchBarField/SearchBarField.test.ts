import { describe, expect, it, mock } from "bun:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { SearchBarField } from "./SearchBarField";

type ProbeProps = {
  readonly value?: string;
  readonly placeholder?: string;
  readonly onChange?: (value: string) => void;
  readonly onKeyDown?: (event: { key: string; preventDefault: () => void; stopPropagation: () => void }) => void;
  readonly slotProps?: {
    readonly htmlInput?: Record<string, unknown>;
  };
};

function expectElement(node: ReactNode): ReactElement<ProbeProps> {
  if (!isValidElement<ProbeProps>(node)) {
    throw new Error("expected the component to return a React element");
  }
  return node;
}

describe("SearchBarField", () => {
  it("renders TextField with placeholder and aria-label", () => {
    const element = expectElement(
      SearchBarField({
        value: "",
        placeholder: "Search students...",
        onChange: () => {},
      })
    );

    expect(element.props.placeholder).toBe("Search students...");
    expect(element.props.slotProps?.htmlInput?.["aria-label"]).toBe("Search students...");
  });

  it("clears search text on Escape key when value is non-empty", () => {
    const onChange = mock(() => {});
    const element = expectElement(
      SearchBarField({
        value: "Math",
        placeholder: "Search classes...",
        onChange,
      })
    );

    let defaultPrevented = false;
    let propagationStopped = false;

    element.props.onKeyDown?.({
      key: "Escape",
      preventDefault: () => {
        defaultPrevented = true;
      },
      stopPropagation: () => {
        propagationStopped = true;
      },
    });

    expect(onChange).toHaveBeenCalledWith("");
    expect(defaultPrevented).toBe(true);
    expect(propagationStopped).toBe(true);
  });

  it("does not clear on Escape key when value is empty", () => {
    const onChange = mock(() => {});
    const element = expectElement(
      SearchBarField({
        value: "",
        placeholder: "Search classes...",
        onChange,
      })
    );

    let defaultPrevented = false;
    let propagationStopped = false;

    element.props.onKeyDown?.({
      key: "Escape",
      preventDefault: () => {
        defaultPrevented = true;
      },
      stopPropagation: () => {
        propagationStopped = true;
      },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(defaultPrevented).toBe(false);
    expect(propagationStopped).toBe(false);
  });
});
