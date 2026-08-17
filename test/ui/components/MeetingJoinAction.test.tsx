import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

expect.extend(matchers);

await mockNextNavigation("/dashboard", { locale: "ar" });

import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const urlStatusT = readTranslation(Translation.Dashboard.MeetingUrlStatus, locale);
const meetingConfigT = readTranslation(Translation.Ui.MeetingConfig, locale);
const joinLabel = meetingConfigT.join.joinMeeting;
const copyLabel = meetingConfigT.enhancements.copyMeetingUrl;
const setupLink = meetingConfigT.join.setupLink;
const emptyTeacherMessage = meetingConfigT.join.emptyTeacher;

afterEach(() => {
  cleanup();
});

function renderJoin(props: Record<string, unknown>) {
  return render(<MeetingJoinAction {...props} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("MeetingJoinAction", () => {
  test("renders button variant with generated URL and join label", () => {
    renderJoin({ joinUrl: "https://meet.example.com/abc", variant: "button", showCopyButton: true });
    expect(screen.getByText(joinLabel)).toBeInTheDocument();
  });

  test("renders button variant pending status badge", () => {
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "pending",
      variant: "button",
    });
    expect(screen.getByText(urlStatusT.urlPending)).toBeInTheDocument();
  });

  test.each(["button", "action"] as const)("renders retry button in %s variant when failed", variant => {
    const onRetry = mock(() => {});
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "failed",
      variant,
      onRetry,
    });
    if (variant === "button") {
      expect(screen.getByText(urlStatusT.urlFailed)).toBeInTheDocument();
    }
    fireEvent.click(screen.getByText(urlStatusT.retryUrlGeneration));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("renders button variant expired status badge", () => {
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "expired",
      variant: "button",
    });
    expect(screen.getByText(urlStatusT.urlExpired)).toBeInTheDocument();
  });

  test("renders icon variant with generated URL", () => {
    renderJoin({ joinUrl: "https://meet.example.com/abc", variant: "icon", showCopyButton: true });
    expect(screen.getByLabelText(copyLabel)).toBeInTheDocument();
  });

  test("renders icon variant pending status badge", () => {
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "pending",
      variant: "icon",
    });
    expect(screen.getByText(urlStatusT.urlPending)).toBeInTheDocument();
  });

  test("renders action variant with generated URL", () => {
    renderJoin({ joinUrl: "https://meet.example.com/abc", variant: "action", showCopyButton: true });
    expect(screen.getByText(joinLabel)).toBeInTheDocument();
  });

  test("renders action variant pending status badge", () => {
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      meetingUrlStatus: "pending",
      variant: "action",
    });
    expect(screen.getByText(urlStatusT.urlPending)).toBeInTheDocument();
  });

  test("renders setup alert when no URL, emptyRole and setupHref provided (non-icon variant)", () => {
    renderJoin({
      joinUrl: null,
      emptyRole: "teacher",
      setupHref: "/settings",
      variant: "button",
    });
    expect(screen.getByText(emptyTeacherMessage)).toBeInTheDocument();
    expect(screen.getByText(setupLink)).toBeInTheDocument();
  });

  test("renders null state without URL in icon variant without setupHref", () => {
    renderJoin({
      joinUrl: null,
      variant: "icon",
      meetingUrlStatus: "pending",
    });
    expect(screen.getByText(urlStatusT.urlPending)).toBeInTheDocument();
  });

  test("calls onJoinAction when join button clicked", () => {
    const onJoinAction = mock(() => {});
    renderJoin({
      joinUrl: "https://meet.example.com/abc",
      variant: "button",
      onJoinAction,
    });
    const button = screen.getByRole("button", { name: joinLabel });
    fireEvent.click(button);
    expect(onJoinAction).toHaveBeenCalledTimes(1);
  });

  test("disabled state when no URL and no setup", () => {
    renderJoin({ joinUrl: null, variant: "button" });
    expect(screen.getByText(urlStatusT.urlPending)).toBeInTheDocument();
  });
});
