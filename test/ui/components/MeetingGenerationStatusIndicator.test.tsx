import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import {
  MeetingGenerationStatusIndicator,
  type MeetingGenerationStatusIndicatorProps,
} from "@/frontend/common/components/ui/display/meetingConfig/MeetingGenerationStatusIndicator";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

function renderIndicator(props: MeetingGenerationStatusIndicatorProps) {
  return render(<MeetingGenerationStatusIndicator {...props} />, { wrapper: TestWrapper });
}

describe("MeetingGenerationStatusIndicator", () => {
  test("renders pending status with label", () => {
    renderIndicator({ status: "pending" });
    expect(screen.getByText("التوليد قيد الانتظار")).toBeInTheDocument();
  });

  test("renders success status with label and URL", () => {
    renderIndicator({ status: "success", url: "https://meet.example.com/abc" });
    expect(screen.getByText("تم توليد الرابط بنجاح")).toBeInTheDocument();
    expect(screen.getByText("https://meet.example.com/abc")).toBeInTheDocument();
  });

  test("renders success status without URL when not provided", () => {
    renderIndicator({ status: "success" });
    expect(screen.getByText("تم توليد الرابط بنجاح")).toBeInTheDocument();
  });

  test("renders failed status with retry button", () => {
    const onRetry = mock(() => {});
    renderIndicator({ status: "failed", onRetry });
    expect(screen.getByText("فشل التوليد")).toBeInTheDocument();
    const retryButton = screen.getByText("إعادة التوليد");
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("renders failed status without retry button when onRetry not provided", () => {
    renderIndicator({ status: "failed" });
    expect(screen.getByText("فشل التوليد")).toBeInTheDocument();
    expect(screen.queryByText("إعادة التوليد")).not.toBeInTheDocument();
  });

  test("renders failed status with expandable error details", () => {
    renderIndicator({ status: "failed", error: "Something went wrong" });
    expect(screen.getByText("فشل التوليد")).toBeInTheDocument();
    // There are two elements with "فشل التوليد" - the label and the expand toggle
    const outputs = screen.getAllByText("فشل التوليد");
    expect(outputs).toHaveLength(2);
  });

  test("calls onCopyUrl when copy button clicked in success state", () => {
    const onCopyUrl = mock((_url: string) => {});
    renderIndicator({ status: "success", url: "https://meet.example.com/abc", onCopyUrl });
    // There are two elements with the success aria-label — copy and open buttons
    const copyButtons = screen.getAllByLabelText("تم توليد الرابط بنجاح");
    fireEvent.click(copyButtons[0]);
    expect(onCopyUrl).toHaveBeenCalledWith("https://meet.example.com/abc");
  });

  test("renders expiresAt in success state when provided", () => {
    renderIndicator({
      status: "success",
      url: "https://meet.example.com/abc",
      expiresAt: "2025-12-31T10:00:00Z",
    });
    expect(screen.getByText("تم توليد الرابط بنجاح")).toBeInTheDocument();
  });

  test("returns null for unknown status", () => {
    const { container } = renderIndicator({ status: "unknown" });
    expect(container.firstChild).toBeNull();
  });

  test("renders failed without expand toggle when error is null", () => {
    renderIndicator({ status: "failed", error: null });
    const outputs = screen.getAllByText("فشل التوليد");
    // Only one occurrence (the label), no expand toggle
    expect(outputs).toHaveLength(1);
  });
});
