import { useApolloClient, useMutation } from "@apollo/client/react";
import type { GeneralUserCreateInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { createGeneralUserMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useGeneralUserOnboardingStore } from "@/frontend/common/stores/generalUserOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";

export function useCreateGeneralUser() {
  const [mutate, { loading, error }] = useMutation(createGeneralUserMutationDocument);
  const { cache } = useApolloClient();

  const execute = async (input: GeneralUserCreateInput): Promise<void> => {
    useGeneralUserOnboardingStore.getState().reset();

    try {
      const result = await mutate({ variables: { input } });

      if (!result.data?.createGeneralUser) {
        throw new Error("Mutation returned no data");
      }

      useGeneralUserOnboardingStore.getState().setResult(result.data.createGeneralUser);

      // Evict all directory queries — general users can be assigned to any
      // non-specialized group, so the new user may appear in any directory tab.
      cache.evict({ id: "ROOT_QUERY", fieldName: "users" });
      cache.evict({ id: "ROOT_QUERY", fieldName: "teacherDirectory" });
      cache.evict({ id: "ROOT_QUERY", fieldName: "managerDirectory" });
      cache.evict({ id: "ROOT_QUERY", fieldName: "parentDirectory" });
      cache.evict({ id: "ROOT_QUERY", fieldName: "studentDirectory" });
      cache.gc();
    } catch (err) {
      logger.error("General user creation failed:", { err });
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  return { execute, loading, error };
}
