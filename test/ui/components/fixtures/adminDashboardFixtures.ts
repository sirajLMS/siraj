import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import { createDailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/scheduleFixture";

export interface MockScheduleSeed {
  readonly id: string;
  readonly yourTime: string;
  readonly teacherTime: string;
  readonly studentTime: string;
  readonly outcome: ClassOutcome;
  readonly executionState: ClassExecutionState;
  readonly studentId: string;
  readonly studentName: string;
  readonly teacherId: string;
  readonly teacherName: string;
}

export const MOCK_SCHEDULE_SEED: readonly MockScheduleSeed[] = [
  {
    id: "9082",
    yourTime: "10:00 AM - 11:00 AM",
    teacherTime: "11:00 AM - 12:00 PM",
    studentTime: "10:00 AM - 11:00 AM",
    outcome: ClassOutcome.Pending,
    executionState: ClassExecutionState.NotActivated,
    studentId: "student-1",
    studentName: "Omar Khalid",
    teacherId: "teacher-ahmed",
    teacherName: "Ahmed Mohammed",
  },
  {
    id: "9083",
    yourTime: "11:30 AM - 12:30 PM",
    teacherTime: "12:30 PM - 01:30 PM",
    studentTime: "11:30 AM - 12:30 PM",
    outcome: ClassOutcome.Pending,
    executionState: ClassExecutionState.Running,
    studentId: "student-2",
    studentName: "Layla Ismail",
    teacherId: "teacher-sarah",
    teacherName: "Sarah Johnson",
  },
  {
    id: "9084",
    yourTime: "02:00 PM - 03:00 PM",
    teacherTime: "03:00 PM - 04:00 PM",
    studentTime: "02:00 PM - 03:00 PM",
    outcome: ClassOutcome.Taken,
    executionState: ClassExecutionState.Completed,
    studentId: "student-3",
    studentName: "Omar Ahmed",
    teacherId: "teacher-ahmed",
    teacherName: "Ahmed Mohammed",
  },
];

export const MOCK_SCHEDULE: readonly DailyScheduleRow[] = MOCK_SCHEDULE_SEED.map(seed =>
  createDailyScheduleRow({
    id: seed.id,
    yourTime: seed.yourTime,
    teacherTime: seed.teacherTime,
    studentTime: seed.studentTime,
    duration: 60,
    scheduledStartAt: "2028-01-01T10:00:00.000Z",
    scheduledEndAt: "2028-01-01T11:00:00.000Z",
    outcome: seed.outcome,
    executionState: seed.executionState,
    student: { id: seed.studentId, name: seed.studentName, avatarUrl: null },
    teacher: { id: seed.teacherId, name: seed.teacherName, avatarUrl: null },
  })
);

export const MOCK_TEACHERS = [
  { id: "teacher-ahmed", name: "Ahmed Mohammed" },
  { id: "teacher-sarah", name: "Sarah Johnson" },
] as const;
