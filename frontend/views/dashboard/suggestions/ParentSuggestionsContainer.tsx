"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { submitSuggestionMutationDocument } from "@/frontend/graphql/sharedDocuments/suggestion.documents";
import { useParentSuggestionsStore } from "@/frontend/stores/parentSuggestionsStore";
import { ParentSuggestionsView } from "./ParentSuggestionsView";
import type { SuggestionFormData } from "./schemas/suggestionFormSchema";
import { buildSuggestionsLabels } from "./utils/buildSuggestionsLabels";

export function ParentSuggestionsContainer() {
  const t = useTranslations("dashboard.suggestions");
  const labels = buildSuggestionsLabels(t);

  const isSubmitting = useParentSuggestionsStore(state => state.isSubmitting);
  const showSuccess = useParentSuggestionsStore(state => state.showSuccess);
  const setSubmitting = useParentSuggestionsStore(state => state.setSubmitting);
  const resetSuccess = useParentSuggestionsStore(state => state.resetSuccess);

  const [submitSuggestion] = useMutation(submitSuggestionMutationDocument, {
    onCompleted: () => {
      setSubmitting(false);
      useParentSuggestionsStore.setState({ showSuccess: true });
    },
    onError: () => {
      setSubmitting(false);
    },
  });

  const handleSubmit = (formData: SuggestionFormData) => {
    setSubmitting(true);
    resetSuccess();
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
        showSuccess={showSuccess}
        canSubmit={true}
        onSubmit={handleSubmit}
        onDismissSuccess={resetSuccess}
      />
    </RequirePermission>
  );
}
