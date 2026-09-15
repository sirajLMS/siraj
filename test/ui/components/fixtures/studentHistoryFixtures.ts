/**
 * Shared test fixtures for student history/sessions/profile component tests.
 *
 * Used by:
 * - test/ui/components/studentHistoryContainer.test.tsx
 * - test/ui/components/studentHistoryMobile.test.tsx
 * - test/ui/components/studentSessionsContainer.test.tsx
 * - test/ui/components/studentProfileContainer.test.tsx
 * - test/ui/components/students/studentHistoryBounds.mobile.test.tsx
 * - test/ui/components/students/studentHistoryBounds.desktop.test.tsx
 */

import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryViewModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StudentProfileFixture {
  readonly studentProfile: {
    readonly id: string;
    readonly name: string;
    readonly status: string;
    readonly avatarUrl: string | null;
    readonly dateOfBirth: string | null;
    readonly gender: string | null;
    readonly language: string | null;
    readonly email: string | null;
    readonly phone: string | null;
    readonly parentId: string | null;
    readonly parentUserId: string | null;
    readonly parentName: string | null;
    readonly parentEmail: string | null;
    readonly parentPhone: string | null;
    readonly isAssociatedViewer: boolean;
    readonly primaryTeacherId: string;
    readonly teacherUserId: string;
    readonly teacherName: string;
    readonly hoursPerWeek: number;
    readonly classesRemaining: number;
    readonly classesTotal: number;
    readonly version: number;
    readonly createdAt: string | null;
    readonly updatedAt: string | null;
    readonly upcomingClasses: unknown;
    readonly classHistory: unknown;
  };
}

export interface StudentSessionFixture {
  readonly id: string;
  readonly title: string;
  readonly time: string;
  readonly duration: number;
  readonly status: string;
  readonly outcome: string;
  readonly isFrozen: boolean;
  readonly instructor: string;
  readonly teacherId: string;
  readonly timeSlot: string;
  readonly room: string | null;
  readonly notes: string | null;
  readonly dayOfMonth: number;
  readonly meetingJoinUrl: string | null;
  readonly effectiveMeeting: unknown;
}

export interface StudentClassHistoryFixture {
  readonly studentClassHistory: {
    readonly id: string;
    readonly studentName: string;
    readonly metrics: {
      readonly totalClasses: number;
      readonly attendanceRate: number;
      readonly hoursStudied: number;
      readonly performance: number;
    };
    readonly sessions: readonly StudentSessionFixture[];
  };
}

// ---------------------------------------------------------------------------
// Shared session objects
// ---------------------------------------------------------------------------

const QURAN_RECITATION_SESSION: StudentSessionFixture = {
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
};

const TAJWEED_SESSION: StudentSessionFixture = {
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
};

// ---------------------------------------------------------------------------
// Profile mock factory
// ---------------------------------------------------------------------------

/**
 * Create a student profile mock.
 *
 * @param studentId  - The profile's id field
 * @param overrides  - Partial overrides for profile fields (e.g. populated DOB/email for the profile test)
 */
export function createProfileMockData(
  studentId: string,
  overrides: Partial<Omit<StudentProfileFixture["studentProfile"], "id">> = {}
): StudentProfileFixture {
  const defaults: StudentProfileFixture["studentProfile"] = {
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
  };
  return { studentProfile: { ...defaults, ...overrides, id: studentId } };
}

// ---------------------------------------------------------------------------
// History mock factory
// ---------------------------------------------------------------------------

/** Default metrics for the two-session history variant (history container / sessions). */
const TWO_SESSION_METRICS = {
  totalClasses: 3,
  attendanceRate: 90,
  hoursStudied: 4.5,
  performance: 85,
} as const;

/** Metrics for the single-session history variant (history mobile). */
const SINGLE_SESSION_METRICS = {
  totalClasses: 2,
  attendanceRate: 90,
  hoursStudied: 2,
  performance: 85,
} as const;

