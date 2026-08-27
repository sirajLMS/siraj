import { afterEach, describe, expect, mock, test } from "bun:test";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const locale: AppLocale = "ar";
const auditT = readTranslation(Translation.Dashboard.ClassAudit, locale);
const commonLabels = readTranslation(Translation.Common, locale);

await mockNextNavigation("/dashboard");

// Avoid nav-config / sidebar label resolution inside MobilePageHeader breadcrumbs.
await mock.module("@/frontend/common/views/dashboard/lib/usePageBreadcrumbs", () => ({
  usePageBreadcrumbs: () => [],
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { ClassAuditView } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditView";
import type { ClassAuditViewModel } from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel";
import {
  buildClassAuditViewLabels,
  CLASS_AUDIT_CLASS_NAME,
  classAuditFixture,
  noopHandler,
} from "@/test/ui/components/fixtures/classAuditFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function buildViewModel(overrides: Partial<ClassAuditViewModel>): ClassAuditViewModel {
  return {
    status: "loading",
    audit: null,
    labels: {},
    onGenerateReport: noopHandler,
    onEditClass: noopHandler,
    onExportStudents: noopHandler,
    onViewStudent: noopHandler,
    onResendNotifications: noopHandler,
    onUpdateAdminNote: noopHandler,
    onEditAdminNote: noopHandler,
    isResending: false,
    onRetry: noopHandler,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("ClassAuditView shell states", () => {
  test("renders a loading indicator while the audit query is in flight", () => {
    const { container } = renderWithWrapper(<ClassAuditView {...buildViewModel({ status: "loading" })} />, {
      locale,
      viewport: "mobile",
    });

    expect(container.querySelector(".MuiCircularProgress-root")).toBeTruthy();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(CLASS_AUDIT_CLASS_NAME)).not.toBeInTheDocument();
  });

  test("renders an error alert with a retry action that re-triggers the query", () => {
    const onRetry = mock(() => {});
    renderWithWrapper(<ClassAuditView {...buildViewModel({ status: "error", onRetry })} />, {
      locale,
      viewport: "mobile",
    });

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain(commonLabels.loadFailed);

    const retryButton = screen.getByRole("button", { name: commonLabels.retry });
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("renders an error alert without a retry action for an invalid class id", () => {
    renderWithWrapper(<ClassAuditView {...buildViewModel({ status: "invalidId" })} />, {
      locale,
      viewport: "mobile",
    });

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain(commonLabels.loadFailed);
    expect(screen.queryByRole("button", { name: commonLabels.retry })).not.toBeInTheDocument();
  });

  test("renders the lazy tier view once the audit payload is ready", async () => {
    const viewModel = buildViewModel({
      status: "ready",
      audit: classAuditFixture,
      labels: buildClassAuditViewLabels(auditT, classAuditFixture),
    });

    renderWithWrapper(<ClassAuditView {...viewModel} />, { locale, viewport: "mobile" });

    const titleMatches = await screen.findAllByText(CLASS_AUDIT_CLASS_NAME);
    expect(titleMatches.length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
