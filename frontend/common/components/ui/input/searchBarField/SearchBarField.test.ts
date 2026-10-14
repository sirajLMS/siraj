import { describe, expect, it } from "bun:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";

type ProbeProps = {
  readonly value?: string;
  readonly placeholder?: string;
  readonly slotProps?: {
    readonly input?: {
      readonly startAdornment?: ReactNode;
      readonly endAdornment?: ReactNode;
    };
    readonly htmlInput?: {
      readonly "aria-label"?: string;
      readonly autoComplete?: string;
      readonly onKeyDown?: (event: { key: string; preventDefault: () => void; stopPropagation: () => void }) => void;
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
  it("renders TextField with placeholder aria-label and start search adornment", () => {
    const element = expectElement(
      SearchBarField({
        value: "",
        placeholder: "Search students...",
        onChange: () => {},
      })
    );

    const htmlInput = element.props.slotProps?.htmlInput;
    expect(htmlInput?.["aria-label"]).toBe("Search students...");
    expect(htmlInput?.autoComplete).toBe("off");
    expect(element.props.slotProps?.input?.startAdornment).toBeTruthy();
    expect(element.props.slotProps?.input?.endAdornment).toBeNull();
  });

  it("clears search value and stops propagation when Escape key is pressed with non-empty value", () => {
    let clearedValue: string | null = null;
    let defaultPrevented = false;
    let propagationStopped = false;

    const element = expectElement(
      SearchBarField({
        value: "Alice",
        placeholder: "Search students...",
        onChange: val => {
          clearedValue = val;
        },
      })
    );

    const handleKeyDown = element.props.slotProps?.htmlInput?.onKeyDown;
    expect(handleKeyDown).toBeDefined();

    handleKeyDown?.({
      key: "Escape",
      preventDefault: () => {
        defaultPrevented = true;
      },
      stopPropagation: () => {
        propagationStopped = true;
      },
    });

    expect(clearedValue).toBe("");
    expect(defaultPrevented).toBe(true);
    expect(propagationStopped).toBe(true);
  });

  it("does not clear search or stop propagation when Escape key is pressed with empty value", () => {
    let onChangeCalled = false;
    let defaultPrevented = false;
    let propagationStopped = false;

    const element = expectElement(
      SearchBarField({
        value: "",
        placeholder: "Search students...",
        onChange: () => {
          onChangeCalled = true;
        },
      })
    );

    const handleKeyDown = element.props.slotProps?.htmlInput?.onKeyDown;
    expect(handleKeyDown).toBeDefined();

    handleKeyDown?.({
      key: "Escape",
      preventDefault: () => {
        defaultPrevented = true;
      },
      stopPropagation: () => {
        propagationStopped = true;
      },
    });

    expect(onChangeCalled).toBe(false);
    expect(defaultPrevented).toBe(false);
    expect(propagationStopped).toBe(false);
  });

  it("does not clear search when key other than Escape is pressed", () => {
    let onChangeCalled = false;
    let defaultPrevented = false;
    let propagationStopped = false;

    const element = expectElement(
      SearchBarField({
        value: "Alice",
        placeholder: "Search students...",
        onChange: () => {
          onChangeCalled = true;
        },
      })
    );

    const handleKeyDown = element.props.slotProps?.htmlInput?.onKeyDown;
    handleKeyDown?.({
      key: "Enter",
      preventDefault: () => {
        defaultPrevented = true;
      },
      stopPropagation: () => {
        propagationStopped = true;
      },
    });

    expect(onChangeCalled).toBe(false);
    expect(defaultPrevented).toBe(false);
    expect(propagationStopped).toBe(false);
  });

  it("renders end adornment clear button when value is non-empty", () => {
    const element = expectElement(
      SearchBarField({
        value: "Alice",
        placeholder: "Search students...",
        clearLabel: "Clear filter",
        onChange: () => {},
      })
    );

    expect(element.props.slotProps?.input?.endAdornment).toBeTruthy();
  });
});
