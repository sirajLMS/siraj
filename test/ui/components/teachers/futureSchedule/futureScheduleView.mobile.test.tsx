import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { TeacherFutureScheduleQuery_teacherFutureSchedule_classes as FutureClass } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MobileCardListProps } from "@/frontend/mobile/components/ui/container/MobileCardList";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/teachers/schedule/future", { locale: "ar" });

type CapturedCardListProps = MobileCardListProps<FutureClass>;

let capturedListProps: CapturedCardListProps | null = null;

// Intercept the list primitive so the wiring contract (rows, key function,
// pagination mode) is asserted directly instead of through rendered DOM.
await mock.module("@/frontend/mobile/components/ui/container/MobileCardList", () => ({
  MobileCardList: (props: CapturedCardListProps) => {
    capturedListProps = props;
    return null;
  },
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import { isValidElement, type ReactNode } from "react";
import type { FutureClassCardProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { FutureScheduleViewMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/futureScheduleView.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.TeacherFutureSchedule, locale);

function makeFutureClass(id: string): FutureClass {
  return {
    id,
    courseName: null,
    scheduledDate: "2026-09-01",
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    isRescheduled: false,
    leaveRequestDisabled: false,
    leaveRequestDisabledReason: null,
    studentCount: 1,
    location: "Online",
    subjectId: null,
    subjectName: null,
    classType: null,
    executionState: null,
    outcome: null,
    avatarUrl: null,
    effectiveMeeting: null,
  };
}

function renderMobileView(rows: readonly FutureClass[]) {
  return renderWithWrapper(
    <FutureScheduleViewMobile
      classes={rows}
      leaveQuotaUsed={0}
      leaveQuotaTotal={5}
      totalClasses={rows.length}
      onRequestLeave={async () => {}}
      selectedDate="2026-09-01"
      onDateChange={() => {}}
      notes={[]}
      contact={null}
      classDates={[]}
      loading={false}
      error={null}
      onSupportContact={async () => {}}
      labelsBySection={{
        schedule: labels,
        supportContact: { supportContact: labels.supportContact, contactAdmin: labels.contactAdmin },
      }}
    />,
    { locale, viewport: "mobile" }
  );
}

function requireCaptured(): CapturedCardListProps {
  if (!capturedListProps) {
    throw new Error("MobileCardList was not rendered");
  }
  return capturedListProps;
}

beforeEach(() => {
  capturedListProps = null;
});

afterEach(() => {
  cleanup();
});

describe("FutureScheduleViewMobile class list ownership", () => {
  test("feeds the full class collection to MobileCardList with client-side pagination", async () => {
    const rows = [makeFutureClass("class-1"), makeFutureClass("class-2")];
    renderMobileView(rows);

    expect(await screen.findByText(labels.pageTitle)).toBeInTheDocument();

    const captured = requireCaptured();
    expect(captured.rows).toBe(rows);
    expect(captured.paginationOptions).toEqual({ mode: "client" });
  });

  test("keys each rendered item by the class id", () => {
    const rows = [makeFutureClass("class-1"), makeFutureClass("class-2"), makeFutureClass("class-3")];
    renderMobileView(rows);

    const captured = requireCaptured();
    for (const row of rows) {
      if (!row.id) {
        throw new Error("Fixture row must have an id");
      }
      expect(captured.getKey(row)).toBe(row.id);
    }
  });

  test("renderItem produces the future class card bound to the row", () => {
    const rows = [makeFutureClass("class-1")];
    renderMobileView(rows);

    const captured = requireCaptured();
    const [firstRow] = rows;
    if (!firstRow) {
      throw new Error("Fixture row missing");
    }
    const rendered: ReactNode = captured.renderItem(firstRow, 0);
    if (!isValidElement<FutureClassCardProps>(rendered)) {
      throw new Error("renderItem did not return a React element");
    }
    expect(rendered.props.item).toBe(firstRow);
    expect(rendered.props.labels).toBe(labels);
  });
});
