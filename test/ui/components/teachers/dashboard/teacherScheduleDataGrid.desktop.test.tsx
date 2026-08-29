import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/");

await mock.module("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import { TeacherScheduleDataGridDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleDataGrid.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const teacherDashboardT = readTranslation(Translation.Dashboard.TeacherDashboard, locale);
const adminDashboardT = readTranslation(Translation.Dashboard.Admin, locale);
const meetingConfigT = readTranslation(Translation.Ui.MeetingConfig, locale);
const meetingUrlStatusT = readTranslation(Translation.Dashboard.MeetingUrlStatus, locale);

const labels = buildTeacherDashboardLabels(teacherDashboardT, adminDashboardT, meetingConfigT.join.emptyTeacher);

function noop(): void {
  // Intentional no-op for props whose behavior is out of scope for a given test.
}

function makeRow(overrides: Partial<TeacherScheduleRow> = {}): TeacherScheduleRow {
  return {
    id: "class-instance-1",
    rowNumber: 1,
    classId: "class-1",
    studentName: "Layla Hassan",
    studentInitials: "LH",
    timeRange: "09:00 — 10:00",
    status: "upcoming",
    videoEnabled: true,
    activateEnabled: false,
    meetingJoinUrl: "https://meet.example.com/abc",
    meetingUrlStatus: "generated",
    ...overrides,
  };
}

function renderGrid(
  options: {
    readonly rows?: readonly TeacherScheduleRow[];
    readonly serverPagination?: boolean;
    readonly onPageChange?: (page: number) => void;
    readonly permissions?: AppPermission[];
  } = {}
) {
  const useServer = options.serverPagination ?? true;
  return renderWithWrapper(
    <TeacherScheduleDataGridDesktop
      rows={options.rows ?? [makeRow(), makeRow({ id: "class-instance-2", rowNumber: 2 })]}
      labels={labels}
      instanceStatusLabels={labels.instanceStatusLabels}
      canActivate={false}
      emptyMessage={labels.schedule.noEntries}
      page={0}
      pageSize={10}
      totalCount={useServer ? 25 : undefined}
      onPageChange={useServer ? (options.onPageChange ?? noop) : undefined}
    />,
    { locale, permissions: options.permissions }
  );
}

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

describe("TeacherScheduleDataGridDesktop server pagination (regression)", () => {
  test("drives the footer from totalCount, not from the rendered row slice", async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getByText(adminDashboardT.paginationRange(1, 10, 25))).toBeInTheDocument();
      expect(screen.getByText(adminDashboardT.pageOf(1, 3))).toBeInTheDocument();
    });
  });

  test("forwards page navigation to onPageChange", async () => {
    const onPageChange = mock((_page: number) => undefined);
    const { container } = renderGrid({ onPageChange });

    await waitFor(() => {
      expect(container.querySelector(`[aria-label="${adminDashboardT.nextPage}"] button`)).not.toBeNull();
    });
    const nextButton = container.querySelector(`[aria-label="${adminDashboardT.nextPage}"] button`);
    if (!nextButton) {
      throw new Error("next page button not found in grid pager");
    }
    fireEvent.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  test("falls back to client-mode pagination when totalCount/onPageChange are omitted", async () => {
    renderGrid({ serverPagination: false });

    await waitFor(() => {
      expect(screen.getByText(adminDashboardT.paginationRange(1, 2, 2))).toBeInTheDocument();
      expect(screen.getByText(adminDashboardT.pageOf(1, 1))).toBeInTheDocument();
    });
  });
});

describe("TeacherScheduleDataGridDesktop meeting URL permission gate (regression)", () => {
  test("renders the gated fallback cell (no copy action) without meeting-config permissions", () => {
    renderGrid({ rows: [makeRow()], permissions: [] });

    expect(screen.queryByRole("button", { name: meetingUrlStatusT.copyUrl })).toBeNull();
    expect(screen.getAllByRole("button", { name: labels.actions.joinVideo }).length).toBeGreaterThan(0);
  });

  test("renders the copy action when MeetingConfigsManageOwn is granted", () => {
    renderGrid({ rows: [makeRow()], permissions: [AppPermission.MeetingConfigsManageOwn] });

    expect(screen.getByRole("button", { name: meetingUrlStatusT.copyUrl })).toBeInTheDocument();
  });

  test("renders the copy action when MeetingConfigsManageClass is granted", () => {
    renderGrid({ rows: [makeRow()], permissions: [AppPermission.MeetingConfigsManageClass] });

    expect(screen.getByRole("button", { name: meetingUrlStatusT.copyUrl })).toBeInTheDocument();
  });
});
