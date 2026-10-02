import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  type CreateTeacherMutation_createTeacher,
  PaymentDirection,
  type TeacherOnboardingInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { createTeacherMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { usePersistMeetingConfig } from "@/frontend/common/hooks/usePersistMeetingConfig";
import { toIanaTimezone } from "@/frontend/common/lib/timezone";
import { useTeacherOnboardingStore } from "@/frontend/common/stores/teacherOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";
import { formDetailsToInput } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormMappers";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";

function buildTeacherInput(formData: TeacherOnboardingFormData): TeacherOnboardingInput {
  return {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    avatarUrl: formData.avatarUrl ?? null,
    nationality: formData.nationality ?? null,
    nationalId: formData.nationalId
      ? { countryCode: formData.nationalId.countryCode ?? null, number: formData.nationalId.number }
      : null,
    phone: formData.phone ?? null,
    dateOfBirth: formData.dateOfBirth ?? null,
    gender: formData.gender,
    address: formData.address ?? null,
    qualifications: formData.qualifications ?? null,
    countryCode: formData.countryCode,
    timezone: toIanaTimezone(formData.timezone),
    displayCurrency: formData.displayCurrency ?? null,
    hourlyRate: formData.hourlyRate,
    rateCurrency: formData.rateCurrency,
    initialPayoutMethod: formData.payoutMethod?.type
      ? {
          type: formData.payoutMethod.type,
          direction: PaymentDirection.Payout,
          isDefault: true,
          label: formData.payoutMethod.label?.trim() ?? null,
          details: formDetailsToInput(formData.payoutMethod.details ?? {}),
        }
      : null,
  };
}

export function useCreateTeacherOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createTeacherMutationDocument);
  const client = useApolloClient();
  const { cache } = client;
  const { persistMeetingConfig, meetingConfigWarning, clearMeetingConfigWarning } = usePersistMeetingConfig();

  const handleTeacherCreated = (created: CreateTeacherMutation_createTeacher): void => {
    cache.evict({ id: "ROOT_QUERY", fieldName: "teacherDirectory" });
    cache.gc();
    useTeacherOnboardingStore.setState({ result: created, isSubmitting: false });
  };

  const execute = async (formData: TeacherOnboardingFormData): Promise<CreateTeacherMutation_createTeacher> => {
    useTeacherOnboardingStore.getState().reset();
    useTeacherOnboardingStore.setState({ isSubmitting: true });

    try {
      const input = buildTeacherInput(formData);
      const result = await mutate({ variables: { input } });

      if (!result.data?.createTeacher) {
        throw new Error("Mutation returned no data");
      }

      const created = result.data.createTeacher;
      if (created.userId) {
        await persistMeetingConfig(formData, created.userId, "Teacher");
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
    clearMeetingConfigWarning,
  };
}
