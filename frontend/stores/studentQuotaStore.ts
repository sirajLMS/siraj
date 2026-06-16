// cspell:disable
import { create } from "zustand";
import type { StudentQuotaFormData } from "@/frontend/views/dashboard/students/quota/schemas/studentQuotaSchema";

export interface StudentProfileData extends StudentQuotaFormData {
  readonly id: string;
  readonly profileImage: string;
  readonly lastEditedBy: string;
  readonly lastEditedTime: string; // e.g., "2 hours"
}

interface StudentQuotaState {
  readonly studentData: StudentProfileData | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly isSaved: boolean;
  fetchStudentData: (id: string) => Promise<void>;
  updateStudentData: (data: StudentQuotaFormData) => Promise<void>;
}

const MOCK_DATA: Readonly<Partial<Record<string, StudentProfileData>>> = {
  "SRJ-9921": {
    id: "SRJ-9921",
    studentName: "Zaid bin Arshad",
    dateOfBirth: "2012-05-14",
    language: "Arabic",
    gender: "male",
    teacher: "Sheikh Abdullah Al-Mansur",
    totalClasses: 48,
    classesLeft: 12,
    profileImage:
      "https://lh3.googleusercontent.com/aida/AP1WRLu87_Io9TKQ4rh-HzFBUfwCJ4ma5OG-N41-u594scdzXoK4MrTa2BZi_JmkH9FxRxErqOxUjBh47WA6zHlHb7XR1wGp4uwsQeG0q3rIZhIfUNJDLnJIPimxH3Do0yLDL0sorZbgaUhT6liRZ4KS4KRkzGq1NaOnetwzQrDXY6_lbuZYZxLejoVhathoVRJPEwAV1K6rw4owWibjNfaXsdntYje1mmdwtlNmuLhSzB6ZOOdIIgNSAfXaC8-r",
    lastEditedBy: "admin_sarah",
    lastEditedTime: "2 hours",
  },
};

export const useStudentQuotaStore = create<StudentQuotaState>(set => ({
  studentData: null,
  isLoading: false,
  isSaving: false,
  isSaved: false,

  fetchStudentData: async id => {
    set({ isLoading: true });
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    set({
      studentData: MOCK_DATA[id] ?? MOCK_DATA["SRJ-9921"] ?? null, // fallback to mock if id doesn't match
      isLoading: false,
      isSaved: false,
    });
  },

  updateStudentData: async data => {
    set({ isSaving: true });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    set(state => ({
      isSaving: false,
      isSaved: true,
      studentData: state.studentData
        ? {
            ...state.studentData,
            ...data,
            lastEditedBy: "current_user",
            lastEditedTime: "just now",
          }
        : null,
    }));

    // Reset saved status after 2 seconds
    setTimeout(() => {
      set({ isSaved: false });
    }, 2000);
  },
}));
