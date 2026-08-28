import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import {
  ReconnectAllAction,
  type ReconnectAllActionLabels,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ReconnectAllAction";
import type { ReauthProvider } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const labels: ReconnectAllActionLabels = readTranslation(Translation.Ui.MeetingConfig, locale).enhancements;

const twoProviders: readonly ReauthProvider[] = [
  { slug: "zoom", name: "Zoom", expiryState: "expired" },
  { slug: "google_meet", name: "Google Meet", expiryState: "expiring_soon" },
];

const oneProvider: readonly ReauthProvider[] = [{ slug: "zoom", name: "Zoom", expiryState: "expired" }];

function renderAction(
  providers: readonly ReauthProvider[] = twoProviders,
  overrides: Partial<React.ComponentProps<typeof ReconnectAllAction>> = {}
) {
  return render(
    <ReconnectAllAction
      providers={providers}
      labels={labels}
      onReconnectProvider={mock(() => Promise.resolve(true))}
      onComplete={mock(() => {})}
      {...overrides}
    />,
    { wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper> }
  );
}

describe("ReconnectAllAction", () => {
  test("renders button with count when >= 2 providers", () => {
    renderAction();
    expect(screen.getByLabelText(labels.reconnectAllAriaLabel)).toBeInTheDocument();
    expect(screen.getByText(labels.reconnectAllWithCount(2))).toBeInTheDocument();
  });

  test.each([
    ["1 provider", oneProvider],
    ["0 providers", []],
  ])("returns null when %s provided", (_desc, providers) => {
    const { container } = renderAction(providers);
    expect(container.firstChild).toBeNull();
  });

  test("clicking button processes all providers and calls onComplete", async () => {
    const onReconnectProvider = mock((_slug: string) => Promise.resolve(true));
    const onComplete = mock(() => {});
    renderAction(twoProviders, { onReconnectProvider, onComplete });

    fireEvent.click(screen.getByLabelText(labels.reconnectAllAriaLabel));

    await waitFor(() => {
      expect(onReconnectProvider).toHaveBeenCalledTimes(2);
    });
    expect(onReconnectProvider).toHaveBeenNthCalledWith(1, "zoom");
    expect(onReconnectProvider).toHaveBeenNthCalledWith(2, "google_meet");

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(2, 0);
    });
  });

  test("shows progress indicator during reconnection", async () => {
    const onReconnectProvider = mock((_slug: string) => Promise.resolve(true));
    renderAction(twoProviders, { onReconnectProvider });

    fireEvent.click(screen.getByLabelText(labels.reconnectAllAriaLabel));

    expect(screen.getByText(content => content === labels.reconnectingProgress(1, 2))).toBeInTheDocument();
  });

  test("counts failures in onComplete", async () => {
    const onReconnectProvider = mock((_slug: string) => Promise.resolve(false));
    const onComplete = mock(() => {});
    renderAction(twoProviders, { onReconnectProvider, onComplete });

    fireEvent.click(screen.getByLabelText(labels.reconnectAllAriaLabel));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(0, 2);
    });
  });
});
