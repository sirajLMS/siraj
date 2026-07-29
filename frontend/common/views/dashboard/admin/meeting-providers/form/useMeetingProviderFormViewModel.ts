"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Resolver, useForm, useWatch } from "react-hook-form";
import {
  createMeetingProviderMutationDocument,
  meetingProviderQueryDocument,
  updateMeetingProviderMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { isUrlAllowedByProvider } from "@/frontend/common/lib/meeting-config";
import { logger } from "@/frontend/common/utils/logger";
import type {
  MeetingProviderFormViewProps,
  UseMeetingProviderFormViewModelProps,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";
import {
  type MeetingProviderFormData,
  meetingProviderFormSchema,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/schemas/meetingProviderFormSchema";
import { Translation, useAppTranslation } from "@/shared/locale";

const defaultFormValues: MeetingProviderFormData = {
  slug: "",
  name: { en: "", ar: "" },
  description: { en: "", ar: "" },
  instructions: { en: "", ar: "" },
  urlAllowlist: [],
  urlExample: "",
  logoUrl: null,
  supportsUsername: false,
  supportsPassword: false,
  supportsTenantId: false,
  isActive: true,
};

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
    resolver: zodResolver(meetingProviderFormSchema(t.validation)) as unknown as Resolver<MeetingProviderFormData>,
    defaultValues: defaultFormValues,
  });

  const urlAllowlist = useWatch({ control, name: "urlAllowlist" }) ?? [];
  const urlExample = useWatch({ control, name: "urlExample" }) ?? "";

  const isUrlExampleValid = Boolean(
    !urlExample.trim() || urlAllowlist.length === 0 || isUrlAllowedByProvider(urlExample.trim(), urlAllowlist)
  );

  const isEditing = mode === "edit" && Boolean(providerId);

  const { data: existingData, loading: isLoadingProvider } = useQuery(meetingProviderQueryDocument, {
    variables: { id: providerId ?? "" },
    skip: !isEditing,
  });

  const loadedProviderIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (isEditing && existingData?.meetingProvider && loadedProviderIdRef.current !== existingData.meetingProvider.id) {
      loadedProviderIdRef.current = existingData.meetingProvider.id ?? null;
      const provider = existingData.meetingProvider;
      reset({
        slug: provider.slug ?? "",
        name: provider.name ?? { en: "", ar: "" },
        description: provider.description ?? { en: "", ar: "" },
        instructions: provider.instructions ?? { en: "", ar: "" },
        urlAllowlist: [...(provider.urlAllowlist ?? [])],
        urlExample: provider.urlExample ?? "",
        logoUrl: provider.logoUrl ?? null,
        supportsUsername: Boolean(provider.fieldSchema?.supportsUsername),
        supportsPassword: Boolean(provider.fieldSchema?.supportsPassword),
        supportsTenantId: Boolean(provider.fieldSchema?.supportsTenantId),
        isActive: provider.isActive ?? true,
      });
    }
  }, [isEditing, existingData, reset]);

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

  const isSaving = isCreating || isUpdating;

  const handleCancel = useCallback(() => {
    router.push("/meeting-providers");
  }, [router]);

  const handleFormSubmit = handleSubmit(async (values: MeetingProviderFormData) => {
    if (!isUrlExampleValid) {
      setErrorMsg(t.validation.urlAllowlistInvalid);
      return;
    }
    setErrorMsg(null);

    const fieldSchema = {
      requiresMeetingUrl: true,
      supportsUsername: values.supportsUsername,
      supportsPassword: values.supportsPassword,
      supportsTenantId: values.supportsTenantId,
    };

    const nameSanitized = {
      en: (values.name?.en ?? "").trim() || (values.name?.ar ?? "").trim(),
      ar: (values.name?.ar ?? "").trim() || (values.name?.en ?? "").trim(),
    };

    const sanitizeLoc = (loc?: { en?: string; ar?: string }) => {
      const en = (loc?.en ?? "").trim();
      const ar = (loc?.ar ?? "").trim();
      if (!en && !ar) return null;
      return { en: en || ar, ar: ar || en };
    };

    const descriptionSanitized = sanitizeLoc(values.description);
    const instructionsSanitized = sanitizeLoc(values.instructions);

    try {
      if (mode === "create") {
        await createProvider({
          variables: {
            input: {
              slug: values.slug.trim(),
              name: nameSanitized,
              description: descriptionSanitized,
              instructions: instructionsSanitized,
              urlAllowlist: values.urlAllowlist,
              urlExample: values.urlExample?.trim() || null,
              logoUrl: values.logoUrl?.trim() || null,
              fieldSchema,
              isActive: values.isActive,
            },
          },
        });
        notifications.show(t.createSuccess, { severity: "success", autoHideDuration: 3000 });
      } else if (mode === "edit" && providerId) {
        await updateProvider({
          variables: {
            id: providerId,
            input: {
              slug: values.slug.trim(),
              name: nameSanitized,
              description: descriptionSanitized,
              instructions: instructionsSanitized,
              urlAllowlist: values.urlAllowlist,
              urlExample: values.urlExample?.trim() || null,
              logoUrl: values.logoUrl?.trim() || null,
              fieldSchema,
              isActive: values.isActive,
            },
          },
        });
        notifications.show(t.updateSuccess, { severity: "success", autoHideDuration: 3000 });
      }
      router.push("/meeting-providers");
    } catch (error) {
      logger.error("Failed to save meeting provider:", error);
      setErrorMsg(t.operationFailed);
      notifications.show(t.operationFailed, { severity: "error", autoHideDuration: 4000 });
    }
  });

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
      void handleFormSubmit();
    },
    onCancel: handleCancel,
  };
}
