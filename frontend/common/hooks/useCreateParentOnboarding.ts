import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  type CreateParentMutation_createParent,
  type ParentOnboardingInput,
  PaymentDirection,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { createParentMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { usePersistMeetingConfig } from "@/frontend/common/hooks/usePersistMeetingConfig";
import { toIanaTimezone } from "@/frontend/common/lib/timezone";
import { useParentOnboardingStore } from "@/frontend/common/stores/parentOnboardingStore";
import type { ParentOnboardingFormData } from "@/frontend/common/types/shared.types";
import { logger } from "@/frontend/common/utils/logger";
import { formDetailsToInput } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormMappers";

function buildParentInput(formData: ParentOnboardingFormData): ParentOnboardingInput {
  return {
    name: formData.name,
    email: formData.email,
    avatarUrl: formData.avatarUrl ?? null,
    phone: formData.phone ?? null,
    nationality: formData.nationality ?? null,
    address: formData.address ?? null,
    whatsapp: formData.whatsapp ?? null,
    facebook: formData.facebook ?? null,
    twitter: formData.twitter ?? null,
    invoiceType: formData.invoiceType ?? null,
    feeAmount: formData.feeAmount ?? null,
    initialPayinMethod: formData.payinMethod?.type
      ? {
          type: formData.payinMethod.type,
          direction: PaymentDirection.Payin,
          isDefault: true,
          label: formData.payinMethod.label?.trim() ?? null,
          details: formDetailsToInput(formData.payinMethod.details ?? {}),
        }
      : null,
    currency: formData.currency,
    timezone: toIanaTimezone(formData.timezone || null),
    displayCurrency: formData.displayCurrency ?? null,
    password: formData.password,
  };
}

export function useCreateParentOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createParentMutationDocument);
  const client = useApolloClient();
  const { cache } = client;
  const { persistMeetingConfig, meetingConfigWarning, clearMeetingConfigWarning } = usePersistMeetingConfig();

  const persistCreatedParent = (created: CreateParentMutation_createParent) => {
    cache.evict({ id: "ROOT_QUERY", fieldName: "parentDirectory" });
    cache.gc();
    useParentOnboardingStore.setState({ result: created, isSubmitting: false });
    return created;
  };

  const execute = async (formData: ParentOnboardingFormData): Promise<CreateParentMutation_createParent> => {
    useParentOnboardingStore.getState().reset();
    useParentOnboardingStore.setState({ isSubmitting: true });

    try {
      const input = buildParentInput(formData);
      const result = await mutate({ variables: { input } });

      const created = result.data?.createParent;
      if (created) {
        if (created.userId) {
          await persistMeetingConfig(formData, created.userId, "Parent");
        }
        return persistCreatedParent(created);
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
    clearMeetingConfigWarning,
  };
}
