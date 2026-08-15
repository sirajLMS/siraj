import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { MeetingUrlCell } from "@/frontend/common/components/ui/display/meetingConfig/MeetingUrlCell";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

function renderCell(props: Record<string, unknown>) {
  return render(<MeetingUrlCell {...props} />, { wrapper: TestWrapper });
}

describe("MeetingUrlCell", () => {
  test("renders generated URL with join and copy buttons (non-compact)", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc" });
    expect(screen.getByText("الرابط جاهز")).toBeInTheDocument();
    expect(screen.getByLabelText("الانضمام إلى الاجتماع")).toBeInTheDocument();
    expect(screen.getByLabelText("نسخ الرابط")).toBeInTheDocument();
  });

  test("renders generated URL compact layout", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", compact: true });
    expect(screen.getByText("الرابط جاهز")).toBeInTheDocument();
    expect(screen.getByLabelText("الانضمام إلى الاجتماع")).toBeInTheDocument();
  });

  test("renders null URL with not-generated message and setup link", () => {
    renderCell({ meetingUrl: null, setupHref: "/settings" });
    expect(screen.getByText("لم يتم توليد رابط اجتماع بعد.")).toBeInTheDocument();
    expect(screen.getByText("إعداد إعدادات الاجتماع")).toBeInTheDocument();
  });

  test("renders null URL without setup link when setupHref not provided", () => {
    renderCell({ meetingUrl: null });
    expect(screen.getByText("لم يتم توليد رابط اجتماع بعد.")).toBeInTheDocument();
    expect(screen.queryByText("إعداد إعدادات الاجتماع")).not.toBeInTheDocument();
  });

  test("renders pending status with badge", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", meetingUrlStatus: "pending" });
    expect(screen.getByText("الرابط قيد التوليد")).toBeInTheDocument();
    expect(screen.queryByLabelText("الانضمام إلى الاجتماع")).not.toBeInTheDocument();
  });

  test("renders failed status with retry button", () => {
    const onRetry = mock(() => {});
    renderCell({
      meetingUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "failed",
      meetingUrlError: "Network error",
      onRetry,
    });
    expect(screen.getByText("فشل توليد الرابط")).toBeInTheDocument();
    const retryButton = screen.getByText("إعادة توليد الرابط");
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("renders failed status without retry button when onRetry not provided", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", meetingUrlStatus: "failed" });
    expect(screen.getByText("فشل توليد الرابط")).toBeInTheDocument();
    expect(screen.queryByText("إعادة توليد الرابط")).not.toBeInTheDocument();
  });

  test("renders expired status with badge", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", meetingUrlStatus: "expired" });
    expect(screen.getByText("الرابط منتهي الصلاحية")).toBeInTheDocument();
    expect(screen.queryByLabelText("الانضمام إلى الاجتماع")).not.toBeInTheDocument();
  });

  test("hides copy button when canCopyUrl = false", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", canCopyUrl: false });
    expect(screen.queryByLabelText("نسخ الرابط")).not.toBeInTheDocument();
  });

  test("calls onJoin when join button clicked", () => {
    const onJoin = mock(() => {});
    renderCell({ meetingUrl: "https://meet.example.com/abc", onJoin });
    fireEvent.click(screen.getByLabelText("الانضمام إلى الاجتماع"));
    expect(onJoin).toHaveBeenCalledTimes(1);
  });

  test("renders with custom joinLabel", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", joinLabel: "Join Now" });
    expect(screen.getByLabelText("Join Now")).toBeInTheDocument();
  });

  test("renders error tooltip on badge when failed with error", () => {
    renderCell({
      meetingUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "failed",
      meetingUrlError: "Timeout error",
    });
    const badge = screen.getByLabelText("فشل توليد الرابط");
    expect(badge).toHaveAttribute("title", "Timeout error");
  });

  test("renders with badgeSize medium", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", badgeSize: "medium" });
    expect(screen.getByText("الرابط جاهز")).toBeInTheDocument();
  });
});
