import { useApolloClient, useMutation } from "@apollo/client/react";
import { useState } from "react";
import {
  PaymentDirection,
  type PaymentMethodDetailsInput,
  type TeacherOnboardingInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createTeacherMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { createUserMeetingConfigMutationDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { useTeacherOnboardingStore } from "@/frontend/common/stores/teacherOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";
import { formDetailsToInput } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormMappers";
import type {
  TeacherOnboardingCreateResult,
  TeacherOnboardingFormData,
} from "@/frontend/common/views/dashboard/teachers/onboarding/types";

export function useCreateTeacherOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createTeacherMutationDocument);
  const [meetingConfigWarning, setMeetingConfigWarning] = useState(false);
  const client = useApolloClient();
  const { cache } = client;

  const buildTeacherInput = (formData: TeacherOnboardingFormData): TeacherOnboardingInput => {
    const details: PaymentMethodDetailsInput = formDetailsToInput(formData.payoutMethod.details);
    return {
      name: formData.name,
      email: formData.email,
      password: "",
      nationality: formData.nationality || null,
      nationalId: formData.nationalId,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth || null,
      gender: formData.gender,
      address: formData.address || null,
      qualifications: formData.qualifications || null,
      countryCode: formData.countryCode,
      timezone: toGraphqlIanaTimezone(formData.timezone),
      hourlyRate: formData.hourlyRate,
      rateCurrency: formData.rateCurrency,
      initialPayoutMethod: {
        type: formData.payoutMethod.type,
        direction: PaymentDirection.Payout,
        isDefault: true,
        label: formData.payoutMethod.label?.trim() || null,
        details,
      },
    };
  };

  const createMeetingConfig = async (formData: TeacherOnboardingFormData, userId: string): Promise<void> => {
    if (!formData.meetingProvider?.id || !formData.meetingUrl?.trim()) return;
    try {
      await client.mutate({
        mutation: createUserMeetingConfigMutationDocument,
        variables: {
          input: {
            userId,
            providerId: formData.meetingProvider.id,
            label: formData.meetingLabel?.trim() || null,
            isDefault: true,
            password: null,
            details: {
              meetingUrl: formData.meetingUrl.trim(),
              username: null,
              tenantId: null,
            },
          },
        },
      });
    } catch (meetingErr) {
      logger.warn("Teacher created but meeting config failed", { meetingErr });
      setMeetingConfigWarning(true);
    }
  };

  const handleTeacherCreated = (created: TeacherOnboardingCreateResult): void => {
    cache.evict({ id: "ROOT_QUERY", fieldName: "teacherDirectory" });
    cache.gc();
    useTeacherOnboardingStore.setState({ result: created, isSubmitting: false });
  };

  const execute = async (formData: TeacherOnboardingFormData): Promise<TeacherOnboardingCreateResult> => {
    useTeacherOnboardingStore.getState().reset();
    useTeacherOnboardingStore.setState({ isSubmitting: true });
    setMeetingConfigWarning(false);

    try {
      const input = buildTeacherInput(formData);
      const result = await mutate({ variables: { input } });

      if (!result.data?.createTeacher) {
        throw new Error("Mutation returned no data");
      }

      const created = result.data.createTeacher;
      if (created.userId) {
        await createMeetingConfig(formData, created.userId);
      }
      handleTeacherCreated(created);
      return created;
    } catch (err) {
      logger.error("Teacher creation failed:", { err });
      useTeacherOnboardingStore.setState({
        error: "operationFailed",
        isSubmitting: false,
      });
      throw err;
    }
  };

  return {
    execute,
    loading,
    error,
    data,
    meetingConfigWarning,
    clearMeetingConfigWarning: () => setMeetingConfigWarning(false),
  };
}
