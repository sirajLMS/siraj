import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { logger } from "@/frontend/common/utils/logger";
import { FullScreenErrorView } from "@/frontend/common/views/errors/FullScreenErrorView";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(cleanup);

const locale: AppLocale = "ar";
const outageLabels = readTranslation(Translation.Errors, locale).serviceOutage;

const error = new Error("simulated failure");

function makeFetchStub(status: number, onCall: () => void) {
  return Object.assign(
    (_input: RequestInfo | URL, _init?: RequestInit) => {
      onCall();
      return Promise.resolve(
        new Response(JSON.stringify({ status: status === 200 ? "ok" : "unavailable" }), { status })
      );
    },
    { preconnect: () => undefined }
  );
}

describe("FullScreenErrorView", () => {
  let errorLogSpy: ReturnType<typeof spyOn>;
  let fetchCallCount = 0;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    errorLogSpy = spyOn(logger, "error").mockImplementation(() => undefined);
    fetchCallCount = 0;
  });

  afterEach(() => {
    errorLogSpy.mockRestore();
    globalThis.fetch = originalFetch;
  });

  test("renders the database-unavailable copy immediately when the digest hint is set", () => {
    globalThis.fetch = makeFetchStub(503, () => {
      fetchCallCount += 1;
    });

    renderWithWrapper(<FullScreenErrorView error={error} onRetry={() => undefined} databaseUnavailableHint />, {
      locale,
    });

    expect(screen.getByText(outageLabels.title)).toBeInTheDocument();
    expect(screen.getByText(outageLabels.description)).toBeInTheDocument();
    expect(screen.getByText(outageLabels.autoRetryHint)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: outageLabels.retry })).toBeInTheDocument();
  });

  test("renders the generic confidential copy when the database probe succeeds", async () => {
    globalThis.fetch = makeFetchStub(200, () => {
      fetchCallCount += 1;
    });

    renderWithWrapper(<FullScreenErrorView error={error} onRetry={() => undefined} />, { locale });

    expect(screen.getByText(outageLabels.genericTitle)).toBeInTheDocument();
    expect(screen.getByText(outageLabels.genericDescription)).toBeInTheDocument();
    expect(screen.queryByText(outageLabels.autoRetryHint)).not.toBeInTheDocument();
    // The underlying error details must never reach the UI.
    expect(screen.queryByText(/simulated failure/)).not.toBeInTheDocument();

    // One classification probe only — no polling loop for healthy databases.
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(fetchCallCount).toBe(1);
  });

  test("switches to the database-unavailable copy when the probe fails", async () => {
    globalThis.fetch = makeFetchStub(503, () => {
      fetchCallCount += 1;
    });

    renderWithWrapper(<FullScreenErrorView error={error} onRetry={() => undefined} />, { locale });

    expect(screen.getByText(outageLabels.genericTitle)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(outageLabels.title)).toBeInTheDocument());
    expect(screen.getByText(outageLabels.autoRetryHint)).toBeInTheDocument();
  });

  test("manual retry invokes onRetry and shows the pending state", async () => {
    const user = userEvent.setup();
    const onRetry = mock(() => undefined);
    globalThis.fetch = makeFetchStub(503, () => {
      fetchCallCount += 1;
    });

    renderWithWrapper(<FullScreenErrorView error={error} onRetry={onRetry} databaseUnavailableHint />, { locale });

    const button = screen.getByRole("button", { name: outageLabels.retry });
    await user.click(button);

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: outageLabels.retrying })).toBeDisabled();
  });
});
