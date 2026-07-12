import { create } from "zustand";
import type { RescheduleSession } from "@/frontend/types/shared.types";

interface RescheduleState {
  readonly session: RescheduleSession;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly setSession: (session: RescheduleSession) => void;
  readonly setSubmitting: (isSubmitting: boolean) => void;
  readonly setShowSuccess: (showSuccess: boolean) => void;
}

const defaultSession: RescheduleSession = {
  sessionId: "",
  teacherName: "",
  studentName: "",
  teacherTimezone: "",
};

export const useRescheduleStore = create<RescheduleState>(set => ({
  session: defaultSession,
  isSubmitting: false,
  showSuccess: false,
  setSession: session => {
    set({ session });
  },
  setSubmitting: isSubmitting => {
    set({ isSubmitting });
  },
  setShowSuccess: showSuccess => {
    set({ showSuccess });
  },
}));
