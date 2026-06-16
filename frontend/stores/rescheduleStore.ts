import { create } from "zustand";

export interface RescheduleSession {
  readonly sessionId: string;
  readonly teacherName: string;
  readonly studentName: string;
  readonly teacherTimezone: string;
}

interface RescheduleState {
  readonly session: RescheduleSession;
  readonly isSubmitting: boolean;
  readonly setSession: (session: RescheduleSession) => void;
  readonly setSubmitting: (isSubmitting: boolean) => void;
}

const defaultSession: RescheduleSession = {
  sessionId: "s1",
  teacherName: "Ahmed Al-Farsi",
  studentName: "Omar Ahmed",
  teacherTimezone: "Africa/Cairo",
};

export const useRescheduleStore = create<RescheduleState>(set => ({
  session: defaultSession,
  isSubmitting: false,
  setSession: session => {
    set({ session });
  },
  setSubmitting: isSubmitting => {
    set({ isSubmitting });
  },
}));
