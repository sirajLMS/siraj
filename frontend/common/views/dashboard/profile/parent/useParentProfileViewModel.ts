"use client";

import type { CurrencyCode, ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import type {
  AssociatedStudents,
  ParentAdminData,
  ParentOwnData,
  ParentViewData,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";

export interface ParentProfileViewModel {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab: string;
  readonly isAdminScope: boolean;
  readonly loading: boolean;
  readonly error: unknown;
  readonly isSaving: boolean;
  readonly onSubmit: (formData: ParentAdminEditFormData) => Promise<void>;
  readonly onRetry: () => void;
  readonly parentData: ParentViewData | null;
  readonly editData: ParentAdminEditFormData;
  readonly avatarUrl: string | null;
  readonly displayCurrency: CurrencyCode | null;
  readonly parentId: string | null;
  readonly meetingTabHref: string;
  readonly associatedStudents: AssociatedStudents | null;
}

export type UseParentProfileViewModelProps = ParentProfileViewModel;

export function useParentProfileViewModel(props: Readonly<UseParentProfileViewModelProps>): ParentProfileViewModel {
  return props;
}

export type { ParentAdminData, ParentOwnData, ParentViewData };