/**
 * Create the student class history mock used by the history desktop test and sessions test.
 * Contains two sessions (Quran Recitation + Tajweed).
 */
export function createTwoSessionHistoryMockData(
  overrides: {
    metrics?: Partial<StudentClassHistoryFixture["studentClassHistory"]["metrics"]>;
    sessions?: readonly StudentSessionFixture[];
    studentName?: string;
    id?: string;
  } = {}
): StudentClassHistoryFixture {
  return {
    studentClassHistory: {
      id: overrides.id ?? "history-1",
      studentName: overrides.studentName ?? "Ahmed Student",
      metrics: { ...TWO_SESSION_METRICS, ...overrides.metrics },
      sessions: overrides.sessions ?? [
        {
          ...QURAN_RECITATION_SESSION,
          notes: "Strong progress",
          meetingJoinUrl: "https://meet.example.com/session-1",
        },
        TAJWEED_SESSION,
      ],
    },
  };
}

/**
 * Create the student class history mock used by the history mobile test.
 * Contains a single session (Quran Recitation).
 */
export function createSingleSessionHistoryMockData(
  overrides: {
    metrics?: Partial<StudentClassHistoryFixture["studentClassHistory"]["metrics"]>;
    sessions?: readonly StudentSessionFixture[];
    studentName?: string;
    id?: string;
  } = {}
): StudentClassHistoryFixture {
  return {
    studentClassHistory: {
      id: overrides.id ?? "history-1",
      studentName: overrides.studentName ?? "Ahmed Student",
      metrics: { ...SINGLE_SESSION_METRICS, ...overrides.metrics },
      sessions: overrides.sessions ?? [QURAN_RECITATION_SESSION],
    },
  };
}

// ---------------------------------------------------------------------------
// Date constants shared across history/sessions tests
// ---------------------------------------------------------------------------

export const HISTORY_YEAR = 2026;
export const HISTORY_MONTH = 7;

// ---------------------------------------------------------------------------
// Students-domain tier view props (mobile/desktop history views)
// ---------------------------------------------------------------------------

export interface StudentHistoryViewPropsFixtureOptions {
  /** Labels object from the history ViewModel (the `readTranslation` result in tests). */
  readonly labels: StudentHistoryViewModel["labels"];
  /** Month currently shown in the navigator. */
  readonly currentMonth: Date;
  /** Earliest navigable month; `undefined` means the past is unbounded. */
  readonly enrollmentMonth?: Date;
  /** Latest navigable month; `undefined` means the future is unbounded. */
  readonly nowMonth?: Date;
}

/**
 * Build the full history ViewModel props so tests can render the tier views
 * directly. Lets tests drive the `enrollmentMonth`/`nowMonth` navigator bounds
 * that the container currently does not populate.
 */
export function createStudentHistoryViewProps({
  labels,
  currentMonth,
  enrollmentMonth,
  nowMonth,
}: StudentHistoryViewPropsFixtureOptions): StudentHistoryViewModel {
  return {
    studentName: "Ahmed Student",
    currentMonth,
    metrics: { totalClasses: 2, attendanceRate: 90, hoursStudied: 2, performance: 85 },
    classes: {},
    selectedWeek: 1,
    selectedDay: null,
    onSelectWeek: () => {},
    onSelectDay: () => {},
    onPrevMonth: () => {},
    onNextMonth: () => {},
    onPrint: () => {},
    enrollmentMonth,
    nowMonth,
    locale: "en",
    labels,
    loading: false,
  };
}

// ---------------------------------------------------------------------------
// Bounds dates for navigator enablement tests
// ---------------------------------------------------------------------------

/** May 2026 — enrollment floor of the navigable range. */
export const HISTORY_ENROLLMENT_MONTH = new Date(2026, 4, 1);

/** July 2026 — month rendered under test. */
export const HISTORY_MONTH_UNDER_TEST = new Date(2026, 6, 1);

/** September 2026 — current-month ceiling of the navigable range. */
export const HISTORY_NOW_MONTH = new Date(2026, 8, 1);
