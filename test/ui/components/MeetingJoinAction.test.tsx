import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

expect.extend(matchers);

await mockNextNavigation("/dashboard", { locale: "ar" });

import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

function renderJoin(props: Record<string, unknown>) {
  return render(<MeetingJoinAction {...props} />, { wrapper: TestWrapper });
}

describe("MeetingJoinAction", () => {
  test("renders button variant with generated URL and join label", () => {
    renderJoin({ joinUrl: "https://meet.example.com/abc", variant: "button", showCopyButton: true });
    // Button variant renders the join button (label comes from translations)
    expect(screen.getByText(/انضمام|join|الانضمام/i)).toBeInTheDocument();
  });

  test("renders button variant pending status badge", () => {
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "pending",
      variant: "button",
    });
    expect(screen.getByText("الرابط قيد التوليد")).toBeInTheDocument();
  });

  test("renders button variant failed status with retry", () => {
    const onRetry = mock(() => {});
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "failed",
      variant: "button",
      onRetry,
    });
    expect(screen.getByText("فشل توليد الرابط")).toBeInTheDocument();
    fireEvent.click(screen.getByText("إعادة توليد الرابط"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("renders button variant expired status badge", () => {
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "expired",
      variant: "button",
    });
    expect(screen.getByText("الرابط منتهي الصلاحية")).toBeInTheDocument();
  });

  test("renders icon variant with generated URL", () => {
    renderJoin({ joinUrl: "https://meet.example.com/abc", variant: "icon", showCopyButton: true });
    // Icon variant shows a copy button
    expect(screen.getByLabelText("نسخ رابط الاجتماع")).toBeInTheDocument();
  });

  test("renders icon variant pending status badge", () => {
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "pending",
      variant: "icon",
    });
    expect(screen.getByText("الرابط قيد التوليد")).toBeInTheDocument();
  });

  test("renders action variant with generated URL", () => {
    renderJoin({ joinUrl: "https://meet.example.com/abc", variant: "action", showCopyButton: true });
    expect(screen.getByText(/انضمام|join|الانضمام/i)).toBeInTheDocument();
  });

  test("renders action variant pending status badge", () => {
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "pending",
      variant: "action",
    });
    expect(screen.getByText("الرابط قيد التوليد")).toBeInTheDocument();
  });

  test("renders setup alert when no URL, emptyRole and setupHref provided (non-icon variant)", () => {
    renderJoin({
      joinUrl: null,
      emptyRole: "teacher",
      setupHref: "/settings",
      variants: "button" as unknown as undefined,
      variant: "button",
    });
    // Should render an Alert with a setup link
    expect(screen.getByText("إعداد إعدادات الاجتماع")).toBeInTheDocument();
  });

  test("renders null state without URL in icon variant without setupHref", () => {
    renderJoin({
      joinUrl: null,
      variant: "icon",
      meetingUrlStatus: "pending",
    });
    expect(screen.getByText("الرابط قيد التوليد")).toBeInTheDocument();
  });

  test("calls onJoinAction when join button clicked", () => {
    const onJoinAction = mock(() => {});
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      variant: "button",
      onJoinAction,
    });
    const button = screen.getByRole("button", { name: /انضمام|join|الانضمام/i });
    fireEvent.click(button);
    expect(onJoinAction).toHaveBeenCalledTimes(1);
  });

  test("disabled state when no URL and no setup", () => {
    renderJoin({ joinUrl: null, variant: "button" });
    // Renders pending badge since no URL
    expect(screen.getByText("الرابط قيد التوليد")).toBeInTheDocument();
  });

  test("renders retry button in action variant when failed", () => {
    const onRetry = mock(() => {});
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "failed",
      variant: "action",
      onRetry,
    });
    fireEvent.click(screen.getByText("إعادة توليد الرابط"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
