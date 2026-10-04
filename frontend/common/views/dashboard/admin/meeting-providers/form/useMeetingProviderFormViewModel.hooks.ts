"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import type { useNotifications } from "@toolpad/core/useNotifications";
import type { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { UseFormReset } from "react-hook-form";
import {
  createMeetingProviderMutationDocument,
  meetingProviderQueryDocument,
  updateMeetingProviderMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { logger } from "@/frontend/common/utils/logger";
import type { UseMeetingProviderFormViewModelProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";
import {
  buildProviderInput,
  toMeetingProviderFormValues,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/form/useMeetingProviderFormViewModel.helpers";
import type { MeetingProviderFormData } from "@/frontend/common/views/dashboard/admin/meeting-providers/schemas/meetingProviderFormSchema";
import type { MeetingProvidersLabels } from "@/shared/locale/types/dashboard/meeting-providers/main";

type MeetingProviderFormMode = UseMeetingProviderFormViewModelProps["mode"];

type UseMeetingProviderFormProviderDataParams = {
  readonly mode: MeetingProviderFormMode;
  readonly providerId?: string | null;
  readonly reset: UseFormReset<MeetingProviderFormData>;
};

export function useMeetingProviderFormProviderData({
  mode,
  providerId,
  reset,
}: Readonly<UseMeetingProviderFormProviderDataParams>) {
  const isEditing = mode === "edit" && Boolean(providerId);
  const { data: existingData, loading: isLoadingProvider } = useQuery(meetingProviderQueryDocument, {
    variables: { id: providerId ?? "" },
    skip: !isEditing,
  });

  const loadedProviderIdRef = useRef<string | null>(null);
  useEffect(() => {
    const provider = existingData?.meetingProvider;
    if (!isEditing || !provider || loadedProviderIdRef.current === provider.id) {
      return;
    }
    loadedProviderIdRef.current = provider.id ?? null;
    reset(toMeetingProviderFormValues(provider));
  }, [isEditing, existingData, reset]);

  return { isLoadingProvider };
}

type UseMeetingProviderFormSaveParams = {
  readonly mode: MeetingProviderFormMode;
  readonly providerId?: string | null;
  readonly t: MeetingProvidersLabels;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly router: ReturnType<typeof useRouter>;
  readonly setErrorMsg: (message: string | null) => void;
};

export function useMeetingProviderFormSave({
  mode,
  providerId,
  t,
  notifications,
  router,
  setErrorMsg,
}: Readonly<UseMeetingProviderFormSaveParams>) {
  const [createProvider, { loading: isCreating }] = useMutation(createMeetingProviderMutationDocument, {
    onError: error => {
      logger.error("Create meeting provider failed:", error.message);
    },
  });

  const [updateProvider, { loading: isUpdating }] = useMutation(updateMeetingProviderMutationDocument, {
    onError: error => {
      logger.error("Update meeting provider failed:", error.message);
    },
  });

  const save = useCallback(
    async (values: MeetingProviderFormData, isUrlExampleValid: boolean) => {
      if (!isUrlExampleValid) {
        setErrorMsg(t.validation.urlAllowlistInvalid);
        return;
      }
      setErrorMsg(null);

      const input = buildProviderInput(values);

      try {
        if (mode === "create") {
          await createProvider({ variables: { input } });
          notifications.show(t.createSuccess, { severity: "success", autoHideDuration: 3000 });
        } else if (mode === "edit" && providerId) {
          await updateProvider({ variables: { id: providerId, input } });
          notifications.show(t.updateSuccess, { severity: "success", autoHideDuration: 3000 });
        }
        router.push("/meeting-providers");
      } catch (error) {
        logger.error("Failed to save meeting provider:", error);
        setErrorMsg(t.operationFailed);
        notifications.show(t.operationFailed, { severity: "error", autoHideDuration: 4000 });
      }
    },
    [mode, providerId, t, notifications, router, setErrorMsg, createProvider, updateProvider]
  );

  return { isSaving: isCreating || isUpdating, save };
}
