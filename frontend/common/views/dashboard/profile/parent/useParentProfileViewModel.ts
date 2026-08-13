"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import {
  type CurrencyCode,
  IanaTimezone,
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
  ParentProfileViewLabels,
  ParentViewData,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";
import { Translation, useAppTranslation } from "@/shared/locale";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

const PARENT_STATUS_VALUES: readonly string[] = Object.values(ParentStatus);

function isParentStatus(value: string | null | undefined): value is ParentStatus {
  return value !== null && value !== undefined && PARENT_STATUS_VALUES.includes(value);
}

function isIanaTimezoneString(value: string | null | undefined): value is IanaTimezone {
  return value !== null && value !== undefined && (Object.values(IanaTimezone) as readonly string[]).includes(value);
}

function toIanaTimezoneOrNull(value: string | null | undefined): IanaTimezone | null {
  return isIanaTimezoneString(value) ? value : null;
}

function buildParentSource(scope: ProfileScope, profile: ProfileData | null | undefined): ParentViewData | null {
  if (!profile) return null;
  return scope === ProfileScope.Own ? profile.parentOwnProfile : profile.parentAdminProfile;
}

function toEditData(
  parentData: ParentViewData | null,
  avatarUrl: string | null | undefined,
  displayCurrency: CurrencyCode | null | undefined,
  profileTimezone: string | null | undefined
): ParentAdminEditFormData {
  const adminData = parentData && "invoiceType" in parentData ? parentData : null;
  return {
    name: parentData?.name ?? "",
    email: parentData?.email ?? "",
    avatarUrl: avatarUrl ?? null,
    displayCurrency: displayCurrency ?? null,
    phone: parentData?.phone ?? "",
    facebook: parentData?.facebook ?? "",
    whatsapp: parentData?.whatsapp ?? "",
    twitter: parentData?.twitter ?? "",
    nationality: parentData?.nationality ?? "",
    address: parentData?.address ?? "",
    invoiceType: adminData?.invoiceType ?? "",
    feeAmount: adminData?.feeAmount ?? "",
    currency: adminData?.currency ?? undefined,
    timezone: adminData?.timezone ?? profileTimezone ?? "",
    lifecycleStatus:
      (adminData && isParentStatus(adminData.lifecycleStatus) ? adminData.lifecycleStatus : undefined) ??
      ParentStatus.Regular,
  };
}

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
  const profileTimezone = profile?.timezone ?? null;
  const profilePhone = profile?.phone ?? null;

  const editData = useMemo(
    () => toEditData(parentData, avatarUrl, displayCurrency, profileTimezone),
    [parentData, avatarUrl, displayCurrency, profileTimezone]
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
        phone: formData.phone ?? null,
        facebook: formData.facebook ?? null,
        whatsapp: formData.whatsapp ?? null,
        twitter: formData.twitter ?? null,
      };

      if (scope === ProfileScope.Own) {
        await updateOwnProfile({
          variables: {
            input: {
              core,
              parent: {
                ...parentOwn,
                timezone: toIanaTimezoneOrNull(formData.timezone),
              },
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
                nationality: formData.nationality ?? null,
                address: formData.address ?? null,
                invoiceType: formData.invoiceType ?? null,
                feeAmount: formData.feeAmount ?? null,
                currency: formData.currency ?? null,
                timezone: toIanaTimezoneOrNull(formData.timezone),
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
