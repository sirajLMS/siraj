import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  type ParentOnboardingInput,
  type ParentOnboardingResult,
  PaymentDirection,
  type PaymentMethodType,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { createParentMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { createUserMeetingConfigMutationDocument } from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import { toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import { useParentOnboardingStore } from "@/frontend/stores/parentOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import type { ParentOnboardingFormData } from "@/frontend/views/dashboard/admin/parents/onboarding/types";
import { formDetailsToInput } from "@/frontend/views/dashboard/profile/shared/payment-methods/paymentMethodFormMappers";

export function useCreateParentOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createParentMutationDocument);
  const client = useApolloClient();
  const { cache } = client;

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
        invoiceType: formData.invoiceType,
        feeAmount: formData.feeAmount,
        initialPayinMethod: {
          type: formData.payinMethod.type as PaymentMethodType,
          direction: PaymentDirection.Payin,
          isDefault: true,
          label: formData.payinMethod.label?.trim() || null,
          details: formDetailsToInput(formData.payinMethod.details),
        },
        currency: formData.currency,
        timezone: toGraphqlIanaTimezone(formData.timezone || null),
        password: "",
      };

      const result = await mutate({ variables: { input } });

      if (result.data?.createParent) {
        const created = result.data.createParent;
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
