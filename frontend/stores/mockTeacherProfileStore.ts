// cspell:disable
import { create } from "zustand";
import type { TeacherProfileFormData } from "@/frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema";

export interface TeacherProfileData extends TeacherProfileFormData {
  readonly id: string;
  readonly lastModified: string;
  readonly totalClasses: number;
  readonly parentRating: string;
}

interface TeacherProfileState {
  readonly profile: TeacherProfileData | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  fetchProfile: (id: string) => Promise<void>;
  updateProfile: (data: TeacherProfileFormData) => Promise<void>;
}

const MOCK_PROFILE: TeacherProfileData = {
  id: "TEA-8821",
  fullName: "Dr. Sarah Al-Sayed",
  email: "sarah.alsayed@siraj-edu.com",
  phone: "+20 123 456 7890",
  gender: "female",
  timezone: "Africa/Cairo",
  address: "12 Al-Gezira St, Zamalek, Cairo, Egypt",
  baseSalary: 4500,
  currency: "USD",
  paymentMethod: "paypal",
  zoomLink: "https://zoom.us/j/9827431092",
  accountStatus: true,
  lastModified: "Oct 24, 2023 - 11:32 AM",
  totalClasses: 1248,
  parentRating: "4.9/5.0",
};

export const useTeacherProfileStore = create<TeacherProfileState>(set => ({
  profile: null,
  isLoading: false,
  isSaving: false,

  fetchProfile: async _id => {
    set({ isLoading: true });
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    set({
      profile: MOCK_PROFILE,
      isLoading: false,
    });
  },

  updateProfile: async data => {
    set({ isSaving: true });
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    set(state => ({
      isSaving: false,
      profile: state.profile ? { ...state.profile, ...data, lastModified: "Just now" } : null,
    }));
  },
}));
