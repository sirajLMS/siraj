import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import {
  OAuthCallbackHandler,
  type OAuthCallbackHandlerLabels,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

const labels: OAuthCallbackHandlerLabels = {
  oauthCallbackSuccess: "تم الربط بنجاح",
  oauthCallbackError: "تعذّر الربط",
};

describe("OAuthCallbackHandler", () => {
  test("renders output live region", () => {
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={mock(() => {})} />, { wrapper: TestWrapper });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test.each([
    ["success", "/?oauth_status=success&provider=zoom", ["success", "zoom", undefined] as const, "تم الربط بنجاح"],
    [
      "error",
      "/?oauth_status=error&provider=zoom&error=invalid_scope",
      ["error", "zoom", "invalid_scope"] as const,
      "تعذّر الربط",
    ],
  ])("detects %s params and cleans URL", async (_status, url, expectedArgs, expectedText) => {
    window.history.replaceState({}, "", url);
    const onCallbackDetected = mock(() => {});
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={onCallbackDetected} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(onCallbackDetected).toHaveBeenCalledWith(...expectedArgs);
    });

    await waitFor(() => {
      expect(window.location.search).toBe("");
    });

    expect(screen.getByText(expectedText)).toBeInTheDocument();
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

    act(() => {
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
