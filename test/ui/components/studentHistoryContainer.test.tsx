// Defensive mocks against bleed from earlier test files (Bun mock.module is process-global).
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
  usePathname: () => "/students/me/history",
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
  usePathname: () => "/students/me/history",
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
  usePathname: () => "/students/me/history",
}));

mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import { afterEach, describe, expect, mock, test } from "bun:test";
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
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const HISTORY_YEAR = 2026;
const HISTORY_MONTH = 7;
const studentId = "student-history-1";

/**
 * Production-shaped desktop container for tests.
 * Bypasses ResponsiveViewSwitch / next/dynamic (not preloaded for this view).
 */
function StudentHistoryContainerImpl() {
  const viewModel = useStudentHistoryViewModel({});
  return <StudentHistoryDesktopView {...viewModel} />;
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
        variables: { studentId: null, year: null, month: null },
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
  test("renders month nav, metrics, filters, and class sessions", async () => {
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

    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument();

    expect(screen.getByText("Total Classes")).toBeInTheDocument();
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Attendance Rate")).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("Hours Studied")).toBeInTheDocument();
    expect(screen.getByText("4.5h")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();

    expect(screen.getByLabelText("Filter by Subject")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by Status")).toBeInTheDocument();

    expect(screen.getAllByText("Lesson History").length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(screen.getAllByText("Quran Recitation").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText("Tajweed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Ustadh Yusuf").length).toBeGreaterThanOrEqual(1);
  });
});
