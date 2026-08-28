import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

expect.extend(matchers);

import { ClassExecutionState, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { StatusAction } from "@/frontend/common/views/dashboard/classes/status/tracking/StatusBadgeAction";
import type {
  StatusActionLabels,
  StatusTrackingScheduleRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.CoreStatusTracking, locale);

const labels: StatusActionLabels = {
  joinSession: t.actions.joinSession,
  activate: t.actions.activate,
  reschedule: t.actions.reschedule,
  verifyDocuments: t.actions.verifyDocuments,
  administrativeHold: t.administrativeHold,
  holdDescription: t.holdDescription,
};

const ROW_ID = "row-42";

function buildRow(overrides: Partial<StatusTrackingScheduleRow>): StatusTrackingScheduleRow {
  return {
    id: ROW_ID,
    studentId: "student-1",
    studentName: "Test Student",
    studentInitials: "TS",
    studentAvatarUrl: null,
    studentStatus: null,
    teacherId: null,
    teacherName: null,
    teacherAvatarUrl: null,
    courseName: null,
    avatarUrl: null,
    scheduledStartAt: null,
    scheduledEndAt: null,
    durationMinutes: null,
    executionState: null,
    outcome: null,
    isFrozen: null,
    meetingJoinUrl: null,
    effectiveMeeting: null,
    ...overrides,
  };
}

function createHandlers() {
  return {
    onActivate: mock((_id: string) => undefined),
    onReschedule: mock((_id: string) => undefined),
    onVerify: mock((_id: string) => undefined),
  };
}

function renderStatusAction(row: StatusTrackingScheduleRow) {
  const handlers = createHandlers();
  const result = renderWithWrapper(<StatusAction row={row} labels={labels} {...handlers} />, { locale });
  return { handlers, container: result.container };
}

describe("StatusAction", () => {
  test("renders nothing for a regular session", () => {
    renderStatusAction(buildRow({ executionState: ClassExecutionState.Running }));

    expect(screen.queryByRole("button")).toBeNull();
  });

  test("renders disabled activate button for suspended accounts", () => {
    renderStatusAction(buildRow({ studentStatus: StudentStatus.Suspended }));

    const activateButton = document.getElementById(`activate-session-${ROW_ID}`);
    expect(activateButton).not.toBeNull();
    expect(activateButton).toBeDisabled();
    expect(activateButton).toHaveTextContent(labels.activate);
  });

  test("shows administrative hold tooltip on the disabled activate button", async () => {
    renderStatusAction(buildRow({ studentStatus: StudentStatus.Suspended }));

    const activateButton = document.getElementById(`activate-session-${ROW_ID}`);
    if (!activateButton) throw new Error("activate button should be rendered");
    const tooltipTarget = activateButton.parentElement;
    if (!tooltipTarget) throw new Error("activate button should be wrapped in a tooltip target");

    const user = userEvent.setup();
    await user.hover(tooltipTarget);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(labels.administrativeHold);
    expect(tooltip).toHaveTextContent(labels.holdDescription);
  });

  test("clicking reschedule calls onReschedule with the row id for on-leave students", async () => {
    const { handlers } = renderStatusAction(buildRow({ studentStatus: StudentStatus.OnLeave }));

    const rescheduleButton = document.getElementById(`reschedule-session-${ROW_ID}`);
    if (!rescheduleButton) throw new Error("reschedule button should be rendered");
    expect(rescheduleButton).toHaveTextContent(labels.reschedule);

    const user = userEvent.setup();
    await user.click(rescheduleButton);

    expect(handlers.onReschedule).toHaveBeenCalledWith(ROW_ID);
  });

  test("clicking verify calls onVerify with the row id for pending verification sessions", async () => {
    const { handlers } = renderStatusAction(buildRow({ executionState: ClassExecutionState.NotActivated }));

    const verifyButton = document.getElementById(`verify-session-${ROW_ID}`);
    if (!verifyButton) throw new Error("verify button should be rendered");
    expect(verifyButton).toHaveTextContent(labels.verifyDocuments);

    const user = userEvent.setup();
    await user.click(verifyButton);

    expect(handlers.onVerify).toHaveBeenCalledWith(ROW_ID);
  });
});
