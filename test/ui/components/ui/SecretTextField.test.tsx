import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { HIDDEN_SECRET_MASK, SecretTextField } from "@/frontend/common/components/ui/input";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(cleanup);

const LABEL = "Access token";
const SHOW = "Reveal secret value";
const HIDE = "Conceal secret value";

function EditableHarness({ initialValue }: { readonly initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [revealed, setRevealed] = useState(false);
  return (
    <SecretTextField
      label={LABEL}
      value={value}
      onChange={event => setValue(event.target.value)}
      revealed={revealed}
      onToggleReveal={() => setRevealed(prev => !prev)}
      showValueLabel={SHOW}
      hideValueLabel={HIDE}
    />
  );
}

function ReadOnlyHarness({ value }: { readonly value: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <SecretTextField
      label={LABEL}
      value={value}
      readOnly
      revealed={revealed}
      onToggleReveal={() => setRevealed(prev => !prev)}
      showValueLabel={SHOW}
      hideValueLabel={HIDE}
    />
  );
}

describe("SecretTextField", () => {
  test("masks the value by default in editable mode", () => {
    renderWithWrapper(<EditableHarness initialValue="s3cr3t-token" />);
    const input = screen.getByLabelText(LABEL);
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(screen.getByRole("button", { name: SHOW })).toBeInTheDocument();
  });

  test("reveal toggle shows and re-hides the value", async () => {
    const user = userEvent.setup();
    renderWithWrapper(<EditableHarness initialValue="s3cr3t-token" />);
    const input = screen.getByLabelText(LABEL);

    await user.click(screen.getByRole("button", { name: SHOW }));
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("s3cr3t-token");
    expect(screen.getByRole("button", { name: HIDE })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: HIDE }));
    expect(input).toHaveAttribute("type", "password");
  });

  test("remains editable while revealed", async () => {
    const user = userEvent.setup();
    renderWithWrapper(<EditableHarness initialValue="" />);
    await user.click(screen.getByRole("button", { name: SHOW }));
    const input = screen.getByLabelText(LABEL);
    await user.type(input, "new-token");
    expect(input).toHaveValue("new-token");
  });

  test("read-only mode never renders the raw value until revealed", async () => {
    const user = userEvent.setup();
    renderWithWrapper(<ReadOnlyHarness value="stored-secret" />);
    const input = screen.getByLabelText(LABEL);
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveValue(HIDDEN_SECRET_MASK);

    await user.click(screen.getByRole("button", { name: SHOW }));
    expect(input).toHaveValue("stored-secret");
    expect(input).toHaveAttribute("readonly");
  });
});
