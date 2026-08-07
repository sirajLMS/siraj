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
  usePathname: () => "/students/history",
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
  usePathname: () => "/students/history",
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
  usePathname: () => "/students/history",
}));

mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
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
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const HISTORY_YEAR = 2026;
const HISTORY_MONTH = 7;
const studentId = "student-history-mobile-1";

function StudentHistoryMobileContainerImpl() {
  const viewModel = useStudentHistoryViewModel({});
  return <StudentHistoryMobileView {...viewModel} />;
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
      totalClasses: 2,
      attendanceRate: 90,
      hoursStudied: 2,
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
        notes: null,
        dayOfMonth: 10,
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
