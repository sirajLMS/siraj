import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/students/sessions", {
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
import { useStudentSessionsViewModel } from "@/frontend/common/views/dashboard/student/sessions/useStudentSessionsViewModel";
import { StudentSessionsDesktopView } from "@/frontend/desktop/views/dashboard/student/sessions/studentSessions.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import {
  createProfileMockData,
  createTwoSessionHistoryMockData,
  HISTORY_MONTH,
  HISTORY_YEAR,
} from "@/test/ui/components/fixtures/studentHistoryFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.StudentPortalSessions, locale);

const studentId = "student-sessions-1";

function StudentSessionsContainerImpl() {
  const viewModel = useStudentSessionsViewModel({});
  return <StudentSessionsDesktopView {...viewModel} />;
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

describe("StudentSessionsContainer", () => {
  test("renders month nav, filters, and class sessions", async () => {
    useStudentPortalHistoryStore.setState({
      year: HISTORY_YEAR,
      month: HISTORY_MONTH,
      selectedDay: null,
      selectedWeek: 1,
      subjectFilter: "",
      statusFilter: "",
    });

    const expectedMonthLabel = formatMonthYear(new Date(HISTORY_YEAR, HISTORY_MONTH - 1, 1), "en");

    renderWithWrapper(<StudentSessionsContainerImpl />, {
      locale: "en",
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "desktop",
    });

    await waitFor(() => {
      expect(screen.getByText(expectedMonthLabel)).toBeInTheDocument();
    });

    expect(screen.getAllByLabelText(labels.previousMonth).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText(labels.nextMonth).length).toBeGreaterThanOrEqual(1);

    expect(screen.getByLabelText(labels.filterBySubject)).toBeInTheDocument();
    expect(screen.getByLabelText(labels.filterByStatus)).toBeInTheDocument();

    expect(screen.getAllByText(labels.pageTitle).length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(screen.getAllByText("Quran Recitation").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText("Tajweed").length).toBeGreaterThanOrEqual(1);
    await waitFor(() => {
      expect(screen.getAllByText("Ustadh Yusuf").length).toBeGreaterThanOrEqual(1);
    });

    const quranLinks = screen.getAllByRole("link", { name: /Quran Recitation/ });
    expect(quranLinks.some(link => link.getAttribute("href") === "/classes/session-1")).toBe(true);

    const tajweedLinks = screen.getAllByRole("link", { name: /Tajweed/ });
    expect(tajweedLinks.some(link => link.getAttribute("href") === "/classes/session-2")).toBe(true);

    expect(screen.getAllByText(labels.statusLabels.ended).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("COMPLETED")).not.toBeInTheDocument();
  });
});
