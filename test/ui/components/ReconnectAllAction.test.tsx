import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import {
  ReconnectAllAction,
  type ReconnectAllActionLabels,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ReconnectAllAction";
import type { ReauthProvider } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const labels: ReconnectAllActionLabels = {
  reconnectAllWithCount: (count: number) => `إعادة ربط الكل (${count})`,
  reconnectingProgress: (current: number, total: number) => `جارٍ ${current}/${total}`,
  reconnectedProviders: (count: number) => `نجح ${count}`,
  reconnectFailedProviders: (count: number) => `فشل ${count}`,
  reconnectAllAriaLabel: "إعادة ربط جميع المزودين",
};

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
    { wrapper: TestWrapper }
  );
}

describe("ReconnectAllAction", () => {
  test("renders button with count when >= 2 providers", () => {
    renderAction();
    expect(screen.getByLabelText("إعادة ربط جميع المزودين")).toBeInTheDocument();
    expect(screen.getByText("إعادة ربط الكل (2)")).toBeInTheDocument();
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

    fireEvent.click(screen.getByLabelText("إعادة ربط جميع المزودين"));

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

    fireEvent.click(screen.getByLabelText("إعادة ربط جميع المزودين"));

    expect(screen.getByText(/جارٍ/)).toBeInTheDocument();
  });

  test("counts failures in onComplete", async () => {
    const onReconnectProvider = mock((_slug: string) => Promise.resolve(false));
    const onComplete = mock(() => {});
    renderAction(twoProviders, { onReconnectProvider, onComplete });

    fireEvent.click(screen.getByLabelText("إعادة ربط جميع المزودين"));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(0, 2);
    });
  });
});
