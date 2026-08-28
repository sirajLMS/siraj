import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { CopyMeetingUrlButton } from "@/frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Ui.MeetingConfig, locale);
const copyLabel = t.enhancements.copyMeetingUrl;

function renderButton(props?: Record<string, unknown>) {
  return render(<CopyMeetingUrlButton meetingUrl="https://meet.example.com/abc123" {...props} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

afterEach(() => {
  cleanup();
});

describe("CopyMeetingUrlButton", () => {
  test("renders icon variant by default with aria-label", () => {
    renderButton();
    expect(screen.getByLabelText(copyLabel)).toBeInTheDocument();
  });

  test("renders button variant with visible label text", () => {
    renderButton({ variant: "button" });
    expect(screen.getByRole("button", { name: copyLabel })).toBeInTheDocument();
  });

  test("renders text variant with visible label text", () => {
    renderButton({ variant: "text" });
    expect(screen.getByRole("button", { name: copyLabel })).toBeInTheDocument();
  });

  test("calls onCopySuccess when clipboard succeeds", async () => {
    const onSuccess = mock(() => {});
    renderButton({ onCopySuccess: onSuccess, copiedDurationMs: 50 });

    const button = screen.getByLabelText(copyLabel);
    fireEvent.click(button);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test("calls onCopyError when clipboard fails", async () => {
    const onError = mock(() => {});
    const originalWriteText = navigator.clipboard?.writeText;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      writable: true,
      configurable: true,
    });

    renderButton({ onCopyError: onError, copiedDurationMs: 50 });

    const button = screen.getByLabelText(copyLabel);
    fireEvent.click(button);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });

    if (originalWriteText) {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: originalWriteText },
        writable: true,
        configurable: true,
      });
    }
  });

  test("disabled button does not attempt copy", () => {
    renderButton({ disabled: true });
    expect(screen.getByRole("button", { name: copyLabel })).toBeDisabled();
  });

  test("has aria-pressed false initially", () => {
    renderButton();
    expect(screen.getByLabelText(copyLabel)).toHaveAttribute("aria-pressed", "false");
  });

  test("accepts custom aria-label override", () => {
    renderButton({ ariaLabel: "Custom Copy Label" });
    expect(screen.getByLabelText("Custom Copy Label")).toBeInTheDocument();
  });

  test("accepts custom tooltip label override", () => {
    renderButton({ tooltipLabel: "Custom Tooltip Text" });
    expect(screen.getByLabelText(copyLabel)).toBeInTheDocument();
  });

  test("renders large size", () => {
    renderButton({ size: "large" });
    expect(screen.getByLabelText(copyLabel)).toBeInTheDocument();
  });
});
