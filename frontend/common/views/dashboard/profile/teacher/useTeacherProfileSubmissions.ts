"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import type { AccountStatus, CurrencyCode, Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { isTeacherNationalIdComplete } from "@/frontend/common/lib/profileCompletion";
import { toIanaTimezone } from "@/frontend/common/lib/timezone";
import { logger } from "@/frontend/common/utils/logger";
import { useRouter } from "@/shared/i18n/navigation";
import type { NationalIdValue } from "@/shared/lib/national-id";

export type TeacherOwnSubmitData = {
  name: string;
  email: string;
  phone: string;
  nationalId: NationalIdValue | null;
  nationality: string;
  avatarUrl?: string | null;
  displayCurrency: CurrencyCode | null;
  timezone?: string;
};

export type TeacherAdminSubmitData = {
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  nationalId: NationalIdValue | null;
  nationality: string;
  dateOfBirth: string;
  gender: Gender | null;
  address: string;
  qualifications: string;
  timezone: string;
  hourlyRate: string;
  rateCurrency: CurrencyCode | undefined;
  status: AccountStatus | null;
  displayCurrency: CurrencyCode | null;
};

function buildOwnProfileInput(formData: TeacherOwnSubmitData) {
  return {
    core: {
      name: formData.name,
      email: formData.email,
      avatarUrl: formData.avatarUrl,
      displayCurrency: formData.displayCurrency,
    },
    teacher: {
      phone: formData.phone || null,
      nationalId: formData.nationalId ?? null,
      nationality: formData.nationality || null,
      timezone: formData.timezone ? toIanaTimezone(formData.timezone) : null,
    },
  };
}

function buildAdminProfileInput(formData: TeacherAdminSubmitData) {
  return {
    core: {
      name: formData.name,
      email: formData.email,
      avatarUrl: formData.avatarUrl,
      displayCurrency: formData.displayCurrency,
    },
    teacher: {
      phone: formData.phone || null,
      nationalId: formData.nationalId ?? null,
      nationality: formData.nationality || null,
      dateOfBirth: formData.dateOfBirth || null,
      gender: formData.gender,
      address: formData.address || null,
      qualifications: formData.qualifications || null,
      timezone: formData.timezone ? toIanaTimezone(formData.timezone) : null,
      hourlyRate: formData.hourlyRate || null,
      rateCurrency: formData.rateCurrency ?? null,
      status: formData.status,
    },
  };
}

export interface UseTeacherProfileSubmissionsProps {
  readonly targetUserId: string;
  readonly forceComplete: boolean;
  readonly refetch: () => Promise<unknown>;
}

export interface TeacherProfileSubmissions {
  readonly isSaving: boolean;
  readonly onSubmitOwn: (formData: TeacherOwnSubmitData) => Promise<void>;
  readonly onSubmitAdmin: (formData: TeacherAdminSubmitData) => Promise<void>;
}

export function useTeacherProfileSubmissions(
  props: Readonly<UseTeacherProfileSubmissionsProps>
): TeacherProfileSubmissions {
  const { targetUserId, forceComplete, refetch } = props;
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [updateOwnProfile] = useMutation(updateOwnProfileMutationDocument);
  const [updateUserProfile] = useMutation(updateUserProfileMutationDocument);

  const onSubmitOwn = async (formData: TeacherOwnSubmitData) => {
    setIsSaving(true);
    try {
      await updateOwnProfile({ variables: { input: buildOwnProfileInput(formData) } });

      if (forceComplete && isTeacherNationalIdComplete(formData.nationalId)) {
        // After completing the required national ID, send the teacher to the dashboard
        // (the original destination they were blocked from) rather than the profile view.
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      await refetch();
    } catch (submitError) {
      logger.error("Failed to update own teacher profile", { error: submitError });
      throw submitError;
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitAdmin = async (formData: TeacherAdminSubmitData) => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        variables: { userId: targetUserId, input: buildAdminProfileInput(formData) },
      });
      await refetch();
    } catch (submitError) {
      logger.error("Failed to update teacher profile", { error: submitError });
      throw submitError;
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, onSubmitOwn, onSubmitAdmin };
}
