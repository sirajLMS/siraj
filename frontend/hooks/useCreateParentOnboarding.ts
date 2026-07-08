import { useApolloClient, useMutation } from "@apollo/client/react";
import type { ParentOnboardingInput, ParentOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";
import { createParentMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { useParentOnboardingStore } from "@/frontend/stores/parentOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import type { ParentOnboardingFormData } from "@/frontend/views/dashboard/admin/parents/onboarding/types";

export function useCreateParentOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createParentMutationDocument);
  const { cache } = useApolloClient();

  const execute = async (formData: ParentOnboardingFormData): Promise<ParentOnboardingResult> => {
    useParentOnboardingStore.getState().reset();
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
        cache.evict({ id: "ROOT_QUERY", fieldName: "parentDirectory" });
        cache.gc();
        useParentOnboardingStore.setState({ result: result.data.createParent, isSubmitting: false });
        return result.data.createParent;
      }

      throw new Error("Mutation returned no data");
    } catch (err) {
      logger.error("Parent creation failed:", { err });
      useParentOnboardingStore.setState({
        error: "operationFailed",
        isSubmitting: false,
      });
      throw err;
    }
  };

  return { execute, loading, error, data };
}
