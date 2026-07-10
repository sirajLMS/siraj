import { useApolloClient, useMutation } from "@apollo/client/react";
import type { TeacherOnboardingInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { createTeacherMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import { useTeacherOnboardingStore } from "@/frontend/stores/teacherOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import type {
  TeacherOnboardingCreateResult,
  TeacherOnboardingFormData,
} from "@/frontend/views/dashboard/teachers/onboarding/types";

export function useCreateTeacherOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createTeacherMutationDocument);
  const { cache } = useApolloClient();

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
        beneficiaryName: formData.beneficiaryName,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        routingNumber: formData.routingNumber || null,
        swiftBic: formData.swiftBic || null,
        iban: formData.iban,
      };

      const result = await mutate({ variables: { input } });

      if (result.data?.createTeacher) {
        cache.evict({ id: "ROOT_QUERY", fieldName: "teacherDirectory" });
        cache.gc();
        useTeacherOnboardingStore.setState({ result: result.data.createTeacher, isSubmitting: false });
        return result.data.createTeacher;
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
