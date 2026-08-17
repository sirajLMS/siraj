import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  OAuthCallbackHandler,
  type OAuthCallbackHandlerLabels,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

const locale: AppLocale = "ar";
const enhancements = readTranslation(Translation.Ui.MeetingConfig, locale).enhancements;
const labels: OAuthCallbackHandlerLabels = {
  oauthCallbackSuccess: enhancements.oauthCallbackSuccess,
  oauthCallbackError: enhancements.oauthCallbackError,
};

const wrapper = ({ children }: { children: React.ReactNode }) => <TestWrapper locale={locale}>{children}</TestWrapper>;

afterEach(() => {
  cleanup();
  window.location.href = "http://localhost/";
});

describe("OAuthCallbackHandler", () => {
  test("renders output live region", () => {
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={mock(() => {})} />, { wrapper });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test.each([
    ["success", "/?oauth_status=success&provider=zoom", ["success", "zoom", undefined] as const],
    ["error", "/?oauth_status=error&provider=zoom&error=invalid_scope", ["error", "zoom", "invalid_scope"] as const],
  ])("detects %s params and cleans URL", async (_status, url, expectedArgs) => {
    window.location.href = `http://localhost${url}`;
    const onCallbackDetected = mock(() => {});
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={onCallbackDetected} />, { wrapper });

    await waitFor(() => {
      expect(onCallbackDetected).toHaveBeenCalledWith(...expectedArgs);
    });

    await waitFor(() => {
      expect(window.location.search).toBe("");
    });
  });

  test("preserves other URL params when cleaning OAuth params", async () => {
    window.location.href = "http://localhost/?oauth_status=success&provider=zoom&tab=integrations";
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={mock(() => {})} />, { wrapper });

    await waitFor(() => {
      expect(window.location.search).toBe("?tab=integrations");
    });
  });

  test("fires focus callback when window regains focus", async () => {
    const onCallbackDetected = mock(() => {});
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={onCallbackDetected} />, { wrapper });

    act(() => {
      fireEvent.focus(window);
    });

    await waitFor(() => {
      expect(onCallbackDetected).toHaveBeenCalledWith("focus", "");
    });
  });

  test("does not fire callback when no OAuth params present", async () => {
    const onCallbackDetected = mock(() => {});
    render(<OAuthCallbackHandler labels={labels} onCallbackDetected={mock(() => {})} />, { wrapper });

    await waitFor(() => {
      expect(onCallbackDetected).not.toHaveBeenCalledWith("success", expect.any(String), expect.anything());
    });
  });
});
