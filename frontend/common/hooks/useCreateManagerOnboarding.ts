import { useApolloClient, useMutation } from "@apollo/client/react";
import type {
  ManagerOnboardingInput,
  ManagerOnboardingResult,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createManagerMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { useStaffOnboardingStore } from "@/frontend/common/stores/staffOnboardingStore";
import type { ManagerOnboardingFormData } from "@/frontend/common/types/shared.types";
import { logger } from "@/frontend/common/utils/logger";

export function useCreateManagerOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createManagerMutationDocument);
  const { cache } = useApolloClient();

  const execute = async (formData: ManagerOnboardingFormData): Promise<ManagerOnboardingResult> => {
    useStaffOnboardingStore.getState().reset();
    useStaffOnboardingStore.setState({ isSubmitting: true });

    try {
      const input: ManagerOnboardingInput = {
        name: formData.name,
        email: formData.email,
        avatarUrl: formData.avatarUrl ?? null,
        phone: formData.phone || null,
        timezone: toGraphqlIanaTimezone(formData.timezone),
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
