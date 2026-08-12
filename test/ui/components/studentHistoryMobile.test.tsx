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

import { studentClassHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-history.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentPortalHistoryStore } from "@/frontend/common/stores/studentPortalHistoryStore";
import { useStudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import { StudentHistoryMobileView } from "@/frontend/mobile/views/dashboard/student/history/studentHistory.mobile";
import {
  createProfileMockData,
  createSingleSessionHistoryMockData,
  HISTORY_MONTH,
  HISTORY_YEAR,
} from "@/test/ui/components/fixtures/studentHistoryFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const studentId = "student-history-mobile-1";

function StudentHistoryMobileContainerImpl() {
  const viewModel = useStudentHistoryViewModel({});
  return <StudentHistoryMobileView {...viewModel} />;
}

const profileMockData = createProfileMockData(studentId);

const historyMockData = createSingleSessionHistoryMockData();

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

describe("StudentHistoryMobileView", () => {
  test("renders day tabs, schedule header, and session card for selected day", async () => {
    useStudentPortalHistoryStore.setState({
      year: HISTORY_YEAR,
      month: HISTORY_MONTH,
      selectedDay: 10,
      selectedWeek: 1,
      subjectFilter: "",
      statusFilter: "",
    });

    renderWithWrapper(<StudentHistoryMobileContainerImpl />, {
      locale: "en",
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "mobile",
    });

    await waitFor(() => {
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    expect(screen.getByText("Schedule for Fri, July 10")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Quran Recitation").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText("Ustadh Yusuf").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Ended").length).toBeGreaterThanOrEqual(1);
  });
});
