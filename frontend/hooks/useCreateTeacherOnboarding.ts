import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  PaymentDirection,
  type PaymentMethodDetailsInput,
  PaymentMethodType,
  type TeacherOnboardingInput,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { createTeacherMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { createUserMeetingConfigMutationDocument } from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import { toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import { useTeacherOnboardingStore } from "@/frontend/stores/teacherOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import type {
  TeacherOnboardingCreateResult,
  TeacherOnboardingFormData,
} from "@/frontend/views/dashboard/teachers/onboarding/types";

function buildBankTransferDetails(formData: TeacherOnboardingFormData): PaymentMethodDetailsInput {
  return {
    beneficiaryName: formData.beneficiaryName,
    bankName: formData.bankName,
    accountNumber: formData.accountNumber,
    routingNumber: formData.routingNumber || null,
    swiftBic: formData.swiftBic || null,
    iban: formData.iban,
    identifier: null,
    note: null,
    onlineAccountId: null,
    paymentLinkId: null,
    phone: null,
    url: null,
    walletId: null,
  };
}

export function useCreateTeacherOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createTeacherMutationDocument);
  const client = useApolloClient();
  const { cache } = client;

  const execute = async (formData: TeacherOnboardingFormData): Promise<TeacherOnboardingCreateResult> => {
    useTeacherOnboardingStore.getState().reset();
    useTeacherOnboardingStore.setState({ isSubmitting: true });

    try {
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
          type: PaymentMethodType.BankTransfer,
          direction: PaymentDirection.Payout,
          isDefault: true,
          label: null,
          details: buildBankTransferDetails(formData),
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
