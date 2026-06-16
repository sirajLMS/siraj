// cspell:disable
import { create } from "zustand";

export interface UpcomingClass {
  readonly id: string;
  readonly subject: string;
  readonly instructor: string;
  readonly date: string;
  readonly time: string;
  readonly room: string;
  readonly status: "scheduled" | "suspended" | "on-leave";
}

export interface StudentStatusInfo {
  readonly id: string;
  readonly name: string;
  readonly status: "regular" | "suspended" | "on-leave";
  readonly grade: string;
  readonly profileImage: string;
  readonly upcomingClasses: readonly UpcomingClass[];
}

interface StudentStatusState {
  readonly studentInfo: StudentStatusInfo | null;
  readonly isLoading: boolean;
  readonly isUpdating: boolean;
  fetchStudentStatus: (id: string) => Promise<void>;
  updateStatus: (status: "regular" | "suspended" | "on-leave", reason: string) => Promise<void>;
}

const MOCK_CLASSES: readonly UpcomingClass[] = [
  {
    id: "cls-1",
    subject: "Advanced Mathematics II",
    instructor: "Dr. Ahmed El-Din",
    date: "Oct 24, 2023",
    time: "09:00 AM - 10:30 AM",
    room: "Room 402-B",
    status: "scheduled",
  },
  {
    id: "cls-2",
    subject: "Islamic History & Culture",
    instructor: "Prof. Layla Mansour",
    date: "Oct 25, 2023",
    time: "11:30 AM - 01:00 PM",
    room: "Zoom #882-12",
    status: "scheduled",
  },
  {
    id: "cls-3",
    subject: "Software Engineering",
    instructor: "Eng. Kareem Zakaria",
    date: "Oct 26, 2023",
    time: "02:00 PM - 04:00 PM",
    room: "Lab Room 4",
    status: "scheduled",
  },
];

const MOCK_STUDENT: StudentStatusInfo = {
  id: "STU-99201-B",
  name: "Sara Al-Sayed",
  status: "regular",
  grade: "Grade 11 - Advanced Mathematics Track",
  profileImage:
    "https://lh3.googleusercontent.com/aida/AP1WRLuQtBl7LCt2BXjtsobraqgKRrB9YmXw9fKXILfMgemDU_LPY_v76Br8VyQR9R5-x9Q8Rrk273VPQ4Slol_4ln4eXxDdDje4dSnXejhMIEjIUN8GL50m1McV8EWt9Syb2B-fFK-pJWYRB6HAbYuzK3Z1CyqzpGfnfKMQjhDruuKo-buuOOsyjW9t2Gs88pZBnV31bX33csR5vP3FlDcUF6pX6nmIsYpdg_sMSAKgpcHw1Nr5VcAy3r2R5wJ8",
  upcomingClasses: MOCK_CLASSES,
};

export const useStudentStatusStore = create<StudentStatusState>(set => ({
  studentInfo: null,
  isLoading: false,
  isUpdating: false,

  fetchStudentStatus: async _id => {
    set({ isLoading: true });
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    set({
      studentInfo: MOCK_STUDENT,
      isLoading: false,
    });
  },

  updateStatus: async (status, _reason) => {
    set({ isUpdating: true });
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    set(state => ({
      isUpdating: false,
      studentInfo: state.studentInfo
        ? {
            ...state.studentInfo,
            status,
            upcomingClasses: state.studentInfo.upcomingClasses.map(cls => {
              let nextStatus: "scheduled" | "suspended" | "on-leave" = "scheduled";
              if (status === "suspended") nextStatus = "suspended";
              else if (status === "on-leave") nextStatus = "on-leave";

              return {
                ...cls,
                status: nextStatus,
              };
            }),
          }
        : null,
    }));
  },
}));
