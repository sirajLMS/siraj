import { describe, expect, it } from "bun:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import {
  SearchBarField,
  type SearchBarFieldProps,
} from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";

type ProbeProps = {
  readonly value?: string;
  readonly placeholder?: string;
  readonly helperText?: ReactNode;
  readonly onChange?: (event: { target: { value: string } }) => void;
  readonly onKeyDown?: (event: { key: string; stopPropagation: () => void }) => void;
  readonly slotProps?: {
    readonly input?: {
      readonly endAdornment?: ReactNode;
    };
    readonly htmlInput?: {
      readonly "aria-label"?: string;
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
  it("renders TextField with correct value, placeholder, and htmlInput aria-label", () => {
    let _changedValue = "";
    const props: SearchBarFieldProps = {
      value: "Math",
      placeholder: "Search subjects...",
      onChange: val => {
        _changedValue = val;
      },
    };

    const element = expectElement(SearchBarField(props));
    expect(element.props.value).toBe("Math");
    expect(element.props.placeholder).toBe("Search subjects...");
    expect(element.props.slotProps?.htmlInput?.["aria-label"]).toBe("Search subjects...");
    expect(element.props.slotProps?.input?.endAdornment).not.toBeNull();
  });

  it("clears search input when Escape key is pressed on non-empty input", () => {
    let clearedValue: string | null = null;
    let stoppedPropagation = false;

    const props: SearchBarFieldProps = {
      value: "Physics",
      placeholder: "Search...",
      onChange: val => {
        clearedValue = val;
      },
    };

    const element = expectElement(SearchBarField(props));
    element.props.onKeyDown?.({
      key: "Escape",
      stopPropagation: () => {
        stoppedPropagation = true;
      },
    });

    expect(clearedValue).toBe("");
    expect(stoppedPropagation).toBe(true);
  });

  it("does not clear or stop propagation when Escape key is pressed on empty input", () => {
    let onChangeCalled = false;
    let stoppedPropagation = false;

    const props: SearchBarFieldProps = {
      value: "",
      placeholder: "Search...",
      onChange: () => {
        onChangeCalled = true;
      },
    };

    const element = expectElement(SearchBarField(props));
    element.props.onKeyDown?.({
      key: "Escape",
      stopPropagation: () => {
        stoppedPropagation = true;
      },
    });

    expect(onChangeCalled).toBe(false);
    expect(stoppedPropagation).toBe(false);
  });
});
