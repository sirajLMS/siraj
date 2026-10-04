"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type {
  MeetingProviderFormViewProps,
  UseMeetingProviderFormViewModelProps,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";
import { defaultFormValues } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/useMeetingProviderFormViewModel.helpers";
import {
  useMeetingProviderFormProviderData,
  useMeetingProviderFormSave,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/form/useMeetingProviderFormViewModel.hooks";
import {
  type MeetingProviderFormData,
  meetingProviderFormSchema,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/schemas/meetingProviderFormSchema";
import { isUrlAllowedByProvider } from "@/shared/lib/meeting-config";
import { Translation, useAppTranslation } from "@/shared/locale";

const MEETING_PROVIDERS_PATH = "/meeting-providers";

export function useMeetingProviderFormViewModel({
  mode,
  providerId,
}: Readonly<UseMeetingProviderFormViewModelProps>): MeetingProviderFormViewProps {
  const router = useRouter();
  const t = useAppTranslation(Translation.Dashboard.MeetingProviders);
  const notifications = useNotifications();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MeetingProviderFormData>({
    resolver: zodResolver(meetingProviderFormSchema(t.validation)),
    defaultValues: defaultFormValues,
  });

  const urlAllowlist = useWatch({ control, name: "urlAllowlist" }) ?? [];
  const urlExample = useWatch({ control, name: "urlExample" }) ?? "";
  const providerKind = useWatch({ control, name: "providerKind" }) ?? "manual";

  useEffect(() => {
    setValue("supportsAutoGeneration", providerKind !== "manual");
  }, [providerKind, setValue]);

  const trimmedUrlExample = urlExample.trim();
  const isUrlExampleValid =
    !trimmedUrlExample || urlAllowlist.length === 0 || isUrlAllowedByProvider(trimmedUrlExample, urlAllowlist);

  const { isLoadingProvider } = useMeetingProviderFormProviderData({ mode, providerId, reset });
  const { isSaving, save } = useMeetingProviderFormSave({
    mode,
    providerId,
    t,
    notifications,
    router,
    setErrorMsg,
  });

  const handleCancel = useCallback(() => {
    router.push(MEETING_PROVIDERS_PATH);
  }, [router]);

  const submitForm = handleSubmit(values => save(values, isUrlExampleValid));

  return {
    mode,
    t,
    control,
    errors,
    register,
    setValue,
    watch,
    handleSubmit,
    isSaving,
    isLoadingProvider,
    errorMsg,
    isUrlExampleValid,
    onSubmit: () => {
      void submitForm();
    },
    onCancel: handleCancel,
  };
}
