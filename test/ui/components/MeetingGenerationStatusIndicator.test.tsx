import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import {
  MeetingGenerationStatusIndicator,
  type MeetingGenerationStatusIndicatorProps,
} from "@/frontend/common/components/ui/display/meetingConfig/MeetingGenerationStatusIndicator";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.MeetingGeneration, locale);

afterEach(() => {
  cleanup();
});

function renderIndicator(props: MeetingGenerationStatusIndicatorProps) {
  return render(<MeetingGenerationStatusIndicator {...props} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("MeetingGenerationStatusIndicator", () => {
  test("renders pending status with label", () => {
    renderIndicator({ status: "pending" });
    expect(screen.getByText(t.generationStatusPending)).toBeInTheDocument();
  });

  test("renders success status with label and URL", () => {
    renderIndicator({ status: "success", url: "https://meet.example.com/abc" });
    expect(screen.getByText(t.generationStatusSuccess)).toBeInTheDocument();
    expect(screen.getByText("https://meet.example.com/abc")).toBeInTheDocument();
  });

  test("renders success status without URL when not provided", () => {
    renderIndicator({ status: "success" });
    expect(screen.getByText(t.generationStatusSuccess)).toBeInTheDocument();
  });

  test("renders failed status with retry button", () => {
    const onRetry = mock(() => {});
    renderIndicator({ status: "failed", onRetry });
    expect(screen.getByText(t.generationStatusFailed)).toBeInTheDocument();
    const retryButton = screen.getByText(t.generationRetry);
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("renders failed status without retry button when onRetry not provided", () => {
    renderIndicator({ status: "failed" });
    expect(screen.getByText(t.generationStatusFailed)).toBeInTheDocument();
    expect(screen.queryByText(t.generationRetry)).not.toBeInTheDocument();
  });

  test("renders failed status with expandable error details", () => {
    renderIndicator({ status: "failed", error: "Something went wrong" });
    expect(screen.getByText(t.generationStatusFailed)).toBeInTheDocument();
    // The expand toggle uses the showDetailsLabel, not the failed label
    expect(screen.getByText(t.generationShowDetails)).toBeInTheDocument();
    // Only one occurrence of the failed label — the status label
    const outputs = screen.getAllByText(t.generationStatusFailed);
    expect(outputs).toHaveLength(1);
  });

  test("calls onCopyUrl when copy button clicked in success state", () => {
    const onCopyUrl = mock((_url: string) => {});
    renderIndicator({ status: "success", url: "https://meet.example.com/abc", onCopyUrl });
    // There are two elements with the success aria-label — copy and open buttons
    const copyButtons = screen.getAllByLabelText(t.generationStatusSuccess);
    fireEvent.click(copyButtons[0]);
    expect(onCopyUrl).toHaveBeenCalledWith("https://meet.example.com/abc");
  });

  test("renders expiresAt in success state when provided", () => {
    renderIndicator({
      status: "success",
      url: "https://meet.example.com/abc",
      expiresAt: "2025-12-31T10:00:00Z",
    });
    expect(screen.getByText(t.generationStatusSuccess)).toBeInTheDocument();
  });

  test("returns null for unknown status", () => {
    const { container } = renderIndicator({ status: "unknown" });
    expect(container.firstChild).toBeNull();
  });

  test("renders failed without expand toggle when error is null", () => {
    renderIndicator({ status: "failed", error: null });
    const outputs = screen.getAllByText(t.generationStatusFailed);
    // Only one occurrence (the label), no expand toggle
    expect(outputs).toHaveLength(1);
  });
});
