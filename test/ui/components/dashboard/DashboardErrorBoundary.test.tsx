import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { DashboardErrorBoundary } from "@/frontend/common/views/dashboard/components/DashboardErrorBoundary";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.BillingQuota, locale);

function renderBoundary(reset: () => void) {
  return renderWithWrapper(
    <DashboardErrorBoundary
      error={new Error("boom")}
      reset={reset}
      translation={Translation.Dashboard.BillingQuota}
      errorScope="quotas"
    />,
    { locale }
  );
}

afterEach(() => {
  cleanup();
});

describe("DashboardErrorBoundary", () => {
  test("renders the translated error message inside an error alert", () => {
    renderBoundary(() => {});

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert.className.includes("MuiAlert-colorError")).toBe(true);
    expect(alert.textContent).toContain(labels.errorGeneric);
  });

  test("invokes the retry callback from the alert action button", () => {
    const reset = mock(() => {});
    renderBoundary(reset);

    fireEvent.click(screen.getByRole("button", { name: labels.retry }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
