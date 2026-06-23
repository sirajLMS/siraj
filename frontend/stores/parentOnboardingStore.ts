import { useMutation } from "@apollo/client/react";
import { create } from "zustand";
import type { ParentOnboardingInput, ParentOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";
import { createParentMutationDocument } from "@/frontend/graphql/sharedDocuments";
import type { ParentOnboardingFormData } from "@/frontend/views/dashboard/parents/onboarding/types";

interface ParentOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: ParentOnboardingResult | null;
  readonly reset: () => void;
}

export const useParentOnboardingStore = create<ParentOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));

export function useCreateParentMutation() {
  const [mutate, { loading, error, data }] = useMutation(createParentMutationDocument);
  const store = useParentOnboardingStore();

  const execute = async (formData: ParentOnboardingFormData) => {
    store.reset();
    useParentOnboardingStore.setState({ isSubmitting: true });

    try {
      const input: ParentOnboardingInput = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        nationality: formData.nationality || null,
        address: formData.address,
        whatsapp: formData.whatsapp || null,
        facebook: formData.facebook || null,
        twitter: formData.twitter || null,
        skype: formData.skype || null,
        defaultZoomLink: formData.defaultZoomLink || null,
        invoiceType: formData.invoiceType,
        feeAmount: formData.feeAmount,
        paymentMethod: formData.paymentMethod,
        currency: formData.currency,
        timezone: formData.timezone || null,
        password: "",
      };

      const result = await mutate({ variables: { input } });

      if (result.data?.createParent) {
        useParentOnboardingStore.setState({ result: result.data.createParent, isSubmitting: false });
        return result.data.createParent;
      }

      throw new Error("Mutation returned no data");
    } catch (err) {
      useParentOnboardingStore.setState({
        error: err instanceof Error ? err.message : "Unknown error",
        isSubmitting: false,
      });
      throw err;
    }
  };

  return { execute, loading, error, data };
}
