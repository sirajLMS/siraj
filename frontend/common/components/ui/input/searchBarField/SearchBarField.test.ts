import { describe, expect, it } from "bun:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";

type ProbeProps = {
  readonly placeholder?: string;
  readonly helperText?: ReactNode;
  readonly onKeyDown?: (event: unknown) => void;
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
  readonly value?: string;
};

function expectElement(node: ReactNode): ReactElement<ProbeProps> {
  if (!isValidElement<ProbeProps>(node)) {
    throw new Error("expected the component to return a React element");
  }
  return node;
}

describe("SearchBarField", () => {
  it("renders TextField with placeholder and matching aria-label", () => {
    const element = expectElement(
      SearchBarField({
        value: "",
        placeholder: "Search users...",
        onChange: () => undefined,
      })
    );

    expect(element.props.placeholder).toBe("Search users...");
    expect(element.props.slotProps?.htmlInput?.["aria-label"]).toBe("Search users...");
  });

  it("does not render clear button adornment when value is empty", () => {
    const element = expectElement(
      SearchBarField({
        value: "",
        placeholder: "Search users...",
        onChange: () => undefined,
      })
    );

    expect(element.props.slotProps?.input?.endAdornment).toBeNull();
  });

  it("renders clear button adornment when value is non-empty", () => {
    const element = expectElement(
      SearchBarField({
        value: "John",
        placeholder: "Search users...",
        clearLabel: "Clear user search",
        onChange: () => undefined,
      })
    );

    expect(element.props.slotProps?.input?.endAdornment).not.toBeNull();
  });

  it("clears value and stops propagation when Escape key is pressed on non-empty input", () => {
    let clearedValue = "initial";
    const element = expectElement(
      SearchBarField({
        value: "John",
        placeholder: "Search users...",
        onChange: newVal => {
          clearedValue = newVal;
        },
      })
    );

    let prevented = false;
    let stopped = false;
    const fakeEvent = {
      key: "Escape",
      preventDefault: () => {
        prevented = true;
      },
      stopPropagation: () => {
        stopped = true;
      },
    };

    const onKeyDown = element.props.onKeyDown;
    expect(onKeyDown).toBeDefined();
    onKeyDown?.(fakeEvent);

    expect(clearedValue).toBe("");
    expect(prevented).toBe(true);
    expect(stopped).toBe(true);
  });

  it("does not intercept Escape key when value is empty", () => {
    let onChangeCalled = false;
    const element = expectElement(
      SearchBarField({
        value: "",
        placeholder: "Search users...",
        onChange: () => {
          onChangeCalled = true;
        },
      })
    );

    let prevented = false;
    let stopped = false;
    const fakeEvent = {
      key: "Escape",
      preventDefault: () => {
        prevented = true;
      },
      stopPropagation: () => {
        stopped = true;
      },
    };

    const onKeyDown = element.props.onKeyDown;
    onKeyDown?.(fakeEvent);

    expect(onChangeCalled).toBe(false);
    expect(prevented).toBe(false);
    expect(stopped).toBe(false);
  });

  it("does not handle non-Escape keys", () => {
    let onChangeCalled = false;
    const element = expectElement(
      SearchBarField({
        value: "John",
        placeholder: "Search users...",
        onChange: () => {
          onChangeCalled = true;
        },
      })
    );

    let prevented = false;
    let stopped = false;
    const fakeEvent = {
      key: "Enter",
      preventDefault: () => {
        prevented = true;
      },
      stopPropagation: () => {
        stopped = true;
      },
    };

    const onKeyDown = element.props.onKeyDown;
    onKeyDown?.(fakeEvent);

    expect(onChangeCalled).toBe(false);
    expect(prevented).toBe(false);
    expect(stopped).toBe(false);
  });
});
