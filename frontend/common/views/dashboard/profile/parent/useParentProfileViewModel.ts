"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import type {
  AssociatedStudents,
  ParentProfileViewLabels,
  ParentViewData,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import {
  buildAdminParentProfileUpdateVariables,
  buildOwnParentProfileUpdateVariables,
  buildParentSource,
  toEditData,
} from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel.helpers";
import { type ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface ParentProfileViewModel {
  readonly labels: ParentProfileViewLabels;
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
  readonly profileTimezone: string | null;
  readonly profilePhone: string | null;
  readonly parentId: string | null;
  readonly meetingTabHref: string;
  readonly associatedStudents: AssociatedStudents | null;
  readonly canView: (groupKey: ProfileFieldGroupKey) => boolean;
}

export interface UseParentProfileViewModelProps {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab?: string;
}

export function useParentProfileViewModel(
  props: Readonly<UseParentProfileViewModelProps> & { readonly canView: (groupKey: ProfileFieldGroupKey) => boolean }
): ParentProfileViewModel {
  const { scope, mode, targetUserId, activeTab = "profile", canView } = props;
  const base = useAppTranslation(Translation.Profile.Base);
  const parent = useAppTranslation(Translation.Profile.Parent);
  const labels: ParentProfileViewLabels = { base, parent };
  const isAdminScope = scope === ProfileScope.OTHER;
  const [isSaving, setIsSaving] = useState(false);

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
    fetchPolicy: "cache-and-network",
  });

  const [updateOwnProfile] = useMutation(updateOwnProfileMutationDocument);
  const [updateUserProfile] = useMutation(updateUserProfileMutationDocument);

  const profile = data?.profileByUserId;
  const parentData = buildParentSource(scope, profile);
  const avatarUrl = profile?.avatarUrl ?? null;
  const displayCurrency = profile?.displayCurrency ?? null;
  const profileTimezone = profile?.timezone ?? null;
  const profilePhone = profile?.phone ?? null;

  const editData = useMemo(
    () => toEditData(parentData, avatarUrl, displayCurrency, profileTimezone),
    [parentData, avatarUrl, displayCurrency, profileTimezone]
  );

  const onSubmit = async (formData: ParentAdminEditFormData) => {
    setIsSaving(true);
    try {
      if (scope === ProfileScope.OWN) {
        await updateOwnProfile({ variables: buildOwnParentProfileUpdateVariables(formData) });
      } else {
        await updateUserProfile({ variables: buildAdminParentProfileUpdateVariables(targetUserId, formData) });
      }
      await refetch();
    } catch (submitError) {
      logger.error("Failed to update parent profile", { error: submitError });
      throw submitError;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    labels,
    scope,
    mode,
    targetUserId,
    activeTab,
    isAdminScope,
    loading,
    error,
    isSaving,
    onSubmit,
    onRetry: () => {
      void refetch();
    },
    parentData,
    editData,
    avatarUrl,
    displayCurrency,
    profileTimezone,
    profilePhone,
    parentId: profile?.parentId ?? null,
    meetingTabHref: "?tab=meeting",
    associatedStudents: profile?.associatedStudents ?? null,
    canView,
  };
}
