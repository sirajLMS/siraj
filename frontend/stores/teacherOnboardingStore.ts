import { useMutation } from "@apollo/client/react";
import { create } from "zustand";
import type { TeacherOnboardingInput, TeacherOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";
import { createTeacherMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import type { TeacherOnboardingFormData } from "@/frontend/views/dashboard/teachers/onboarding/types";

interface TeacherOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: TeacherOnboardingResult | null;
  readonly reset: () => void;
}

export const useTeacherOnboardingStore = create<TeacherOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));

export function useCreateTeacherMutation() {
  const [mutate, { loading, error, data }] = useMutation(createTeacherMutationDocument);
  const store = useTeacherOnboardingStore();

  const execute = async (formData: TeacherOnboardingFormData) => {
    store.reset();
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
        skypeId: formData.skypeId || null,
        zoomLink: formData.zoomLink || null,
        countryCode: formData.countryCode,
        zoomUsername: formData.zoomUsername || null,
        zoomPassword: formData.zoomPassword || null,
        timezone: formData.timezone,
        timezoneId: null,
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
