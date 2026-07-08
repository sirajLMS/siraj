import type { Meta, StoryObj } from "@storybook/react";
import { create } from "zustand";
import { Gender, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherProfileFormData } from "./schemas/teacherProfileSchema";
import { TeacherProfileView } from "./TeacherProfileView";
import type { TeacherProfileData } from "./types";

const INITIAL_PROFILE: TeacherProfileData = {
  id: "teacher-42",
  userId: "user-42",
  fullName: "Amina Hassan",
  email: "amina.hassan@example.com",
  phone: "+20 100 555 0123",
  gender: Gender.Female,
  timezone: "Africa/Cairo",
  address: "Nasr City, Cairo",
  baseSalary: 780,
  currency: "USD",
  paymentMethod: PaymentMethod.Paypal,
  zoomLink: "https://zoom.us/j/1234567890",
  accountStatus: true,
  updatedAt: "2026-07-08T12:00:00.000Z",
  totalClasses: 312,
  avgEngagementScore: 94,
};

interface TeacherProfileStoryState {
  readonly profile: TeacherProfileData | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly saveCount: number;
  setSaving: (isSaving: boolean) => void;
  applySave: (data: TeacherProfileFormData) => void;
  reset: () => void;
}

const useTeacherProfileStoryStore = create<TeacherProfileStoryState>(set => ({
  profile: INITIAL_PROFILE,
  isLoading: false,
  isSaving: false,
  saveCount: 0,
  setSaving: isSaving => set({ isSaving }),
  applySave: data =>
    set(state => {
      if (!state.profile) {
        return { saveCount: state.saveCount + 1 };
      }

      return {
        saveCount: state.saveCount + 1,
        profile: {
          ...state.profile,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone ?? "",
          gender: data.gender as Gender,
          timezone: data.timezone,
          address: data.address ?? "",
          baseSalary: data.baseSalary,
          currency: data.currency,
          paymentMethod: data.paymentMethod as PaymentMethod,
          zoomLink: data.zoomLink,
          accountStatus: data.accountStatus,
          updatedAt: new Date().toISOString(),
        },
      };
    }),
  reset: () =>
    set({
      profile: INITIAL_PROFILE,
      isLoading: false,
      isSaving: false,
      saveCount: 0,
    }),
}));

function MockTeacherProfileView() {
  const profile = useTeacherProfileStoryStore(state => state.profile);
  const isLoading = useTeacherProfileStoryStore(state => state.isLoading);
  const isSaving = useTeacherProfileStoryStore(state => state.isSaving);
  const setSaving = useTeacherProfileStoryStore(state => state.setSaving);
  const applySave = useTeacherProfileStoryStore(state => state.applySave);

  const handleSave = async (data: TeacherProfileFormData) => {
    setSaving(true);
    await new Promise(resolve => {
      setTimeout(resolve, 600);
    });
    applySave(data);
    setSaving(false);
  };

  return <TeacherProfileView profile={profile} isLoading={isLoading} isSaving={isSaving} onSave={handleSave} />;
}

const meta: Meta<typeof MockTeacherProfileView> = {
  title: "Views/dashboard/teachers/profile/TeacherProfileView",
  component: MockTeacherProfileView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockTeacherProfileView>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  decorators: [
    StoryComponent => {
      useTeacherProfileStoryStore.setState({ isLoading: true, profile: null });
      return <StoryComponent />;
    },
  ],
};

export const EmptyProfile: Story = {
  decorators: [
    StoryComponent => {
      useTeacherProfileStoryStore.setState({ isLoading: false, profile: null });
      return <StoryComponent />;
    },
  ],
};

export const AfterSave: Story = {
  decorators: [
    StoryComponent => {
      useTeacherProfileStoryStore.getState().reset();
      useTeacherProfileStoryStore.setState({
        profile: {
          ...INITIAL_PROFILE,
          fullName: "Amina Hassan (Updated)",
          updatedAt: "2026-07-08T14:30:00.000Z",
        },
      });
      return <StoryComponent />;
    },
  ],
};
