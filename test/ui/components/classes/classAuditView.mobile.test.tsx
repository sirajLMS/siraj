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

import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { ClassAuditViewMobile } from "@/frontend/mobile/views/dashboard/classes/audit/classAuditView.mobile";
import {
  buildClassAuditViewLabels,
  CLASS_AUDIT_CLASS_NAME,
  classAuditFixture,
  noopHandler,
} from "@/test/ui/components/fixtures/classAuditFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function buildProps(overrides: Partial<ClassAuditViewProps> = {}): ClassAuditViewProps {
  return {
    audit: classAuditFixture,
    labels: buildClassAuditViewLabels(auditT, classAuditFixture, commonLabels.cancel),
    onGenerateReport: noopHandler,
    onEditClass: noopHandler,
    onExportStudents: noopHandler,
    onViewStudent: noopHandler,
    onResendNotifications: noopHandler,
    onUpdateAdminNote: noopHandler,
    onEditAdminNote: noopHandler,
    isResending: false,
    payroll: null,
    statusEvents: null,
    onOverride: noopHandler,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("ClassAuditViewMobile", () => {
  test("renders the page header with the class name and localized breadcrumbs", () => {
    renderWithWrapper(<ClassAuditViewMobile {...buildProps()} />, { locale, viewport: "mobile" });

    expect(screen.getAllByText(CLASS_AUDIT_CLASS_NAME).length).toBeGreaterThan(0);
    expect(screen.getByText(auditT.breadcrumbs.dashboard)).toBeInTheDocument();
    expect(screen.getByText(auditT.breadcrumbs.schedules)).toBeInTheDocument();
    expect(screen.getByText(auditT.breadcrumbs.current)).toBeInTheDocument();
  });

  test("renders the generate-report and edit-class actions in the header", () => {
    const onGenerateReport = mock(() => {});
    const onEditClass = mock(() => {});
    renderWithWrapper(<ClassAuditViewMobile {...buildProps({ onGenerateReport, onEditClass })} />, {
      locale,
      viewport: "mobile",
    });

    const generateReportButton = document.getElementById("audit-generate-report-btn");
    const editClassButton = document.getElementById("audit-edit-class-btn");
    expect(generateReportButton).not.toBeNull();
    expect(editClassButton).not.toBeNull();

    if (!generateReportButton || !editClassButton) {
      throw new Error("header action buttons should exist");
    }

    fireEvent.click(generateReportButton);
    fireEvent.click(editClassButton);
    expect(onGenerateReport).toHaveBeenCalledTimes(1);
    expect(onEditClass).toHaveBeenCalledTimes(1);
  });

  test("renders the localized rescheduled status badge", () => {
    renderWithWrapper(<ClassAuditViewMobile {...buildProps()} />, { locale, viewport: "mobile" });

    const badgeMatches = screen.getAllByText(auditT.status.regularRescheduled);
    expect(badgeMatches.length).toBeGreaterThan(0);
  });
});
