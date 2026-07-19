import { useApolloClient, useMutation } from "@apollo/client/react";
import { useState } from "react";
import {
  type ParentOnboardingInput,
  type ParentOnboardingResult,
  PaymentDirection,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createParentMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { createUserMeetingConfigMutationDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { useParentOnboardingStore } from "@/frontend/common/stores/parentOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";
import type { ParentOnboardingFormData } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import { formDetailsToInput } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormMappers";

export function useCreateParentOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createParentMutationDocument);
  const [meetingConfigWarning, setMeetingConfigWarning] = useState(false);
  const client = useApolloClient();
  const { cache } = client;

  const execute = async (formData: ParentOnboardingFormData): Promise<ParentOnboardingResult> => {
    useParentOnboardingStore.getState().reset();
    useParentOnboardingStore.setState({ isSubmitting: true });

    try {
      const input: ParentOnboardingInput = {
        name: formData.name,
        email: formData.email,
        avatarUrl: formData.avatarUrl ?? null,
        phone: formData.phone,
        nationality: formData.nationality || null,
        address: formData.address,
        whatsapp: formData.whatsapp || null,
        facebook: formData.facebook || null,
        twitter: formData.twitter || null,
        invoiceType: formData.invoiceType,
        feeAmount: formData.feeAmount,
        initialPayinMethod: {
          type: formData.payinMethod.type,
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
          try {
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
          } catch (meetingErr) {
            logger.warn("Parent created but meeting config failed", { meetingErr });
            setMeetingConfigWarning(true);
          }
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

  return {
    execute,
    loading,
    error,
    data,
    meetingConfigWarning,
    clearMeetingConfigWarning: () => setMeetingConfigWarning(false),
  };
}
