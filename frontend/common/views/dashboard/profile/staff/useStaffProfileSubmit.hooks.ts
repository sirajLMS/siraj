"use client";

import { useMutation } from "@apollo/client/react";
import {
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { toIanaTimezone } from "@/frontend/common/lib/timezone";
import { logger } from "@/frontend/common/utils/logger";
import type {
  StaffAdminEditFormData,
  StaffOwnEditFormData,
} from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";

export interface UseStaffProfileSubmitProps {
  readonly targetUserId: string;
  readonly refetch: () => Promise<unknown>;
  readonly setIsSaving: (isSaving: boolean) => void;
}

export interface StaffProfileSubmitHandlers {
  readonly onSubmitOwn: (formData: StaffOwnEditFormData) => Promise<void>;
  readonly onSubmitAdmin: (formData: StaffAdminEditFormData) => Promise<void>;
}

type StaffCoreFormFields = Pick<
  StaffOwnEditFormData,
  "name" | "email" | "avatarUrl" | "displayCurrency" | "timezone" | "phone"
>;

function buildCoreProfileInput(formData: StaffCoreFormFields) {
  return {
    name: formData.name,
    email: formData.email,
    avatarUrl: formData.avatarUrl,
    displayCurrency: formData.displayCurrency,
    timezone: formData.timezone ? toIanaTimezone(formData.timezone) : null,
  };
}

export function useStaffProfileSubmit(props: Readonly<UseStaffProfileSubmitProps>): StaffProfileSubmitHandlers {
  const { targetUserId, refetch, setIsSaving } = props;
  const [updateOwnProfile] = useMutation(updateOwnProfileMutationDocument);
  const [updateUserProfile] = useMutation(updateUserProfileMutationDocument);

  const runSave = async (failureMessage: string, save: () => Promise<unknown>): Promise<void> => {
    setIsSaving(true);
    try {
      await save();
      await refetch();
    } catch (submitError) {
      logger.error(failureMessage, { error: submitError });
      throw submitError;
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitOwn = (formData: StaffOwnEditFormData) =>
    runSave("Failed to update own staff profile", async () => {
      await updateOwnProfile({
        variables: {
          input: {
            core: buildCoreProfileInput(formData),
            staff: {
              phone: formData.phone ?? null,
            },
          },
        },
      });
    });

  const onSubmitAdmin = (formData: StaffAdminEditFormData) =>
    runSave("Failed to update staff profile", async () => {
      await updateUserProfile({
        variables: {
          userId: targetUserId,
          input: {
            core: buildCoreProfileInput(formData),
            staff: {
              phone: formData.phone ?? null,
              status: formData.status ?? null,
              hourlyRate: formData.hourlyRate ?? null,
              rateCurrency: formData.rateCurrency ?? null,
            },
          },
        },
      });
    });

  return { onSubmitOwn, onSubmitAdmin };
}
