import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import {
  MeetingConnectionTestMode,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { TestConnectionResultPanel } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel";
import type { TestMeetingConnectionResult } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const labels: SettingsMeetingIntegrationsLabels = readTranslation(
  Translation.Dashboard.SettingsMeetingIntegrations,
  locale
);
const copyLabels = readTranslation(Translation.Ui.MeetingConfig, locale).enhancements;

const successResult: TestMeetingConnectionResult = {
  ok: true,
  latencyMs: 150,
  mode: MeetingConnectionTestMode.ValidateConfig,
  testJoinUrl: "https://meet.example.com/test",
  deleted: false,
  upstreamResponseSummary: "200 OK",
  errorCode: null,
  errorMessage: null,
  rawUpstreamPayload: null,
  requiredScopes: null,
  grantedScopes: null,
};

function renderPanel(props: {
  result?: TestMeetingConnectionResult | null;
  testing?: boolean;
  onRunTest?: (providerSlug: MeetingIntegrationProviderSlug, mode: MeetingConnectionTestMode) => Promise<void>;
  providerSlug?: MeetingIntegrationProviderSlug;
}) {
  return render(
    <TestConnectionResultPanel
      labels={labels}
      providerSlug={props.providerSlug ?? MeetingIntegrationProviderSlug.Zoom}
      onRunTest={props.onRunTest ?? mock(() => Promise.resolve())}
      result={props.result ?? null}
      testing={props.testing ?? false}
    />,
    { wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper> }
  );
}

describe("TestConnectionResultPanel", () => {
  test("renders idle state with test buttons", () => {
    renderPanel({ result: null, testing: false });
    expect(screen.getByText(labels.testPanel.idleHint)).toBeInTheDocument();
    expect(screen.getByText(labels.validateConfig)).toBeInTheDocument();
    expect(screen.getByText(labels.generateAndDelete)).toBeInTheDocument();
  });

  test("renders testing state with progress indicator", () => {
    renderPanel({ result: null, testing: true });
    expect(screen.getByText(labels.testConnectionTesting)).toBeInTheDocument();
    // Test buttons should be disabled
    const validateButton = screen.getByText(labels.validateConfig);
    expect(validateButton.closest("button")).toBeDisabled();
  });

  test("renders success state with result details", () => {
    renderPanel({ result: successResult, testing: false });
    expect(screen.getByText(labels.testPanel.successMessage)).toBeInTheDocument();
    expect(screen.getByText(/150ms/)).toBeInTheDocument();
    expect(screen.getByText(/200 OK/)).toBeInTheDocument();
    // authSuccess is rendered as "{authStatus}: {authSuccess}" in a combined paragraph
    const authParagraph = screen.getByText(new RegExp(labels.testPanel.authSuccess));
    expect(authParagraph).toBeInTheDocument();
  });

  test("renders copy-url primitive for the test join URL", () => {
    renderPanel({ result: successResult, testing: false });
    const copyButton = screen.getByRole("button", { name: copyLabels.copyMeetingUrl });
    expect(copyButton).toHaveAttribute("aria-pressed", "false");
  });

  test("shows copied feedback after a successful clipboard write", async () => {
    renderPanel({ result: successResult, testing: false });
    const copyButton = screen.getByRole("button", { name: copyLabels.copyMeetingUrl });
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

    renderPanel({ result: successResult, testing: false });
    const copyButton = screen.getByRole("button", { name: copyLabels.copyMeetingUrl });
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

  test("renders failure state with retry button", () => {
    const onRunTest = mock(() => Promise.resolve());
    renderPanel({
      result: {
        ok: false,
        latencyMs: 500,
        mode: MeetingConnectionTestMode.ValidateConfig,
        testJoinUrl: null,
        deleted: null,
        upstreamResponseSummary: "401 Unauthorized",
        errorCode: "AUTH_FAILED",
        errorMessage: "Invalid credentials",
        rawUpstreamPayload: null,
        requiredScopes: null,
        grantedScopes: null,
      },
      testing: false,
      onRunTest,
    });
    expect(screen.getByText(labels.testConnectionFailure)).toBeInTheDocument();
    const retryButton = screen.getByText(labels.retryTest);
    fireEvent.click(retryButton);
    expect(onRunTest).toHaveBeenCalledTimes(1);
  });

  test("renders marketplace link for zoom provider", () => {
    renderPanel({
      result: {
        ok: true,
        latencyMs: 100,
        mode: MeetingConnectionTestMode.ValidateConfig,
        testJoinUrl: null,
        deleted: null,
        upstreamResponseSummary: "200 OK",
        errorCode: null,
        errorMessage: null,
        rawUpstreamPayload: null,
        requiredScopes: null,
        grantedScopes: null,
      },
      testing: false,
    });
    expect(screen.getByText(labels.testPanel.marketplaceHint)).toBeInTheDocument();
  });
});
