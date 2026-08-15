import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { OAuthCallbackHandler } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler";
import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

const labels = {
  oauthCallbackSuccess: "تم الربط بنجاح",
  oauthCallbackError: "تعذّر الربط",
} as unknown as Pick<MeetingConfigEnhancementLabels, "oauthCallbackSuccess" | "oauthCallbackError">;

describe("OAuthCallbackHandler", () => {
  test("renders output live region", () => {
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={mock(() => {})} />, { wrapper: TestWrapper });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("detects success params and cleans URL", async () => {
    window.history.replaceState({}, "", "/?oauth_status=success&provider=zoom");
    const onCallbackDetected = mock(() => {});
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={onCallbackDetected} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(onCallbackDetected).toHaveBeenCalledWith("success", "zoom", undefined);
    });

    await waitFor(() => {
      expect(window.location.search).toBe("");
    });

    expect(screen.getByText("تم الربط بنجاح")).toBeInTheDocument();
  });

  test("detects error params and cleans URL", async () => {
    window.history.replaceState({}, "", "/?oauth_status=error&provider=zoom&error=invalid_scope");
    const onCallbackDetected = mock(() => {});
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={onCallbackDetected} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(onCallbackDetected).toHaveBeenCalledWith("error", "zoom", "invalid_scope");
    });

    await waitFor(() => {
      expect(window.location.search).toBe("");
    });

    expect(screen.getByText("تعذّر الربط")).toBeInTheDocument();
  });

  test("preserves other URL params when cleaning OAuth params", async () => {
    window.history.replaceState({}, "", "/?oauth_status=success&provider=zoom&tab=integrations");
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={mock(() => {})} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(window.location.search).toBe("?tab=integrations");
    });
  });

  test("fires focus callback when window regains focus", async () => {
    const onCallbackDetected = mock(() => {});
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={onCallbackDetected} />, { wrapper: TestWrapper });

    await act(() => {
      fireEvent.focus(window);
    });

    await waitFor(() => {
      expect(onCallbackDetected).toHaveBeenCalledWith("focus", "");
    });
  });

  test("does not fire callback when no OAuth params present", async () => {
    const onCallbackDetected = mock(() => {});
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={onCallbackDetected} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(onCallbackDetected).not.toHaveBeenCalledWith("success", expect.any(String), expect.anything());
    });
  });
});
