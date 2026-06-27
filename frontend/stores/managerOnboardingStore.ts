import { useApolloClient, useMutation } from "@apollo/client/react";
import { create } from "zustand";
import type { ManagerOnboardingInput, ManagerOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";
import { createManagerMutationDocument } from "@/frontend/graphql/sharedDocuments";
import type { ManagerOnboardingFormData } from "@/frontend/views/dashboard/managers/onboarding/types";

interface ManagerOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: ManagerOnboardingResult | null;
  readonly reset: () => void;
}

export const useManagerOnboardingStore = create<ManagerOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));

export function useCreateManagerMutation() {
  const [mutate, { loading, error, data }] = useMutation(createManagerMutationDocument);
  const store = useManagerOnboardingStore();
  const { cache } = useApolloClient();

  const execute = async (formData: ManagerOnboardingFormData) => {
    store.reset();
    useManagerOnboardingStore.setState({ isSubmitting: true });

    try {
      const input: ManagerOnboardingInput = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        skypeId: formData.skypeId || null,
        accountType: formData.accountType,
        password: formData.password,
      };

      const result = await mutate({ variables: { input } });

      if (result.data?.createManager) {
        cache.evict({ id: "ROOT_QUERY", fieldName: "managerDirectory" });
        cache.gc();
        useManagerOnboardingStore.setState({ result: result.data.createManager, isSubmitting: false });
        return result.data.createManager;
      }

      throw new Error("Mutation returned no data");
    } catch (err) {
      useManagerOnboardingStore.setState({
        error: err instanceof Error ? err.message : "Unknown error",
        isSubmitting: false,
      });
      throw err;
    }
  };

  return { execute, loading, error, data };
}
