import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.Settings, locale).appearance;

import {
  AppearanceResetDialog,
  type AppearanceResetDialogProps,
} from "@/frontend/common/views/dashboard/appearance/shared/AppearanceResetDialog";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function renderDialog(overrides: Partial<AppearanceResetDialogProps> = {}): void {
  renderWithWrapper(
    <AppearanceResetDialog
      open
      loading={false}
      labels={labels}
      onClose={mock(() => {})}
      onConfirm={mock(() => {})}
      {...overrides}
    />,
    { locale }
  );
}

function getLoadingConfirmButton(): HTMLElement {
  const button = screen.getAllByRole("button").find(candidate => candidate.getAttribute("aria-busy") === "true");
  if (!button) {
    throw new Error("Confirm button with aria-busy attribute not found");
  }
  return button;
}

afterEach(() => {
  cleanup();
});

describe("AppearanceResetDialog", () => {
  test("renders the reset confirmation title and body from labels", () => {
    renderDialog();

    expect(screen.getByText(labels.resetConfirmTitle)).toBeInTheDocument();
    expect(screen.getByText(labels.resetConfirmBody)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.resetConfirmCancel })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.resetConfirmConfirm })).toBeInTheDocument();
  });

  test("calls onClose when the cancel button is clicked", () => {
    const onClose = mock(() => {});
    const onConfirm = mock(() => {});
    renderDialog({ onClose, onConfirm });

    fireEvent.click(screen.getByRole("button", { name: labels.resetConfirmCancel }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("calls onConfirm when the confirm button is clicked", () => {
    const onClose = mock(() => {});
    const onConfirm = mock(() => {});
    renderDialog({ onClose, onConfirm });

    fireEvent.click(screen.getByRole("button", { name: labels.resetConfirmConfirm }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("disables both buttons and shows a spinner on the confirm button while loading", () => {
    const onConfirm = mock(() => {});
    renderDialog({ loading: true, onConfirm });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
    const confirmButton = getLoadingConfirmButton();
    expect(confirmButton).toBeDisabled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    fireEvent.click(confirmButton);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("keeps the confirm button enabled when not loading", () => {
    renderDialog({ loading: false });

    expect(screen.getByRole("button", { name: labels.resetConfirmConfirm })).toBeEnabled();
  });
});
