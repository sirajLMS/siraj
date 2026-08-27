import { afterEach, describe, expect, test } from "bun:test";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "ar";
const auditT = readTranslation(Translation.Dashboard.ClassAudit, locale);

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { ClassAuditDetailsCard } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard";
import { buildDetailsLabels } from "@/frontend/common/views/dashboard/classes/audit/utils";
import {
  buildClassAuditViewLabels,
  CLASS_AUDIT_CLASS_NAME,
  classAuditFixture,
} from "@/test/ui/components/fixtures/classAuditFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function renderDetailsCard() {
  const labels = buildDetailsLabels(buildClassAuditViewLabels(auditT, classAuditFixture));
  return renderWithWrapper(<ClassAuditDetailsCard audit={classAuditFixture} labels={labels} />, { locale });
}

afterEach(() => {
  cleanup();
});

describe("ClassAuditDetailsCard", () => {
  test("renders the localized rescheduled status badge in the header bar", () => {
    renderDetailsCard();

    expect(screen.getByText(auditT.status.regularRescheduled)).toBeInTheDocument();
  });

  test("renders the class name and audit trail title", () => {
    renderDetailsCard();

    expect(screen.getByText(CLASS_AUDIT_CLASS_NAME)).toBeInTheDocument();
    expect(screen.getByText(auditT.auditTrail.title)).toBeInTheDocument();
  });
});
