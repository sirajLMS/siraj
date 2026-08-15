import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { ReauthNeededBanner } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner";
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
    { wrapper: TestWrapper }
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
    expect(alert).toHaveClass("MuiAlert-standardWarning");
    expect(screen.getByText("أعد ربط حسابك")).toBeInTheDocument();
    expect(screen.getByText(/على وشك الانتهاء/)).toBeInTheDocument();
  });

  test("error severity when any provider expired", () => {
    renderBanner([
      { slug: "zoom", name: "Zoom", expiryState: "expiring_soon" },
      { slug: "google_meet", name: "Google Meet", expiryState: "expired" },
    ]);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("MuiAlert-standardError");
  });

  test("per-provider reconnect buttons rendered", () => {
    const onReconnect = mock(() => {});
    renderBanner(twoProviders, { onReconnect });
    const zoomBtn = screen.getByText(/Zoom.*منتهي/);
    const googleBtn = screen.getByText(/Google Meet.*على وشك الانتهاء/);
    expect(zoomBtn).toBeInTheDocument();
    expect(googleBtn).toBeInTheDocument();

    fireEvent.click(zoomBtn);
    expect(onReconnect).toHaveBeenCalledWith("zoom");
  });

  test("reconnect all button shows when >= 2 providers and onReconnectAll provided", () => {
    renderBanner(twoProviders, { onReconnectAll: mock(() => {}) });
    expect(screen.getByText("إعادة ربط الكل")).toBeInTheDocument();
  });

  test("no reconnect all when only 1 provider", () => {
    renderBanner([{ slug: "zoom", name: "Zoom", expiryState: "expired" }], { onReconnectAll: mock(() => {}) });
    expect(screen.queryByText("إعادة ربط الكل")).not.toBeInTheDocument();
  });

  test("onReconnectAll called when button clicked", () => {
    const onReconnectAll = mock(() => {});
    renderBanner(twoProviders, { onReconnectAll });
    fireEvent.click(screen.getByText("إعادة ربط الكل"));
    expect(onReconnectAll).toHaveBeenCalledTimes(1);
  });

  test("dismiss button calls onDismiss and hides banner", () => {
    const onDismiss = mock(() => {});
    renderBanner([{ slug: "zoom", name: "Zoom", expiryState: "expired" }], { onDismiss });
    // Remind later text button
    fireEvent.click(screen.getByText("ذكّرني لاحقاً"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("unknown expiryState falls back to reconnectRequiredBadge label", () => {
    renderBanner([{ slug: "zoom", name: "Zoom", expiryState: undefined }]);
    expect(screen.getByText(/إعادة الربط مطلوبة/)).toBeInTheDocument();
  });
});
