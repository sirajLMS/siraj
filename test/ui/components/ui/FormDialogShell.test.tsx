import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormDialogShell } from "@/frontend/common/components/ui/dialog/FormDialogShell";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(cleanup);

const TITLE = "Submit lesson report";
const BODY = "Dialog body content";
const CANCEL = "Discard changes";
const SUBMIT = "Submit report";
const SUBMITTING = "Submitting report...";

function renderShell(props: {
  readonly onClose?: () => void;
  readonly onSubmit?: (event: { preventDefault: () => void }) => void;
  readonly submitting?: boolean;
  readonly submittingLabel?: string;
  readonly fullScreen?: boolean;
} = {}) {
  return renderWithWrapper(
    <FormDialogShell
      open
      title={TITLE}
      onClose={props.onClose ?? (() => {})}
      onSubmit={props.onSubmit ?? (() => {})}
      submitting={props.submitting ?? false}
      cancelLabel={CANCEL}
      submitLabel={SUBMIT}
      submittingLabel={props.submittingLabel}
      fullScreen={props.fullScreen}
    >
      {BODY}
    </FormDialogShell>
  );
}

describe("FormDialogShell (component)", () => {
  test("renders the title, children, and Cancel/Submit actions", () => {
    renderShell();

    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(screen.getByText(BODY)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CANCEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: SUBMIT })).toBeInTheDocument();
  });

  test("cancel invokes onClose without submitting the form", async () => {
    const onClose = mock(() => {});
    const onSubmit = mock(() => {});
    const user = userEvent.setup();

    renderShell({ onClose, onSubmit });

    await user.click(screen.getByRole("button", { name: CANCEL }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("submit button submits the native form and leaves the dialog open", async () => {
    const onSubmit = mock((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    const onClose = mock(() => {});
    const user = userEvent.setup();

    renderShell({ onClose, onSubmit });

    const submitButton = screen.getByRole("button", { name: SUBMIT });
    expect(submitButton).toHaveAttribute("type", "submit");

    await user.click(submitButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("freezes the chrome and disables both actions while submitting", () => {
    const onClose = mock(() => {});
    const onSubmit = mock(() => {});

    renderShell({ onClose, onSubmit, submitting: true, submittingLabel: SUBMITTING });

    expect(screen.getByRole("button", { name: CANCEL })).toBeDisabled();
    const submitButton = screen.getByRole("button", { name: SUBMITTING });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute("aria-busy", "true");
    expect(submitButton.querySelector(".MuiCircularProgress-root")).not.toBeNull();
  });

  test("close requests are suppressed while submitting", async () => {
    const onClose = mock(() => {});

    renderShell({ onClose, submitting: true });

    // React ignores clicks on disabled buttons, and the shell guards the
    // Dialog-level close path (Escape/backdrop) while a submission is in flight.
    fireEvent.click(screen.getByRole("button", { name: CANCEL }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  test("Escape requests the dialog close when not submitting", async () => {
    const onClose = mock(() => {});

    renderShell({ onClose });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("keeps the submit caption with a spinner when submittingLabel is omitted", () => {
    renderShell({ submitting: true });

    const submitButton = screen.getByRole("button", { name: SUBMIT });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute("aria-busy", "true");
    expect(submitButton.querySelector(".MuiCircularProgress-root")).not.toBeNull();
  });

  test("renders edge-to-edge when fullScreen is set by the mobile tier wrapper", () => {
    renderShell({ fullScreen: true });

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("MuiDialog-paperFullScreen");
  });

  test("applies the shared form dialog preset sizing by default", () => {
    renderShell();

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("MuiDialog-paperWidthSm");
    expect(dialog.className).not.toContain("MuiDialog-paperFullScreen");
  });
});
