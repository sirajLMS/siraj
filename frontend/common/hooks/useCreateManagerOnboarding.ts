import { useApolloClient, useMutation } from "@apollo/client/react";
import type {
  CreateManagerMutation_createManager,
  ManagerOnboardingInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { createManagerMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { toIanaTimezone } from "@/frontend/common/lib/timezone";
import { useStaffOnboardingStore } from "@/frontend/common/stores/staffOnboardingStore";
import type { ManagerOnboardingFormData } from "@/frontend/common/types/shared.types";
import { logger } from "@/frontend/common/utils/logger";

export function useCreateManagerOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createManagerMutationDocument);
  const { cache } = useApolloClient();

  const execute = async (formData: ManagerOnboardingFormData): Promise<CreateManagerMutation_createManager> => {
    useStaffOnboardingStore.getState().reset();
    useStaffOnboardingStore.setState({ isSubmitting: true });

    try {
      const input: ManagerOnboardingInput = {
        name: formData.name,
        email: formData.email,
        avatarUrl: formData.avatarUrl ?? null,
        phone: formData.phone ?? null,
        timezone: toIanaTimezone(formData.timezone),
        displayCurrency: formData.displayCurrency ?? null,
        accountType: formData.accountType,
        password: formData.password,
      };

      const result = await mutate({ variables: { input } });

      if (result.data?.createManager) {
        cache.evict({ id: "ROOT_QUERY", fieldName: "managerDirectory" });
        cache.gc();
        useStaffOnboardingStore.setState({ result: result.data.createManager, isSubmitting: false });
        return result.data.createManager;
      }

      throw new Error("Mutation returned no data");
    } catch (err) {
      logger.error("Manager creation failed:", { err });
      useStaffOnboardingStore.setState({
        error: "operationFailed",
        isSubmitting: false,
      });
      throw err;
    }
  };

  return { execute, loading, error, data };
}
