import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { BaseFormDialogSection } from "@/frontend/common/components/ui/dialog/BaseFormDialogSection";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(cleanup);

const TITLE = "Edit teacher details";
const BODY = "Dialog body content";
const CANCEL = "Discard changes";
const CONFIRM = "Save changes";
const CONFIRM_LOADING = "Saving changes...";
const FORM_ID = "edit-teacher-form";

interface SectionOverrides {
  readonly onClose?: () => void;
  readonly onConfirm?: () => void;
  readonly confirmLoadingLabel?: string;
  readonly formId?: string;
  readonly isLoading?: boolean;
  readonly children?: ReactNode;
}

function sectionElement(overrides: SectionOverrides = {}): ReactElement {
  return (
    <BaseFormDialogSection
      title={TITLE}
      cancelLabel={CANCEL}
      confirmLabel={CONFIRM}
      onClose={overrides.onClose ?? (() => {})}
      onConfirm={overrides.onConfirm}
      confirmLoadingLabel={overrides.confirmLoadingLabel}
      formId={overrides.formId}
      isLoading={overrides.isLoading ?? false}
    >
      {overrides.children}
    </BaseFormDialogSection>
  );
}

describe("BaseFormDialogSection", () => {
  test("renders title and body content", () => {
    renderWithWrapper(sectionElement({ children: BODY }));

    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(screen.getByText(BODY)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CANCEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CONFIRM })).toBeInTheDocument();
  });

  test("cancel button invokes onClose without confirming", async () => {
    const onClose = mock(() => {});
    const onConfirm = mock(() => {});
    const user = userEvent.setup();

    renderWithWrapper(sectionElement({ onClose, onConfirm }));

    await user.click(screen.getByRole("button", { name: CANCEL }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("confirm button invokes onConfirm when no formId is provided", async () => {
    const onConfirm = mock(() => {});
    const onClose = mock(() => {});
    const user = userEvent.setup();

    renderWithWrapper(sectionElement({ onClose, onConfirm }));

    const confirmBtn = screen.getByRole("button", { name: CONFIRM });
    expect(confirmBtn).toHaveAttribute("type", "submit");

    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("confirm button submits the native form matching formId", async () => {
    const handleFormSubmit = mock((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    const user = userEvent.setup();

    renderWithWrapper(
      <form id={FORM_ID} onSubmit={handleFormSubmit}>
        {sectionElement({ formId: FORM_ID })}
      </form>
    );

    const confirmBtn = screen.getByRole("button", { name: CONFIRM });
    expect(confirmBtn).toHaveAttribute("type", "submit");
    expect(confirmBtn).toHaveAttribute("form", FORM_ID);

    await user.click(confirmBtn);
    expect(handleFormSubmit).toHaveBeenCalledTimes(1);
  });

  test("actions stay enabled with aria-busy false when not loading", () => {
    renderWithWrapper(sectionElement());

    expect(screen.getByRole("button", { name: CANCEL })).toBeEnabled();
    expect(screen.getByRole("button", { name: CONFIRM })).toBeEnabled();
    expect(screen.getByRole("button", { name: CONFIRM })).toHaveAttribute("aria-busy", "false");
  });

  test("disables actions and swaps confirm label while submitting", () => {
    const onConfirm = mock(() => {});

    renderWithWrapper(sectionElement({ onConfirm, confirmLoadingLabel: CONFIRM_LOADING, isLoading: true }));

    const cancelBtn = screen.getByRole("button", { name: CANCEL });
    const confirmBtn = screen.getByRole("button", { name: CONFIRM_LOADING });
    expect(cancelBtn).toBeDisabled();
    expect(confirmBtn).toBeDisabled();
    expect(confirmBtn).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("button", { name: CONFIRM })).not.toBeInTheDocument();
  });

  test("shows a loading spinner on the confirm button when confirmLoadingLabel is omitted", () => {
    renderWithWrapper(sectionElement({ isLoading: true }));

    const confirmBtn = screen.getByRole("button", { name: "" });
    expect(confirmBtn).toBeDisabled();
    expect(confirmBtn).toHaveAttribute("aria-busy", "true");
    expect(confirmBtn.querySelector(".MuiCircularProgress-root")).not.toBeNull();
  });
});
