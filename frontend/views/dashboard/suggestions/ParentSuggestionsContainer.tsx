"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { submitSuggestionMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useParentSuggestionsStore } from "@/frontend/common/stores/parentSuggestionsStore";
import { ParentSuggestionsView } from "@/frontend/views/dashboard/suggestions/parentSuggestionsView";
import type { SuggestionFormData } from "@/frontend/views/dashboard/suggestions/schemas/suggestionFormSchema";
import { buildSuggestionsLabels } from "@/frontend/views/dashboard/suggestions/utils/buildSuggestionsLabels";

export function ParentSuggestionsContainer() {
  const t = useTranslations("dashboard.suggestions");
  const labels = buildSuggestionsLabels(t);
  const notifications = useNotifications();

  const isSubmitting = useParentSuggestionsStore(state => state.isSubmitting);
  const setSubmitting = useParentSuggestionsStore(state => state.setSubmitting);

  const [submitSuggestion] = useMutation(submitSuggestionMutationDocument, {
    onCompleted: () => {
      setSubmitting(false);
      notifications.show(labels.parent.notifications.submitSuccess, {
        severity: "success",
        autoHideDuration: 4000,
      });
    },
    onError: () => {
      setSubmitting(false);
      notifications.show(labels.parent.notifications.submitError, {
        severity: "error",
        autoHideDuration: 5000,
      });
    },
  });

  const handleSubmit = (formData: SuggestionFormData) => {
    setSubmitting(true);
    void submitSuggestion({
      variables: {
        input: {
          submitterName: formData.fullName,
          body: formData.suggestion,
        },
      },
    });
  };

  return (
    <RequirePermission permissions={[AppPermission.CommunicationSubmitSuggestion]}>
      <ParentSuggestionsView
        labels={labels.parent}
        isSubmitting={isSubmitting}
        canSubmit={true}
        onSubmit={handleSubmit}
      />
    </RequirePermission>
  );
}
