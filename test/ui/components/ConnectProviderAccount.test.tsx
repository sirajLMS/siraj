import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { ConnectProviderAccount } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ConnectProviderAccount";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const labels = {
  connectButton: "ربط",
  connectingLabel: "جارٍ الربط…",
  connectedAs: (email: string) => `مرتبط باسم ${email}`,
  disconnectButton: "إلغاء الربط",
  reconnectButton: "إعادة الربط",
  reconnectCallout: "مطلوب إعادة الربط",
  statusConnected: "مرتبط",
  statusExpiring: "على وشك الانتهاء",
  statusExpired: "منتهي",
  statusDisconnected: "غير مرتبط",
} as unknown as ProfileNotificationsLabels["connectAccount"];

function renderAccount(props: Record<string, unknown>) {
  return render(
    <ConnectProviderAccount
      labels={labels}
      providerSlug="zoom"
      providerName="Zoom"
      connectionState="disconnected"
      onConnect={mock(() => {})}
      onReconnect={mock(() => {})}
      onDisconnect={mock(() => {})}
      {...props}
    />,
    { wrapper: TestWrapper }
  );
}

describe("ConnectProviderAccount", () => {
  test("disconnected state shows connect button and status badge", () => {
    renderAccount({ connectionState: "disconnected" });
    expect(screen.getByText("Zoom")).toBeInTheDocument();
    expect(screen.getByText("غير مرتبط")).toBeInTheDocument();
    expect(screen.getByLabelText("ربط Zoom")).toBeInTheDocument();
  });

  test("disconnected state calls onConnect with slug when clicked", () => {
    const onConnect = mock(() => {});
    renderAccount({ connectionState: "disconnected", onConnect });
    fireEvent.click(screen.getByLabelText("ربط Zoom"));
    expect(onConnect).toHaveBeenCalledWith("zoom");
  });

  test("disconnected state shows loading when loading=true", () => {
    renderAccount({ connectionState: "disconnected", loading: true });
    expect(screen.getByLabelText("ربط Zoom").closest("button")).toBeDisabled();
  });

  test("connecting state shows progress and label", () => {
    renderAccount({ connectionState: "connecting" });
    expect(screen.getByText("جارٍ الربط…")).toBeInTheDocument();
    expect(screen.getByLabelText("جارٍ الربط…")).toBeInTheDocument();
  });

  test("connected state shows status badge and disconnect button", () => {
    renderAccount({ connectionState: "connected", connectedEmail: "user@example.com" });
    expect(screen.getByText("مرتبط")).toBeInTheDocument();
    expect(screen.getByText("مرتبط باسم user@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText("إلغاء الربط Zoom")).toBeInTheDocument();
  });

  test("connected state calls onDisconnect with slug", () => {
    const onDisconnect = mock(() => {});
    renderAccount({ connectionState: "connected", onDisconnect });
    fireEvent.click(screen.getByLabelText("إلغاء الربط Zoom"));
    expect(onDisconnect).toHaveBeenCalledWith("zoom");
  });

  test("connected state without email does not show connectedAs", () => {
    renderAccount({ connectionState: "connected" });
    expect(screen.queryByText(/مرتبط باسم/)).not.toBeInTheDocument();
  });

  test("expiring state shows warning alert with reconnect button", () => {
    renderAccount({ connectionState: "expiring", connectedEmail: "user@example.com" });
    expect(screen.getByText("على وشك الانتهاء")).toBeInTheDocument();
    expect(screen.getByText("مطلوب إعادة الربط")).toBeInTheDocument();
    expect(screen.getByLabelText("إعادة الربط Zoom")).toBeInTheDocument();
  });

  test("expiring state calls onReconnect with slug", () => {
    const onReconnect = mock(() => {});
    renderAccount({ connectionState: "expiring", onReconnect });
    fireEvent.click(screen.getByLabelText("إعادة الربط Zoom"));
    expect(onReconnect).toHaveBeenCalledWith("zoom");
  });

  test("expired state shows error alert severity", () => {
    renderAccount({ connectionState: "expired" });
    expect(screen.getByText("منتهي")).toBeInTheDocument();
    expect(screen.getByText("مطلوب إعادة الربط")).toBeInTheDocument();
    expect(screen.getByLabelText("إعادة الربط Zoom")).toBeInTheDocument();
  });

  test("expired state calls onReconnect with slug", () => {
    const onReconnect = mock(() => {});
    renderAccount({ connectionState: "expired", onReconnect });
    fireEvent.click(screen.getByLabelText("إعادة الربط Zoom"));
    expect(onReconnect).toHaveBeenCalledWith("zoom");
  });

  test("reconnect states show loading overlay when loading=true", () => {
    renderAccount({ connectionState: "expired", loading: true });
    // Reconnect button disabled during loading
    expect(screen.getByLabelText("إعادة الربط Zoom").closest("button")).toBeDisabled();
    // Loading overlay text visible
    expect(screen.getByText("جارٍ الربط…")).toBeInTheDocument();
  });
});
