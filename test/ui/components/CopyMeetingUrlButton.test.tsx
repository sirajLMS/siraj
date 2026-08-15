import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { CopyMeetingUrlButton } from "@/frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

function renderButton(props?: Record<string, unknown>) {
  return render(<CopyMeetingUrlButton meetingUrl="https://meet.example.com/abc123" {...props} />, {
    wrapper: TestWrapper,
  });
}

afterEach(() => {
  cleanup();
});

describe("CopyMeetingUrlButton", () => {
  test("renders icon variant by default with aria-label", () => {
    renderButton();
    expect(screen.getByLabelText("نسخ رابط الاجتماع")).toBeInTheDocument();
  });

  test("renders button variant with visible label text", () => {
    renderButton({ variant: "button" });
    expect(screen.getByRole("button", { name: "نسخ رابط الاجتماع" })).toBeInTheDocument();
  });

  test("renders text variant with visible label text", () => {
    renderButton({ variant: "text" });
    expect(screen.getByRole("button", { name: "نسخ رابط الاجتماع" })).toBeInTheDocument();
  });

  test("calls onCopySuccess when clipboard succeeds", async () => {
    const onSuccess = mock(() => {});
    renderButton({ onCopySuccess: onSuccess, copiedDurationMs: 50 });

    const button = screen.getByLabelText("نسخ رابط الاجتماع");
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

    const button = screen.getByLabelText("نسخ رابط الاجتماع");
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
    expect(screen.getByLabelText("نسخ رابط الاجتماع")).toBeDisabled();
  });

  test("has aria-pressed false initially", () => {
    renderButton();
    expect(screen.getByLabelText("نسخ رابط الاجتماع")).toHaveAttribute("aria-pressed", "false");
  });

  test("accepts custom aria-label override", () => {
    renderButton({ ariaLabel: "Custom Copy Label" });
    expect(screen.getByLabelText("Custom Copy Label")).toBeInTheDocument();
  });

  test("accepts custom tooltip label override", () => {
    renderButton({ tooltipLabel: "Custom Tooltip Text" });
    expect(screen.getByLabelText("نسخ رابط الاجتماع")).toBeInTheDocument();
  });

  test("renders large size", () => {
    renderButton({ size: "large" });
    expect(screen.getByLabelText("نسخ رابط الاجتماع")).toBeInTheDocument();
  });
});
