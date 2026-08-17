import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { MeetingUrlStatusBadge } from "@/frontend/common/components/ui/display/meetingConfig/MeetingUrlStatusBadge";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.MeetingUrlStatus, locale);

afterEach(() => {
  cleanup();
});

function renderBadge(status: "pending" | "generated" | "failed" | "expired", props?: Record<string, unknown>) {
  return render(<MeetingUrlStatusBadge status={status} {...props} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("MeetingUrlStatusBadge", () => {
  test("renders pending status with label", () => {
    renderBadge("pending");
    expect(screen.getByText(t.urlPending)).toBeInTheDocument();
  });

  test("renders generated status with label", () => {
    renderBadge("generated");
    expect(screen.getByText(t.urlReady)).toBeInTheDocument();
  });

  test("renders failed status with label", () => {
    renderBadge("failed");
    expect(screen.getByText(t.urlFailed)).toBeInTheDocument();
  });

  test("renders expired status with label", () => {
    renderBadge("expired");
    expect(screen.getByText(t.urlExpired)).toBeInTheDocument();
  });

  test("renders tooltip when provided", () => {
    renderBadge("failed", { tooltip: "Network error occurred" });
    const output = screen.getByLabelText(t.urlFailed);
    expect(output).toHaveAttribute("title", "Network error occurred");
  });

  test("renders without tooltip when null", () => {
    renderBadge("generated", { tooltip: null });
    const output = screen.getByLabelText(t.urlReady);
    expect(output).not.toHaveAttribute("title");
  });

  test("has aria-label for accessibility", () => {
    renderBadge("pending");
    expect(screen.getByLabelText(t.urlPending)).toHaveAttribute("aria-label", t.urlPending);
  });

  test("uses output semantic element", () => {
    renderBadge("generated");
    expect(screen.getByLabelText(t.urlReady).tagName).toBe("OUTPUT");
  });

  test("renders small size", () => {
    renderBadge("generated", { size: "small" });
    expect(screen.getByLabelText(t.urlReady)).toBeInTheDocument();
  });

  test("applies custom sx prop", () => {
    renderBadge("generated", { sx: { mt: 2 } });
    expect(screen.getByLabelText(t.urlReady)).toBeInTheDocument();
  });
});
