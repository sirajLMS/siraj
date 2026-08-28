import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { EndpointList } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/EndpointList";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.SettingsMeetingIntegrations, locale);
const copyLabels = readTranslation(Translation.Ui.MeetingConfig, locale).enhancements;

const endpoints = ["https://api.zoom.us/v2", "https://zoom.us/oauth/token"] as const;

function renderList(urls: readonly string[] = endpoints) {
  return render(<EndpointList endpoints={urls} labels={labels} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("EndpointList", () => {
  test("renders the endpoints label and every endpoint URL", () => {
    renderList();
    expect(screen.getByText(labels.endpoints)).toBeInTheDocument();
    for (const url of endpoints) {
      expect(screen.getByText(url)).toBeInTheDocument();
    }
  });

  test("renders one copy button per endpoint with the localized aria-label", () => {
    renderList();
    const copyButtons = screen.getAllByRole("button", { name: copyLabels.copyMeetingUrl });
    expect(copyButtons).toHaveLength(endpoints.length);
    for (const button of copyButtons) {
      expect(button).toHaveAttribute("aria-pressed", "false");
    }
  });

  test("shows copied feedback after a successful clipboard write", async () => {
    renderList();
    const [copyButton] = screen.getAllByRole("button", { name: copyLabels.copyMeetingUrl });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(copyButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  test("shows error feedback in tooltip when the clipboard write fails", async () => {
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      writable: true,
      configurable: true,
    });

    renderList();
    const [copyButton] = screen.getAllByRole("button", { name: copyLabels.copyMeetingUrl });
    fireEvent.click(copyButton);
    fireEvent.mouseOver(copyButton);

    await waitFor(() => {
      expect(screen.getByText(copyLabels.urlCopyFailed)).toBeInTheDocument();
    });
    expect(copyButton).toHaveAttribute("aria-pressed", "false");

    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });
});
