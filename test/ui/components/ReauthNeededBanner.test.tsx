import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { ReauthNeededBanner } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner";
import type { ReauthProvider } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";
import type { MeetingConfigReauthNeededLabels } from "@/shared/locale/types/ui";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const labels: MeetingConfigReauthNeededLabels = {
  reauthNeededTitle: "أعد ربط حسابك",
  reauthNeededMessage: "بعض المزودين يحتاجون إعادة ربط",
  reconnectButton: "إعادة الربط",
  reauthExpiringSoon: "على وشك الانتهاء",
  reauthExpired: "منتهي",
  reconnectRequiredBadge: "إعادة الربط مطلوبة",
  remindLater: "ذكّرني لاحقاً",
  reconnectAllButton: "إعادة ربط الكل",
};

describe("ReauthNeededBanner", () => {
  test("returns null when no reauth providers", () => {
    const { container } = render(
      <ReauthNeededBanner reauthProviders={[]} labels={labels} onReconnect={mock(() => {})} />,
      { wrapper: TestWrapper }
    );
    expect(container.firstChild).toBeNull();
  });

  test("warning severity when all providers expiring soon", () => {
    render(
      <ReauthNeededBanner
        reauthProviders={[{ slug: "zoom", name: "Zoom", expiryState: "expiring_soon" }]}
        labels={labels}
        onReconnect={mock(() => {})}
      />,
      { wrapper: TestWrapper }
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("MuiAlert-standardWarning");
    expect(screen.getByText("أعد ربط حسابك")).toBeInTheDocument();
    expect(screen.getByText(/على وشك الانتهاء/)).toBeInTheDocument();
  });

  test("error severity when any provider expired", () => {
    render(
      <ReauthNeededBanner
        reauthProviders={[
          { slug: "zoom", name: "Zoom", expiryState: "expiring_soon" },
          { slug: "google_meet", name: "Google Meet", expiryState: "expired" },
        ]}
        labels={labels}
        onReconnect={mock(() => {})}
      />,
      { wrapper: TestWrapper }
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("MuiAlert-standardError");
  });

  test("per-provider reconnect buttons rendered", () => {
    const onReconnect = mock(() => {});
    render(
      <ReauthNeededBanner
        reauthProviders={[
          { slug: "zoom", name: "Zoom", expiryState: "expired" },
          { slug: "google_meet", name: "Google Meet", expiryState: "expiring_soon" },
        ]}
        labels={labels}
        onReconnect={onReconnect}
      />,
      { wrapper: TestWrapper }
    );
    const zoomBtn = screen.getByText(/Zoom.*منتهي/);
    const googleBtn = screen.getByText(/Google Meet.*على وشك الانتهاء/);
    expect(zoomBtn).toBeInTheDocument();
    expect(googleBtn).toBeInTheDocument();

    fireEvent.click(zoomBtn);
    expect(onReconnect).toHaveBeenCalledWith("zoom");
  });

  test("reconnect all button shows when >= 2 providers and onReconnectAll provided", () => {
    render(
      <ReauthNeededBanner
        reauthProviders={[
          { slug: "zoom", name: "Zoom", expiryState: "expired" },
          { slug: "google_meet", name: "Google Meet", expiryState: "expiring_soon" },
        ]}
        labels={labels}
        onReconnect={mock(() => {})}
        onReconnectAll={mock(() => {})}
      />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByText("إعادة ربط الكل")).toBeInTheDocument();
  });

  test("no reconnect all when only 1 provider", () => {
    render(
      <ReauthNeededBanner
        reauthProviders={[{ slug: "zoom", name: "Zoom", expiryState: "expired" }]}
        labels={labels}
        onReconnect={mock(() => {})}
        onReconnectAll={mock(() => {})}
      />,
      { wrapper: TestWrapper }
    );
    expect(screen.queryByText("إعادة ربط الكل")).not.toBeInTheDocument();
  });

  test("onReconnectAll called when button clicked", () => {
    const onReconnectAll = mock(() => {});
    render(
      <ReauthNeededBanner
        reauthProviders={[
          { slug: "zoom", name: "Zoom", expiryState: "expired" },
          { slug: "google_meet", name: "Google Meet", expiryState: "expiring_soon" },
        ]}
        labels={labels}
        onReconnect={mock(() => {})}
        onReconnectAll={onReconnectAll}
      />,
      { wrapper: TestWrapper }
    );
    fireEvent.click(screen.getByText("إعادة ربط الكل"));
    expect(onReconnectAll).toHaveBeenCalledTimes(1);
  });

  test("dismiss button calls onDismiss and hides banner", () => {
    const onDismiss = mock(() => {});
    render(
      <ReauthNeededBanner
        reauthProviders={[{ slug: "zoom", name: "Zoom", expiryState: "expired" }]}
        labels={labels}
        onReconnect={mock(() => {})}
        onDismiss={onDismiss}
      />,
      { wrapper: TestWrapper }
    );
    // Remind later text button
    fireEvent.click(screen.getByText("ذكّرني لاحقاً"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("unknown expiryState falls back to reconnectRequiredBadge label", () => {
    render(
      <ReauthNeededBanner
        reauthProviders={[{ slug: "zoom", name: "Zoom", expiryState: undefined }]}
        labels={labels}
        onReconnect={mock(() => {})}
      />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByText(/إعادة الربط مطلوبة/)).toBeInTheDocument();
  });
});
