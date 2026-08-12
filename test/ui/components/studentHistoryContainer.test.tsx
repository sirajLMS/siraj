import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/students/history", {
  locales: ["ar", "en"],
  defaultLocale: "en",
});

await mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { formatMonthYear } from "@/frontend/common/components/intl/dateFormat";
import { studentClassHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-history.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentPortalHistoryStore } from "@/frontend/common/stores/studentPortalHistoryStore";
import { useStudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import { StudentHistoryDesktopView } from "@/frontend/desktop/views/dashboard/student/history/studentHistory.desktop";
import {
  createProfileMockData,
  createTwoSessionHistoryMockData,
  HISTORY_MONTH,
  HISTORY_YEAR,
} from "@/test/ui/components/fixtures/studentHistoryFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const studentId = "student-history-1";

function StudentHistoryContainerImpl() {
  const viewModel = useStudentHistoryViewModel({});
  return <StudentHistoryDesktopView {...viewModel} />;
}

const profileMockData = createProfileMockData(studentId);

const historyMockData = createTwoSessionHistoryMockData();

function createMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: studentProfileQueryDocument,
        variables: { studentId: null, year: null, month: null, includeUpcomingClasses: true },
      },
      result: { data: profileMockData },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
    {
      request: {
        query: studentClassHistoryQueryDocument,
        variables: {
          studentId,
          year: HISTORY_YEAR,
          month: HISTORY_MONTH,
        },
      },
      result: { data: historyMockData },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
  ];
}

afterEach(() => {
  cleanup();
  const now = new Date();
  useStudentPortalHistoryStore.setState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    selectedDay: null,
    selectedWeek: 1,
    subjectFilter: "",
    statusFilter: "",
  });
});

describe("StudentHistoryContainer", () => {
  test("renders month nav, metrics, and lesson history calendar", async () => {
    useStudentPortalHistoryStore.setState({
      year: HISTORY_YEAR,
      month: HISTORY_MONTH,
      selectedDay: null,
      selectedWeek: 1,
      subjectFilter: "",
      statusFilter: "",
    });

    const expectedMonthLabel = formatMonthYear(new Date(HISTORY_YEAR, HISTORY_MONTH - 1, 1), "en");

    renderWithWrapper(<StudentHistoryContainerImpl />, {
      locale: "en",
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "desktop",
    });

    await waitFor(() => {
      expect(screen.getByText(expectedMonthLabel)).toBeInTheDocument();
    });

    expect(screen.getAllByLabelText("Previous month").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("Next month").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Total Classes")).toBeInTheDocument();
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Attendance Rate")).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("Hours Studied")).toBeInTheDocument();
    expect(screen.getByText("4.5h")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();

    expect(screen.getAllByText("Lesson History").length).toBeGreaterThanOrEqual(1);

    expect(screen.queryByLabelText("Filter by Subject")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Filter by Status")).not.toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});
