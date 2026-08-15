import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { ReconnectAllAction } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ReconnectAllAction";
import type { ReauthProvider } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";
import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const labels = {
  reconnectAllWithCount: (count: number) => `إعادة ربط الكل (${count})`,
  reconnectingProgress: (current: number, total: number) => `جارٍ ${current}/${total}`,
  reconnectedProviders: (count: number) => `نجح ${count}`,
  reconnectFailedProviders: (count: number) => `فشل ${count}`,
  reconnectAllAriaLabel: "إعادة ربط جميع المزودين",
} as unknown as Pick<
  MeetingConfigEnhancementLabels,
  "reconnectAllWithCount" | "reconnectingProgress" | "reconnectedProviders" | "reconnectFailedProviders" | "reconnectAllAriaLabel"
>;

const twoProviders: readonly ReauthProvider[] = [
  { slug: "zoom", name: "Zoom", expiryState: "expired" },
  { slug: "google_meet", name: "Google Meet", expiryState: "expiring_soon" },
];

const oneProvider: readonly ReauthProvider[] = [{ slug: "zoom", name: "Zoom", expiryState: "expired" }];

describe("ReconnectAllAction", () => {
  test("renders button with count when >= 2 providers", () => {
    render(
      <ReconnectAllAction
        providers={twoProviders}
        labels={labels}
        onReconnectProvider={mock(() => Promise.resolve(true))}
        onComplete={mock(() => {})}
      />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByLabelText("إعادة ربط جميع المزودين")).toBeInTheDocument();
    expect(screen.getByText("إعادة ربط الكل (2)")).toBeInTheDocument();
  });

  test("returns null when < 2 providers", () => {
    const { container } = render(
      <ReconnectAllAction
        providers={oneProvider}
        labels={labels}
        onReconnectProvider={mock(() => Promise.resolve(true))}
        onComplete={mock(() => {})}
      />,
      { wrapper: TestWrapper }
    );
    expect(container.firstChild).toBeNull();
  });

  test("returns null when no providers", () => {
    const { container } = render(
      <ReconnectAllAction
        providers={[]}
        labels={labels}
        onReconnectProvider={mock(() => Promise.resolve(true))}
        onComplete={mock(() => {})}
      />,
      { wrapper: TestWrapper }
    );
    expect(container.firstChild).toBeNull();
  });

  test("clicking button processes all providers and calls onComplete", async () => {
    const onReconnectProvider = mock((slug: string) => Promise.resolve(true));
    const onComplete = mock(() => {});
    render(
      <ReconnectAllAction
        providers={twoProviders}
        labels={labels}
        onReconnectProvider={onReconnectProvider}
        onComplete={onComplete}
      />,
      { wrapper: TestWrapper }
    );

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
    render(
      <ReconnectAllAction
        providers={twoProviders}
        labels={labels}
        onReconnectProvider={onReconnectProvider}
        onComplete={mock(() => {})}
      />,
      { wrapper: TestWrapper }
    );

    fireEvent.click(screen.getByLabelText("إعادة ربط جميع المزودين"));

    expect(screen.getByText(/جارٍ/)).toBeInTheDocument();
  });

  test("counts failures in onComplete", async () => {
    const onReconnectProvider = mock((_slug: string) => Promise.resolve(false));
    const onComplete = mock(() => {});
    render(
      <ReconnectAllAction
        providers={twoProviders}
        labels={labels}
        onReconnectProvider={onReconnectProvider}
        onComplete={onComplete}
      />,
      { wrapper: TestWrapper }
    );

    fireEvent.click(screen.getByLabelText("إعادة ربط جميع المزودين"));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(0, 2);
    });
  });
});
