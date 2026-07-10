import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  PaymentDirection,
  type PaymentMethodDetailsInput,
  type PaymentMethodType,
  type TeacherOnboardingInput,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { createTeacherMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { createUserMeetingConfigMutationDocument } from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import { toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import { useTeacherOnboardingStore } from "@/frontend/stores/teacherOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import { formDetailsToInput } from "@/frontend/views/dashboard/profile/shared/payment-methods/paymentMethodFormMappers";
import type {
  TeacherOnboardingCreateResult,
  TeacherOnboardingFormData,
} from "@/frontend/views/dashboard/teachers/onboarding/types";

export function useCreateTeacherOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createTeacherMutationDocument);
  const client = useApolloClient();
  const { cache } = client;

  const execute = async (formData: TeacherOnboardingFormData): Promise<TeacherOnboardingCreateResult> => {
    useTeacherOnboardingStore.getState().reset();
    useTeacherOnboardingStore.setState({ isSubmitting: true });

    try {
      const details: PaymentMethodDetailsInput = formDetailsToInput(formData.payoutMethod.details);

      const input: TeacherOnboardingInput = {
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
          type: formData.payoutMethod.type as PaymentMethodType,
          direction: PaymentDirection.Payout,
          isDefault: true,
          label: formData.payoutMethod.label?.trim() || null,
          details,
        },
      };

      const result = await mutate({ variables: { input } });

      if (result.data?.createTeacher) {
        const created = result.data.createTeacher;
        if (formData.meetingProvider?.id && formData.meetingUrl?.trim() && created.userId) {
          await client.mutate({
            mutation: createUserMeetingConfigMutationDocument,
            variables: {
              input: {
                userId: created.userId,
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
        }

        cache.evict({ id: "ROOT_QUERY", fieldName: "teacherDirectory" });
        cache.gc();
        useTeacherOnboardingStore.setState({ result: created, isSubmitting: false });
        return created;
      }

      throw new Error("Mutation returned no data");
    } catch (err) {
      logger.error("Teacher creation failed:", { err });
      useTeacherOnboardingStore.setState({
        error: "operationFailed",
        isSubmitting: false,
      });
      throw err;
    }
  };

  return { execute, loading, error, data };
}
