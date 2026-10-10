import { describe, expect, it } from "bun:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";

type ProbeProps = {
  readonly value?: string;
  readonly placeholder?: string;
  readonly helperText?: ReactNode;
  readonly onKeyDown?: (event: { key: string; stopPropagation: () => void }) => void;
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
    throw new Error("expected component to return a React element");
  }
  return node;
}

describe("SearchBarField", () => {
  it("renders TextField with aria-label derived from placeholder and autoComplete off", () => {
    const element = expectElement(
      SearchBarField({
        value: "",
        placeholder: "Search users...",
        onChange: () => undefined,
      })
    );

    expect(element.props.placeholder).toBe("Search users...");
    expect(element.props.slotProps?.htmlInput?.["aria-label"]).toBe("Search users...");
    expect(element.props.slotProps?.htmlInput?.autoComplete).toBe("off");
  });

  it("clears non-empty value and stops propagation when Escape key is pressed", () => {
    let clearedValue = "initial";
    let stoppedPropagation = false;

    const element = expectElement(
      SearchBarField({
        value: "active search query",
        placeholder: "Search...",
        onChange: val => {
          clearedValue = val;
        },
      })
    );

    const fakeEscapeEvent = {
      key: "Escape",
      stopPropagation: () => {
        stoppedPropagation = true;
      },
    };

    element.props.onKeyDown?.(fakeEscapeEvent);

    expect(clearedValue).toBe("");
    expect(stoppedPropagation).toBe(true);
  });

  it("does not clear value or stop propagation on Escape key when value is already empty", () => {
    let onChangeCalled = false;
    let stoppedPropagation = false;

    const element = expectElement(
      SearchBarField({
        value: "",
        placeholder: "Search...",
        onChange: () => {
          onChangeCalled = true;
        },
      })
    );

    const fakeEscapeEvent = {
      key: "Escape",
      stopPropagation: () => {
        stoppedPropagation = true;
      },
    };

    element.props.onKeyDown?.(fakeEscapeEvent);

    expect(onChangeCalled).toBe(false);
    expect(stoppedPropagation).toBe(false);
  });

  it("executes custom onKeyDown callback prop if provided", () => {
    let customKeyDownCalled = false;

    const element = expectElement(
      SearchBarField({
        value: "test",
        placeholder: "Search...",
        onChange: () => undefined,
        onKeyDown: () => {
          customKeyDownCalled = true;
        },
      })
    );

    const fakeEnterEvent = {
      key: "Enter",
      stopPropagation: () => undefined,
    };

    element.props.onKeyDown?.(fakeEnterEvent);

    expect(customKeyDownCalled).toBe(true);
  });
});
