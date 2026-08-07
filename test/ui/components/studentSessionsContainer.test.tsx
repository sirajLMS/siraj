import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({
    push: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    replace: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/students/sessions",
  useSearchParams: () => new URLSearchParams(),
  redirect: () => {},
}));

mock.module("@/shared/i18n/routing", () => ({
  locales: ["ar", "en"] as const,
  defaultLocale: "en",
  useRouter: () => ({
    push: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    replace: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/students/sessions",
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  redirect: () => {},
}));

mock.module("@/shared/i18n/navigation", () => ({
  useRouter: () => ({
    push: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    replace: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  usePathname: () => "/students/sessions",
}));

mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
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
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const HISTORY_YEAR = 2026;
const HISTORY_MONTH = 7;
const studentId = "student-sessions-1";

function StudentSessionsContainerImpl() {
  const viewModel = useStudentSessionsViewModel({});
  return <StudentSessionsDesktopView {...viewModel} />;
}

const profileMockData = {
  studentProfile: {
    id: studentId,
    name: "Ahmed Student",
    status: "ACTIVE",
    avatarUrl: null,
    dateOfBirth: null,
    gender: null,
    language: null,
    email: null,
    phone: null,
    parentId: null,
    parentUserId: null,
    parentName: null,
    parentEmail: null,
    parentPhone: null,
    isAssociatedViewer: true,
    primaryTeacherId: "teacher-1",
    teacherUserId: "teacher-1",
    teacherName: "Ustadh Yusuf",
    hoursPerWeek: 4,
    classesRemaining: 12,
    classesTotal: 16,
    version: 1,
    createdAt: null,
    updatedAt: null,
    upcomingClasses: null,
    classHistory: null,
  },
};

const historyMockData = {
  studentClassHistory: {
    id: "history-1",
    studentName: "Ahmed Student",
    metrics: {
      totalClasses: 3,
      attendanceRate: 90,
      hoursStudied: 4.5,
      performance: 85,
    },
    sessions: [
      {
        id: "session-1",
        title: "Quran Recitation",
        time: "2026-07-10T10:00:00.000Z",
        duration: 60,
        status: "COMPLETED",
        outcome: "TAKEN",
        isFrozen: false,
        instructor: "Ustadh Yusuf",
        teacherId: "teacher-1",
        timeSlot: "10:00",
        room: null,
        notes: "Strong progress",
        dayOfMonth: 10,
        meetingJoinUrl: "https://meet.example.com/session-1",
        effectiveMeeting: null,
      },
      {
        id: "session-2",
        title: "Tajweed",
        time: "2026-07-12T11:00:00.000Z",
        duration: 45,
        status: "COMPLETED",
        outcome: "TAKEN",
        isFrozen: false,
        instructor: "Ustadh Yusuf",
        teacherId: "teacher-1",
        timeSlot: "11:00",
        room: null,
        notes: null,
        dayOfMonth: 12,
        meetingJoinUrl: null,
        effectiveMeeting: null,
      },
    ],
  },
};

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

    expect(screen.getAllByLabelText("Previous month").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("Next month").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByLabelText("Filter by Subject")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by Status")).toBeInTheDocument();

    expect(screen.getAllByText("Sessions").length).toBeGreaterThanOrEqual(1);

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

    expect(screen.getAllByText("Ended").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("COMPLETED")).not.toBeInTheDocument();
  });
});
