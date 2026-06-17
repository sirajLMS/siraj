// cspell:disable
import { create } from "zustand";

export interface ScheduledClass {
  readonly id: string;
  readonly studentName: string;
  readonly subjectName: string;
  readonly duration: number; // in minutes
  readonly startTime: string; // e.g. "08:00 AM"
  readonly day: string; // e.g. "monday"
}

export interface TeacherWeeklySchedule {
  readonly teacherId: string;
  readonly teacherName: string;
  readonly weeklyHoursWorked: string;
  readonly classes: readonly ScheduledClass[];
  readonly lastUpdated: string;
}

export type FutureClassStatus = "regular" | "rescheduled";
export type LeaveDisabledReason = "time" | "quota";

export interface FutureClass {
  readonly id: string;
  readonly subjectName: string;
  readonly status: FutureClassStatus;
  readonly startTime: string;
  readonly endTime: string;
  readonly date: string; // ISO format
  readonly location: string;
  readonly studentCount: number;
  readonly leaveRequestDisabled?: boolean;
  readonly leaveRequestDisabledReason?: LeaveDisabledReason;
}

export interface FutureSchedule {
  readonly leaveQuotaUsed: number;
  readonly leaveQuotaTotal: number;
  readonly totalClasses: number;
  readonly classes: readonly FutureClass[];
}

interface TeacherScheduleState {
  readonly schedule: TeacherWeeklySchedule | null;
  readonly futureSchedule: FutureSchedule | null;
  setSchedule: (schedule: TeacherWeeklySchedule) => void;
  setFutureSchedule: (futureSchedule: FutureSchedule) => void;
  removeClass: (id: string) => void;
}

const createMockClass = (params: {
  id: string;
  studentName: string;
  startTime: string;
  day: string;
  subjectName?: string;
}): ScheduledClass => ({
  id: params.id,
  studentName: params.studentName,
  subjectName: params.subjectName ?? "Geometry 101",
  duration: 60,
  startTime: params.startTime,
  day: params.day,
});

const MOCK_SCHEDULE: TeacherWeeklySchedule = {
  teacherId: "tea-1",
  teacherName: "Dr. Ahmed Khalil",
  weeklyHoursWorked: "32:45",
  lastUpdated: "Today at 09:12 AM",
  classes: [
    createMockClass({ id: "1", studentName: "Omar S.", startTime: "08:00 AM", day: "monday" }),
    createMockClass({ id: "2", studentName: "Lina M.", startTime: "08:00 AM", day: "wednesday" }),
    createMockClass({ id: "3", studentName: "Zaid K.", startTime: "09:00 AM", day: "tuesday" }),
    createMockClass({ id: "4", studentName: "Hala R.", startTime: "09:00 AM", day: "thursday" }),
    createMockClass({ id: "5", studentName: "Group A", startTime: "09:00 AM", day: "friday" }),
    createMockClass({ id: "6", studentName: "Sara J.", startTime: "10:00 AM", day: "monday" }),
    createMockClass({ id: "7", studentName: "Sami T.", startTime: "10:00 AM", day: "wednesday" }),
    createMockClass({
      id: "8",
      studentName: "Staff Meet",
      startTime: "11:00 AM",
      day: "thursday",
      subjectName: "Administrative",
    }),
    createMockClass({ id: "9", studentName: "Ali", startTime: "11:00 AM", day: "friday" }),
    createMockClass({ id: "10", studentName: "Noor A.", startTime: "01:00 PM", day: "monday" }),
    createMockClass({ id: "11", studentName: "Dana W.", startTime: "01:00 PM", day: "tuesday" }),
    createMockClass({ id: "12", studentName: "Khalid", startTime: "01:00 PM", day: "wednesday" }),
  ],
};

const MOCK_FUTURE_SCHEDULE: FutureSchedule = {
  leaveQuotaUsed: 0,
  leaveQuotaTotal: 2,
  totalClasses: 12,
  classes: [
    {
      id: "fc-1",
      subjectName: "Advanced Mathematics - Group A",
      status: "rescheduled",
      startTime: "09:00 AM",
      endTime: "10:30 AM",
      date: "2023-10-24",
      location: "Virtual Room 12",
      studentCount: 18,
      leaveRequestDisabled: true,
      leaveRequestDisabledReason: "time",
    },
    {
      id: "fc-2",
      subjectName: "Physics 101: Mechanics",
      status: "regular",
      startTime: "11:00 AM",
      endTime: "12:30 PM",
      date: "2023-10-24",
      location: "Hall B - Campus",
      studentCount: 24,
    },
    {
      id: "fc-3",
      subjectName: "Intro to Arabic Literature",
      status: "rescheduled",
      startTime: "02:00 PM",
      endTime: "03:30 PM",
      date: "2023-10-25",
      location: "Virtual Room 04",
      studentCount: 12,
      leaveRequestDisabled: true,
      leaveRequestDisabledReason: "quota",
    },
  ],
};

export const useTeacherScheduleStore = create<TeacherScheduleState>(set => ({
  schedule: MOCK_SCHEDULE,
  futureSchedule: MOCK_FUTURE_SCHEDULE,
  setSchedule: schedule => {
    set({ schedule });
  },
  setFutureSchedule: futureSchedule => {
    set({ futureSchedule });
  },
  removeClass: id => {
    set(state => ({
      schedule: state.schedule ? { ...state.schedule, classes: state.schedule.classes.filter(c => c.id !== id) } : null,
      futureSchedule: state.futureSchedule
        ? { ...state.futureSchedule, classes: state.futureSchedule.classes.filter(c => c.id !== id) }
        : null,
    }));
  },
}));
