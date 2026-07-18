"use client";

import type { CurrencyCode, ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import type {
  AssociatedStudents,
  ParentAdminData,
  ParentOwnData,
  ParentViewData,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";

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
  // NEW FOR PLAN v5: `canView` lifted from mobile/desktop tier `useProfileFieldAccess`
  // call so tier views stay pure (no hooks). Mirrors the staff VM contract.
  readonly canView: (groupKey: ProfileFieldGroupKey) => boolean;
}

// NEW FOR PLAN v5: split input props from output ViewModel so the Container
// can own identity plumbing (`useProfileFieldAccess`) while callers like
// `ProfilePageClient` keep passing the small static input shape. Mirrors
// `useStaffProfileViewModel`.
export interface UseParentProfileViewModelProps {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab?: string;
}

export function useParentProfileViewModel(
  props: Readonly<UseParentProfileViewModelProps> & { readonly canView: (groupKey: ProfileFieldGroupKey) => boolean }
): ParentProfileViewModel {
  return props as unknown as ParentProfileViewModel;
}

export type { ParentAdminData, ParentOwnData, ParentViewData };
