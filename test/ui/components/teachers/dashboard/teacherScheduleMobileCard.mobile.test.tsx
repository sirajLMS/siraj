import { afterEach, describe, expect, mock, test } from "bun:test";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "ar";
const teacherDashboardT = readTranslation(Translation.Dashboard.TeacherDashboard, locale);
const adminDashboardT = readTranslation(Translation.Dashboard.Admin, locale);
const meetingConfigT = readTranslation(Translation.Ui.MeetingConfig, locale);

// Leaf display cell stub: the meeting URL cell owns its own translation and
// clipboard concerns; this suite targets the card shell, accent, dimmed, and
// session-action branches.
await mock.module("@/frontend/common/components/ui/display/meetingConfig/MeetingUrlCell", () => ({
  MeetingUrlCell: () => <div data-testid="meeting-url-cell" />,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, type RenderResult, within } from "@testing-library/react";

expect.extend(matchers);

import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import { createAppTheme } from "@/frontend/common/providers/theme/theme";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import { TeacherScheduleMobileCard } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleMobileCard.mobile";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const labels: TeacherDashboardViewLabels = buildTeacherDashboardLabels(
  teacherDashboardT,
  adminDashboardT,
  meetingConfigT.join.emptyTeacher
);

const theme = createAppTheme("dark", "rtl", locale);

const ACCENT_WIDTH_CSS = "border-inline-start: 4px solid";

function makeRow(overrides: Partial<TeacherScheduleRow> = {}): TeacherScheduleRow {
  return {
    id: "class-1",
    rowNumber: 1,
    classId: "class-1",
    studentName: "سارة أحمد",
    studentInitials: "س أ",
    timeRange: "10:00 - 11:00",
    status: "pending",
    executionState: ClassExecutionState.NotActivated,
    outcome: ClassOutcome.Pending,
    videoEnabled: true,
    activateEnabled: false,
    ...overrides,
  };
}

function hasCssRules(sheet: StyleSheet | null): sheet is CSSStyleSheet {
  return sheet !== null && "cssRules" in sheet;
}

/** Resolves the Emotion rule text for the matched classes of an element. */
function resolveEmotionRuleText(element: Element): string {
  const classes = Array.from(element.classList);
  const matched: string[] = [];
  for (const styleEl of Array.from(document.querySelectorAll("style"))) {
    const sheet = styleEl.sheet;
    if (!hasCssRules(sheet)) continue;
    for (const rule of Array.from(sheet.cssRules)) {
      if (classes.some(className => rule.cssText.includes(`.${className}`))) {
        matched.push(rule.cssText);
      }
    }
  }
  return matched.join("\n");
}

function renderCard(row: TeacherScheduleRow, canActivate = false): RenderResult {
  return renderWithWrapper(<TeacherScheduleMobileCard row={row} labels={labels} canActivate={canActivate} />, {
    locale,
  });
}

function getCardPaper(result: RenderResult): Element {
  // The student name renders twice inside the card (header link + info row);
  // either occurrence leads to the same card-root Paper.
  const [firstNameNode] = within(result.container).getAllByText("سارة أحمد");
  if (!firstNameNode) throw new Error("student name not found in card");
  const paper = firstNameNode.closest(".MuiPaper-root");
  if (!paper) throw new Error("card root Paper not found");
  return paper;
}

afterEach(() => {
  cleanup();
});

describe("TeacherScheduleMobileCard shell states", () => {
  test("live row renders LIVE NOW tag, status badge and session controls with a primary accent border", () => {
    const liveRow = makeRow({
      status: "active",
      executionState: ClassExecutionState.Running,
      outcome: ClassOutcome.Pending,
      isLive: true,
      studentId: "student-1",
      meetingJoinUrl: null,
    });
    const result = renderCard(liveRow, true);
    const card = within(result.container);

    expect(card.getByText(labels.activeControls.liveNow)).toBeVisible();
    expect(card.getAllByText(labels.status.active).length).toBeGreaterThan(0);
    expect(card.getByText(labels.activeControls.sessionControls)).toBeVisible();
    expect(card.getByRole("button", { name: labels.activeControls.markAbsent })).toBeInTheDocument();
    expect(card.getByRole("button", { name: labels.activeControls.requestLeave })).toBeInTheDocument();
    expect(card.getByTestId("meeting-url-cell")).toBeInTheDocument();

    const ruleText = resolveEmotionRuleText(getCardPaper(result));
    expect(ruleText).toContain(`${ACCENT_WIDTH_CSS} ${theme.palette.primary.main}`);
    expect(ruleText).toContain("opacity: 1");
  });

  test("completed row is dimmed via the shared list-item shell and shows the session-ended action", () => {
    const completedRow = makeRow({
      status: "completed",
      executionState: ClassExecutionState.Completed,
      outcome: ClassOutcome.Taken,
    });
    const result = renderCard(completedRow);
    const card = within(result.container);

    const sessionEndedButton = card.getByRole("button", { name: labels.schedule.sessionEnded });
    expect(sessionEndedButton).toBeDisabled();

    const ruleText = resolveEmotionRuleText(getCardPaper(result));
    expect(ruleText).toContain("opacity: 0.7");
    expect(ruleText).not.toContain(ACCENT_WIDTH_CSS);
  });

  test("frozen row keeps the info accent border and renders the frozen action button", () => {
    const frozenRow = makeRow({ isFrozen: true, meetingJoinUrl: null });
    const result = renderCard(frozenRow);
    const card = within(result.container);

    // The frozen action button carries the contact-admin tooltip as its
    // accessible name, so locate it by its visible label instead.
    const frozenLabel = card.getByText(labels.schedule.frozen);
    const frozenButton = frozenLabel.closest("button");
    if (!frozenButton) throw new Error("frozen action button not found");
    expect(frozenButton).toBeDisabled();

    const ruleText = resolveEmotionRuleText(getCardPaper(result));
    expect(ruleText).toContain(`${ACCENT_WIDTH_CSS} ${theme.palette.info.main}`);
  });
});
