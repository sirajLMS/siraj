import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormDialogShellShared } from "@/frontend/common/components/ui/dialog/FormDialogShellShared";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(cleanup);

const TITLE = "Record lesson report";
const BODY = "Dialog body content";
const CANCEL = "Discard changes";
const SUBMIT = "Submit report";
const SUBMITTING = "Submitting report...";

interface ShellHarnessProps {
  readonly onClose: () => void;
  readonly onSubmit: (event: { preventDefault: () => void }) => void;
  readonly isSubmitting: boolean;
  readonly submittingLabel?: string;
}

function ShellHarness({ onClose, onSubmit, isSubmitting, submittingLabel }: ShellHarnessProps) {
  return (
    <FormDialogShellShared
      open
      title={TITLE}
      onClose={onClose}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      cancelLabel={CANCEL}
      submitLabel={SUBMIT}
      submittingLabel={submittingLabel}
    >
      {BODY}
    </FormDialogShellShared>
  );
}

describe("FormDialogShellShared", () => {
  test("renders title and body content", () => {
    renderWithWrapper(<ShellHarness onClose={() => {}} onSubmit={() => {}} isSubmitting={false} />);

    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(screen.getByText(BODY)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CANCEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: SUBMIT })).toBeInTheDocument();
  });

  test("cancel button invokes onClose without submitting", async () => {
    const onClose = mock(() => {});
    const onSubmit = mock(() => {});
    const user = userEvent.setup();

    renderWithWrapper(<ShellHarness onClose={onClose} onSubmit={onSubmit} isSubmitting={false} />);

    await user.click(screen.getByRole("button", { name: CANCEL }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("submit button submits the native form wrapping the chrome", async () => {
    const handleFormSubmit = mock((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    const onClose = mock(() => {});
    const user = userEvent.setup();

    renderWithWrapper(<ShellHarness onClose={onClose} onSubmit={handleFormSubmit} isSubmitting={false} />);

    const submitBtn = screen.getByRole("button", { name: SUBMIT });
    expect(submitBtn).toHaveAttribute("type", "submit");
    expect(submitBtn).toHaveAttribute("aria-busy", "false");

    await user.click(submitBtn);
    expect(handleFormSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("freezes actions and swaps the submit label while submitting", () => {
    const onSubmit = mock(() => {});
    const onClose = mock(() => {});

    renderWithWrapper(
      <ShellHarness onClose={onClose} onSubmit={onSubmit} isSubmitting={true} submittingLabel={SUBMITTING} />
    );

    expect(screen.getByRole("button", { name: CANCEL })).toBeDisabled();
    const submitBtn = screen.getByRole("button", { name: SUBMITTING });
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveAttribute("aria-busy", "true");
    expect(submitBtn.querySelector(".MuiCircularProgress-root")).not.toBeNull();
    expect(screen.queryByRole("button", { name: SUBMIT })).not.toBeInTheDocument();
  });

  test("shows a spinner-only submit button while submitting when submittingLabel is omitted", () => {
    const onSubmit = mock(() => {});

    renderWithWrapper(<ShellHarness onClose={() => {}} onSubmit={onSubmit} isSubmitting={true} />);

    const submitBtn = screen.getByRole("button", { name: "" });
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveAttribute("aria-busy", "true");
    expect(submitBtn.querySelector(".MuiCircularProgress-root")).not.toBeNull();
  });

  test("renders edge-to-edge when fullScreen is set", () => {
    renderWithWrapper(
      <FormDialogShellShared
        open
        title={TITLE}
        onClose={() => {}}
        onSubmit={() => {}}
        isSubmitting={false}
        cancelLabel={CANCEL}
        submitLabel={SUBMIT}
        fullScreen
      >
        {BODY}
      </FormDialogShellShared>
    );

    expect(screen.getByRole("dialog").className).toContain("MuiDialog-paperFullScreen");
  });
});
