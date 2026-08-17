import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import {
  ConnectProviderAccount,
  type ConnectProviderAccountLabels,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ConnectProviderAccount";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const labels: ConnectProviderAccountLabels = readTranslation(Translation.Profile.Notifications, locale).connectAccount;

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
    { wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper> }
  );
}

describe("ConnectProviderAccount", () => {
  test("disconnected state shows connect button and status badge", () => {
    renderAccount({ connectionState: "disconnected" });
    expect(screen.getByText("Zoom")).toBeInTheDocument();
    expect(screen.getByText(labels.statusDisconnected)).toBeInTheDocument();
    expect(screen.getByLabelText(`${labels.connectButton} Zoom`)).toBeInTheDocument();
  });

  test("disconnected state calls onConnect with slug when clicked", () => {
    const onConnect = mock(() => {});
    renderAccount({ connectionState: "disconnected", onConnect });
    fireEvent.click(screen.getByLabelText(`${labels.connectButton} Zoom`));
    expect(onConnect).toHaveBeenCalledWith("zoom");
  });

  test("disconnected state shows loading when loading=true", () => {
    renderAccount({ connectionState: "disconnected", loading: true });
    expect(screen.getByLabelText(`${labels.connectButton} Zoom`).closest("button")).toBeDisabled();
  });

  test("connecting state shows progress and label", () => {
    renderAccount({ connectionState: "connecting" });
    expect(screen.getByText(labels.connectingLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(labels.connectingLabel)).toBeInTheDocument();
  });

  test("connected state shows status badge and disconnect button", () => {
    renderAccount({ connectionState: "connected", connectedEmail: "[EMAIL_REDACTED]" });
    expect(screen.getByText(labels.statusConnected)).toBeInTheDocument();
    expect(screen.getByText(labels.connectedAs("[EMAIL_REDACTED]"))).toBeInTheDocument();
    expect(screen.getByLabelText(`${labels.disconnectButton} Zoom`)).toBeInTheDocument();
  });

  test("connected state calls onDisconnect with slug", () => {
    const onDisconnect = mock(() => {});
    renderAccount({ connectionState: "connected", onDisconnect });
    fireEvent.click(screen.getByLabelText(`${labels.disconnectButton} Zoom`));
    expect(onDisconnect).toHaveBeenCalledWith("zoom");
  });

  test("connected state without email does not show connectedAs", () => {
    renderAccount({ connectionState: "connected" });
    expect(screen.queryByText(labels.statusConnected)).toBeInTheDocument();
  });

  test("expiring state shows warning alert with reconnect button", () => {
    renderAccount({ connectionState: "expiring", connectedEmail: "[EMAIL_REDACTED]" });
    expect(screen.getByText(labels.statusExpiring)).toBeInTheDocument();
    expect(screen.getByText(labels.reconnectCallout)).toBeInTheDocument();
    expect(screen.getByLabelText(`${labels.reconnectButton} Zoom`)).toBeInTheDocument();
  });

  test("expiring state calls onReconnect with slug", () => {
    const onReconnect = mock(() => {});
    renderAccount({ connectionState: "expiring", onReconnect });
    fireEvent.click(screen.getByLabelText(`${labels.reconnectButton} Zoom`));
    expect(onReconnect).toHaveBeenCalledWith("zoom");
  });

  test("expired state shows error alert severity", () => {
    renderAccount({ connectionState: "expired" });
    expect(screen.getByText(labels.statusExpired)).toBeInTheDocument();
    expect(screen.getByText(labels.reconnectCallout)).toBeInTheDocument();
    expect(screen.getByLabelText(`${labels.reconnectButton} Zoom`)).toBeInTheDocument();
  });

  test("expired state calls onReconnect with slug", () => {
    const onReconnect = mock(() => {});
    renderAccount({ connectionState: "expired", onReconnect });
    fireEvent.click(screen.getByLabelText(`${labels.reconnectButton} Zoom`));
    expect(onReconnect).toHaveBeenCalledWith("zoom");
  });

  test("reconnect states show loading overlay when loading=true", () => {
    renderAccount({ connectionState: "expired", loading: true });
    // Reconnect button disabled during loading
    expect(screen.getByLabelText(`${labels.reconnectButton} Zoom`).closest("button")).toBeDisabled();
    // Loading overlay text visible
    expect(screen.getByText(labels.connectingLabel)).toBeInTheDocument();
  });
});
