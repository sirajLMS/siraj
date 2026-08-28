import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import {
  MeetingUrlCell,
  type MeetingUrlCellProps,
} from "@/frontend/common/components/ui/display/meetingConfig/MeetingUrlCell";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.MeetingUrlStatus, locale);

afterEach(() => {
  cleanup();
});

function renderCell(props: MeetingUrlCellProps) {
  return render(<MeetingUrlCell {...props} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("MeetingUrlCell", () => {
  test("renders generated URL with join and copy buttons (non-compact)", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc" });
    expect(screen.getByText(t.urlReady)).toBeInTheDocument();
    expect(screen.getByLabelText(t.joinMeeting)).toBeInTheDocument();
    expect(screen.getByLabelText(t.copyUrl)).toBeInTheDocument();
  });

  test("renders generated URL compact layout", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", compact: true });
    expect(screen.getByText(t.urlReady)).toBeInTheDocument();
    expect(screen.getByLabelText(t.joinMeeting)).toBeInTheDocument();
  });

  test("renders null URL with not-generated message and setup link", () => {
    renderCell({ meetingUrl: null, setupHref: "/settings" });
    expect(screen.getByText(t.urlNotGenerated)).toBeInTheDocument();
    expect(screen.getByText(t.setupMeetingConfig)).toBeInTheDocument();
  });

  test("renders null URL without setup link when setupHref not provided", () => {
    renderCell({ meetingUrl: null });
    expect(screen.getByText(t.urlNotGenerated)).toBeInTheDocument();
    expect(screen.queryByText(t.setupMeetingConfig)).not.toBeInTheDocument();
  });

  test("renders pending status with badge", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", meetingUrlStatus: "pending" });
    expect(screen.getByText(t.urlPending)).toBeInTheDocument();
    expect(screen.queryByLabelText(t.joinMeeting)).not.toBeInTheDocument();
  });

  test("renders failed status with retry button", () => {
    const onRetry = mock(() => {});
    renderCell({
      meetingUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "failed",
      meetingUrlError: "Network error",
      onRetry,
    });
    expect(screen.getByText(t.urlFailed)).toBeInTheDocument();
    const retryButton = screen.getByText(t.retryUrlGeneration);
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("renders failed status without retry button when onRetry not provided", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", meetingUrlStatus: "failed" });
    expect(screen.getByText(t.urlFailed)).toBeInTheDocument();
    expect(screen.queryByText(t.retryUrlGeneration)).not.toBeInTheDocument();
  });

  test("renders expired status with badge", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", meetingUrlStatus: "expired" });
    expect(screen.getByText(t.urlExpired)).toBeInTheDocument();
    expect(screen.queryByLabelText(t.joinMeeting)).not.toBeInTheDocument();
  });

  test("hides copy button when canCopyUrl = false", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", canCopyUrl: false });
    expect(screen.queryByLabelText(t.copyUrl)).not.toBeInTheDocument();
  });

  test("calls onJoin when join button clicked", () => {
    const onJoin = mock(() => {});
    renderCell({ meetingUrl: "https://meet.example.com/abc", onJoin });
    fireEvent.click(screen.getByLabelText(t.joinMeeting));
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
    const badge = screen.getByLabelText(t.urlFailed);
    expect(badge).toHaveAttribute("title", "Timeout error");
  });

  test("renders with badgeSize medium", () => {
    renderCell({ meetingUrl: "https://meet.example.com/abc", badgeSize: "medium" });
    expect(screen.getByText(t.urlReady)).toBeInTheDocument();
  });
});
