"use client";

import { useTranslations } from "next-intl";
import { useParentSuggestionsStore } from "@/frontend/stores/mockParentSuggestionsStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { ParentSuggestionsView } from "./ParentSuggestionsView";
import { buildSuggestionsLabels } from "./utils/buildSuggestionsLabels";

export function ParentSuggestionsContainer() {
  const t = useTranslations("dashboard.suggestions");
  const permissions = useUserStore(state => state.permissions);

  const isSubmitting = useParentSuggestionsStore(state => state.isSubmitting);
  const showSuccess = useParentSuggestionsStore(state => state.showSuccess);
  const setSubmitting = useParentSuggestionsStore(state => state.setSubmitting);
  const resetSuccess = useParentSuggestionsStore(state => state.resetSuccess);
  const submitSuggestion = useParentSuggestionsStore(state => state.submitSuggestion);

  const canSubmit = permissions.includes("suggestions-submit");

  if (!canSubmit) {
    return null;
  }

  const labels = buildSuggestionsLabels(t);

  const handleSubmit = (data: Parameters<typeof submitSuggestion>[0]) => {
    setSubmitting(true);
    resetSuccess();
    submitSuggestion(data);
    setSubmitting(false);
  };

  return (
    <ParentSuggestionsView
      labels={labels.parent}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      canSubmit={canSubmit}
      onSubmit={handleSubmit}
      onDismissSuccess={resetSuccess}
    />
  );
}
