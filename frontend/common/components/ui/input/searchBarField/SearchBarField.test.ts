import { describe, expect, it, mock } from "bun:test";
import { isValidElement, type ReactElement } from "react";
import type { TextFieldProps } from "@mui/material";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";

function expectTextField(node: unknown): ReactElement<TextFieldProps> {
  if (!isValidElement<TextFieldProps>(node)) {
    throw new Error("expected the component to return a React element");
  }
  return node;
}

describe("SearchBarField", () => {
  it("renders TextField with aria-label from placeholder", () => {
    const element = expectTextField(SearchBarField({ value: "", placeholder: "Search students...", onChange: () => {} }));

    expect(element.props.placeholder).toBe("Search students...");
    const htmlInput = element.props.slotProps?.htmlInput as { "aria-label"?: string } | undefined;
    expect(htmlInput?.["aria-label"]).toBe("Search students...");
  });

  it("clears input and stops propagation when Escape key is pressed while value is non-empty", () => {
    const onChange = mock(() => {});
    const stopPropagation = mock(() => {});
    const preventDefault = mock(() => {});

    const element = expectTextField(SearchBarField({ value: "John", placeholder: "Search...", onChange }));

    const onKeyDown = element.props.onKeyDown;
    expect(onKeyDown).toBeDefined();

    onKeyDown?.({
      key: "Escape",
      stopPropagation,
      preventDefault,
    } as unknown as React.KeyboardEvent<HTMLDivElement>);

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("does not clear or stop propagation when Escape key is pressed while value is empty", () => {
    const onChange = mock(() => {});
    const stopPropagation = mock(() => {});
    const preventDefault = mock(() => {});

    const element = expectTextField(SearchBarField({ value: "", placeholder: "Search...", onChange }));

    const onKeyDown = element.props.onKeyDown;
    expect(onKeyDown).toBeDefined();

    onKeyDown?.({
      key: "Escape",
      stopPropagation,
      preventDefault,
    } as unknown as React.KeyboardEvent<HTMLDivElement>);

    expect(stopPropagation).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not clear on other key presses like Enter", () => {
    const onChange = mock(() => {});
    const stopPropagation = mock(() => {});
    const preventDefault = mock(() => {});

    const element = expectTextField(SearchBarField({ value: "John", placeholder: "Search...", onChange }));

    element.props.onKeyDown?.({
      key: "Enter",
      stopPropagation,
      preventDefault,
    } as unknown as React.KeyboardEvent<HTMLDivElement>);

    expect(stopPropagation).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
