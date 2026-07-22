"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import {
  type CurrencyCode,
  type IanaTimezone,
  ParentStatus,
  type ProfileMode,
  ProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import type {
  AssociatedStudents,
  ParentAdminData,
  ParentViewData,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

function buildParentSource(scope: ProfileScope, profile: ProfileData | null | undefined): ParentViewData | null {
  if (!profile) return null;
  return scope === ProfileScope.Own ? profile.parentOwnProfile : profile.parentAdminProfile;
}

function toEditData(
  parentData: ParentViewData | null,
  avatarUrl: string | null | undefined,
  displayCurrency: CurrencyCode | null | undefined
): ParentAdminEditFormData {
  const adminData = parentData && "nationality" in parentData ? (parentData as ParentAdminData) : null;
  return {
    name: parentData?.name ?? "",
    email: parentData?.email ?? "",
    avatarUrl: avatarUrl ?? null,
    displayCurrency: displayCurrency ?? null,
    phone: parentData?.phone ?? "",
    facebook: parentData?.facebook ?? "",
    whatsapp: parentData?.whatsapp ?? "",
    twitter: parentData?.twitter ?? "",
    nationality: adminData?.nationality ?? "",
    address: adminData?.address ?? "",
    invoiceType: adminData?.invoiceType ?? "",
    feeAmount: adminData?.feeAmount ?? "",
    currency: adminData?.currency ?? undefined,
    timezone: adminData?.timezone ?? "",
    lifecycleStatus: (adminData?.lifecycleStatus as ParentStatus | undefined) ?? ParentStatus.Regular,
  };
}

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
  const isAdminScope = scope === ProfileScope.Other;
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

  const editData = useMemo(
    () => toEditData(parentData, avatarUrl, displayCurrency),
    [parentData, avatarUrl, displayCurrency]
  );

  const onSubmit = async (formData: ParentAdminEditFormData) => {
    setIsSaving(true);
    try {
      const core = {
        name: formData.name,
        email: formData.email,
        avatarUrl: formData.avatarUrl,
        displayCurrency: formData.displayCurrency,
      };
      const parentOwn = {
        phone: formData.phone || null,
        facebook: formData.facebook || null,
        whatsapp: formData.whatsapp || null,
        twitter: formData.twitter || null,
      };

      if (scope === ProfileScope.Own) {
        await updateOwnProfile({
          variables: {
            input: {
              core,
              parent: parentOwn,
            },
          },
        });
      } else {
        await updateUserProfile({
          variables: {
            userId: targetUserId,
            input: {
              core,
              parent: {
                ...parentOwn,
                nationality: formData.nationality || null,
                address: formData.address || null,
                invoiceType: formData.invoiceType || null,
                feeAmount: formData.feeAmount || null,
                currency: formData.currency ?? null,
                timezone: (formData.timezone || null) as IanaTimezone | null,
              },
            },
          },
        });
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
    parentId: profile?.parentId ?? null,
    meetingTabHref: "?tab=meeting",
    associatedStudents: profile?.associatedStudents ?? null,
    canView,
  };
}
