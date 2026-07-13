import { useApolloClient, useMutation } from "@apollo/client/react";
import type {
  ManagerOnboardingInput,
  ManagerOnboardingResult,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createManagerMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useManagerOnboardingStore } from "@/frontend/common/stores/managerOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";
import type { ManagerOnboardingFormData } from "@/frontend/common/views/dashboard/managers/onboarding/types";

export function useCreateManagerOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createManagerMutationDocument);
  const { cache } = useApolloClient();

  const execute = async (formData: ManagerOnboardingFormData): Promise<ManagerOnboardingResult> => {
    useManagerOnboardingStore.getState().reset();
    useManagerOnboardingStore.setState({ isSubmitting: true });

    try {
      const input: ManagerOnboardingInput = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
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
      logger.error("Manager creation failed:", { err });
      useManagerOnboardingStore.setState({
        error: "operationFailed",
        isSubmitting: false,
      });
      throw err;
    }
  };

  return { execute, loading, error, data };
}
