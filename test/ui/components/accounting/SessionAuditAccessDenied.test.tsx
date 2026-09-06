import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { SessionAuditAccessDenied } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditAccessDenied";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.SessionAudit, locale).accessDenied;

const PERMISSION_NAME = "ACCOUNTING_REPORTS_VIEW";

afterEach(() => {
  cleanup();
});

function renderAccessDenied() {
  return render(<SessionAuditAccessDenied labels={labels} permissionName={PERMISSION_NAME} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("SessionAuditAccessDenied — rendered content", () => {
  test("renders as an alert with title, description, permission name, and status chip", () => {
    renderAccessDenied();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(labels.title)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(labels.descriptionPrefix))).toBeInTheDocument();
    expect(screen.getByText(PERMISSION_NAME)).toBeInTheDocument();
    expect(screen.getByText(labels.statusChip)).toBeInTheDocument();
  });

  test("links the primary action back to /dashboard", () => {
    renderAccessDenied();
    expect(screen.getByRole("link", { name: labels.backToDashboard })).toHaveAttribute("href", "/dashboard");
  });

  test("renders the contact support action as a mailto link", () => {
    renderAccessDenied();
    const contactLink = screen.getByRole("link", { name: labels.contactSupport });
    expect(contactLink).toHaveAttribute("href");
    expect(contactLink.getAttribute("href")?.startsWith("mailto:")).toBe(true);
  });
});
