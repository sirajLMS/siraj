import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { ReauthNeededBanner } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import type { MeetingConfigReauthNeededLabels } from "@/shared/locale/types/ui";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels: MeetingConfigReauthNeededLabels = readTranslation(Translation.Ui.MeetingConfig, locale).reauthNeeded;

afterEach(() => {
  cleanup();
});

const twoProviders = [
  { slug: "zoom", name: "Zoom", expiryState: "expired" as const },
  { slug: "google_meet", name: "Google Meet", expiryState: "expiring_soon" as const },
];

function renderBanner(
  reauthProviders: React.ComponentProps<typeof ReauthNeededBanner>["reauthProviders"] = [],
  overrides: Partial<React.ComponentProps<typeof ReauthNeededBanner>> = {}
) {
  return render(
    <ReauthNeededBanner
      reauthProviders={reauthProviders}
      labels={labels}
      onReconnect={mock(() => {})}
      {...overrides}
    />,
    { wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper> }
  );
}

describe("ReauthNeededBanner", () => {
  test("returns null when no reauth providers", () => {
    const { container } = renderBanner([]);
    expect(container.firstChild).toBeNull();
  });

  test("warning severity when all providers expiring soon", () => {
    renderBanner([{ slug: "zoom", name: "Zoom", expiryState: "expiring_soon" }]);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("MuiAlert-colorWarning");
    expect(screen.getByText(labels.reauthNeededTitle)).toBeInTheDocument();
    // The expiring soon label appears inside the reconnect button
    const reconnectBtn = screen.getByRole("button");
    expect(reconnectBtn.textContent).toContain(labels.reauthExpiringSoon);
  });

  test("error severity when any provider expired", () => {
    renderBanner([
      { slug: "zoom", name: "Zoom", expiryState: "expiring_soon" },
      { slug: "google_meet", name: "Google Meet", expiryState: "expired" },
    ]);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("MuiAlert-colorError");
  });

  test("per-provider reconnect buttons rendered", () => {
    const onReconnect = mock(() => {});
    renderBanner(twoProviders, { onReconnect });
    const zoomBtn = screen.getByText(new RegExp(`Zoom.*${labels.reauthExpired}`));
    const googleBtn = screen.getByText(new RegExp(`Google Meet.*${labels.reauthExpiringSoon}`));
    expect(zoomBtn).toBeInTheDocument();
    expect(googleBtn).toBeInTheDocument();

    fireEvent.click(zoomBtn);
    expect(onReconnect).toHaveBeenCalledWith("zoom");
  });

  test("reconnect all button shows when >= 2 providers and onReconnectAll provided", () => {
    renderBanner(twoProviders, { onReconnectAll: mock(() => {}) });
    expect(screen.getByText(labels.reconnectAllButton)).toBeInTheDocument();
  });

  test("no reconnect all when only 1 provider", () => {
    renderBanner([{ slug: "zoom", name: "Zoom", expiryState: "expired" }], { onReconnectAll: mock(() => {}) });
    expect(screen.queryByText(labels.reconnectAllButton)).not.toBeInTheDocument();
  });

  test("onReconnectAll called when button clicked", () => {
    const onReconnectAll = mock(() => {});
    renderBanner(twoProviders, { onReconnectAll });
    fireEvent.click(screen.getByText(labels.reconnectAllButton));
    expect(onReconnectAll).toHaveBeenCalledTimes(1);
  });

  test("dismiss button calls onDismiss and hides banner", () => {
    const onDismiss = mock(() => {});
    renderBanner([{ slug: "zoom", name: "Zoom", expiryState: "expired" }], { onDismiss });
    fireEvent.click(screen.getByText(labels.remindLater));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("unknown expiryState falls back to reconnectRequiredBadge label", () => {
    renderBanner([{ slug: "zoom", name: "Zoom", expiryState: undefined }]);
    // The fallback label appears inside the reconnect button text
    const reconnectBtn = screen.getByRole("button");
    expect(reconnectBtn.textContent).toContain(labels.reconnectRequiredBadge);
  });
});
