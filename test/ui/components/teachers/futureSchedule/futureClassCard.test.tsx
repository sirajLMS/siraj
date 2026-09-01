import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/teachers/future-schedule", { locale: "ar" });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import type { TeacherFutureScheduleQuery_teacherFutureSchedule_classes as FutureClass } from "@/frontend/common/graphql/generated/gql/graphql";
import type { FutureClassCardProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { FutureClassCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/futureClassCard.desktop";
import { FutureClassCardMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/futureClassCard.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.TeacherFutureSchedule, locale);

function makeItem(overrides: Partial<FutureClass> = {}): FutureClass {
  return {
    id: "class-instance-1",
    courseName: "Algebra Basics",
    scheduledDate: "2026-09-01",
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    isRescheduled: false,
    leaveRequestDisabled: false,
    leaveRequestDisabledReason: null,
    studentCount: 12,
    location: "Room A",
    subjectId: "subject-1",
    subjectName: "Mathematics",
    classType: null,
    executionState: null,
    outcome: null,
    avatarUrl: null,
    effectiveMeeting: null,
    ...overrides,
  };
}

const TIER_CARDS = [
  { name: "desktop", Card: FutureClassCardDesktop, viewport: "desktop" },
  { name: "mobile", Card: FutureClassCardMobile, viewport: "mobile" },
] as const;

function renderCard(
  Card: ComponentType<FutureClassCardProps>,
  viewport: "desktop" | "mobile",
  overrides: Partial<FutureClass> = {},
  onRequestLeave?: () => void
) {
  return renderWithWrapper(<Card item={makeItem(overrides)} labels={labels} onRequestLeave={onRequestLeave} />, {
    locale,
    viewport,
  });
}

afterEach(() => {
  cleanup();
});

describe("FutureClassCard action presets", () => {
  for (const { name, Card, viewport } of TIER_CARDS) {
    test(`${name}: quota-disabled leave renders the outlined preset disabled with the quota label`, () => {
      const onRequestLeave = mock(() => {});
      const { container } = renderCard(
        Card,
        viewport,
        { leaveRequestDisabled: true, leaveRequestDisabledReason: "quota" },
        onRequestLeave
      );

      const leaveButton = screen.getByRole("button", { name: labels.quotaReached });
      expect(leaveButton).toBeDisabled();
      expect(leaveButton.className).toContain("MuiButton-outlined");
      expect(container.querySelector("[data-testid='BlockOutlinedIcon']")).not.toBeNull();

      fireEvent.click(leaveButton);
      expect(onRequestLeave).not.toHaveBeenCalled();
    });

    test(`${name}: enabled leave renders the outlined preset and fires onRequestLeave`, () => {
      const onRequestLeave = mock(() => {});
      const { container } = renderCard(Card, viewport, {}, onRequestLeave);

      const leaveButton = screen.getByRole("button", { name: labels.requestLeave });
      expect(leaveButton).toBeEnabled();
      expect(leaveButton.className).toContain("MuiButton-outlined");
      expect(container.querySelector("[data-testid='EventBusyOutlinedIcon']")).not.toBeNull();

      fireEvent.click(leaveButton);
      expect(onRequestLeave).toHaveBeenCalledTimes(1);
    });

    test(`${name}: view-materials renders the contained preset disabled with the tooltip wrapper`, () => {
      renderCard(Card, viewport);

      const materialsButton = screen.getByRole("button", { name: labels.viewMaterials });
      expect(materialsButton).toBeDisabled();
      expect(materialsButton.className).toContain("MuiButton-contained");
      // The disabled button stays wrapped in a span so the tooltip stays anchored on hover.
      expect(materialsButton.parentElement?.tagName).toBe("SPAN");
    });
  }
});
