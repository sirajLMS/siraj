import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { getStatusColors } from "@/frontend/common/components/ui/badge/statusBadgeShared.utils";
import { createAppTheme } from "@/frontend/common/providers/theme/theme";
import { ClassInstanceDetailsCard } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard";
import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.ClassDetails, locale);

// Matches the TestWrapper defaults (dark theme, RTL for "ar").
const theme = createAppTheme("dark", "rtl", locale);

const labels = {
  classInstanceDetails: t.instanceDetails.classInstanceDetails,
  studentName: t.instanceDetails.studentName,
  courseModule: t.instanceDetails.courseModule,
  startTime: t.instanceDetails.startTime,
  endTime: t.instanceDetails.endTime,
  duration: t.instanceDetails.duration,
  status: t.instanceDetails.status,
  viewSubject: t.instanceDetails.viewSubject,
  minutes: t.metadata.minutes,
  statusLabels: {
    active: t.status.active,
    scheduled: t.status.scheduled,
    pending: t.status.pending,
    completed: t.status.completed,
    cancelled: t.status.cancelled,
  },
  rateSectionTitle: t.instanceDetails.rateSectionTitle,
  effectiveRateLabel: t.instanceDetails.effectiveRateLabel,
  rateCurrencyLabel: t.instanceDetails.rateCurrencyLabel,
  rateSourceLabel: t.instanceDetails.rateSourceLabel,
  rateSourceOverride: t.instanceDetails.rateSourceOverride,
  rateSourceRecurring: t.instanceDetails.rateSourceRecurring,
  rateSourceSubject: t.instanceDetails.rateSourceSubject,
  rateSourceTeacher: t.instanceDetails.rateSourceTeacher,
};

// Class-instance lifecycle status → the badge status token of the `session` category.
const STATUS_CASES: ReadonlyArray<{ readonly status: ClassInstanceStatus; readonly badgeStatus: string }> = [
  { status: "active", badgeStatus: "active" },
  { status: "scheduled", badgeStatus: "confirmed" },
  { status: "pending", badgeStatus: "pending" },
  { status: "completed", badgeStatus: "completed" },
  { status: "cancelled", badgeStatus: "cancelled" },
];

afterEach(() => {
  cleanup();
});

function renderCard(status: ClassInstanceStatus) {
  return render(
    <ClassInstanceDetailsCard
      studentId="student-1"
      studentName="Layla Hassan"
      courseModule="Algebra I"
      subjectId="subject-1"
      subjectName="Mathematics"
      startTime="10:00"
      endTime="11:00"
      durationMinutes={60}
      status={status}
      rateAmount={null}
      rateCurrency={null}
      rateSource={null}
      isRateOverridden={false}
      labels={labels}
    />,
    {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    }
  );
}

describe("ClassInstanceDetailsCard", () => {
  describe("StatusBadge (session category)", () => {
    for (const { status, badgeStatus } of STATUS_CASES) {
      test(`renders "${status}" label as session badge with expected theme-token colors`, () => {
        renderCard(status);

        const labelText = labels.statusLabels[status];
        const labelElement = screen.getByText(labelText);
        const badgeElement = labelElement.parentElement;
        if (!badgeElement) {
          throw new Error(`Badge container for status "${status}" not found`);
        }

        const expected = getStatusColors(theme, "session", badgeStatus);
        const computed = getComputedStyle(badgeElement);
        expect(computed.backgroundColor).toBe(expected.backgroundColor);
        expect(computed.color).toBe(expected.color);
      });
    }
  });

  test("renders status field label alongside the badge", () => {
    renderCard("active");
    expect(screen.getByText(labels.status)).toBeInTheDocument();
    expect(screen.getByText(labels.statusLabels.active)).toBeInTheDocument();
  });
});
