import type { Gender, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherProfileFormData } from "@/frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema";

export interface TeacherProfileData {
  readonly id: string;
  readonly userId: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly gender: Gender | null;
  readonly timezone: string;
  readonly address: string;
  readonly baseSalary: number;
  readonly currency: string;
  readonly paymentMethod: PaymentMethod | null;
  readonly zoomLink: string;
  readonly accountStatus: boolean;
  readonly updatedAt: string;
  readonly totalClasses: number;
  readonly avgEngagementScore: number;
}

export interface TeacherProfileViewProps {
  readonly profile: TeacherProfileData | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly onSave: (data: TeacherProfileFormData) => Promise<void>;
  readonly onDiscard?: () => void;
}

export interface TeacherProfileFormActionsProps {
  readonly isSaving: boolean;
  readonly isMobile: boolean;
  readonly updatedAt: string;
  readonly onDiscard: () => void;
}

export interface TeacherProfileStatsProps {
  readonly totalClasses: number;
  readonly avgEngagementScore: number;
}

export interface SectionHeaderProps {
  readonly title: string;
  readonly icon: import("react").ElementType;
}
