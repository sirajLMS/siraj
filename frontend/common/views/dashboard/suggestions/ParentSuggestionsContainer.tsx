"use client";
import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { submitSuggestionMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useParentSuggestionsStore } from "@/frontend/common/stores/parentSuggestionsStore";
import type { SuggestionFormData } from "@/frontend/common/views/dashboard/suggestions/schemas/suggestionFormSchema";
import {
  type ParentSuggestionsViewModel,
  type UseParentSuggestionsViewModelProps,
  useParentSuggestionsViewModel,
} from "@/frontend/common/views/dashboard/suggestions/useParentSuggestionsViewModel";
import { buildSuggestionsLabels } from "@/frontend/common/views/dashboard/suggestions/utils/buildSuggestionsLabels";
import { Translation, useAppTranslation } from "@/shared/locale";

const lazyViews = createLazyView<ParentSuggestionsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/suggestions/parentSuggestions.mobile").then(m => ({
      default: m.ParentSuggestionsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/suggestions/parentSuggestions.desktop").then(m => ({
      default: m.ParentSuggestionsDesktopView,
    }))
);

export function ParentSuggestionsContainer() {
  const labels = buildSuggestionsLabels(useAppTranslation(Translation.Dashboard.Suggestions));
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

  const props: UseParentSuggestionsViewModelProps = {
    labels: labels.parent,
    isSubmitting,
    canSubmit: true,
    onSubmit: handleSubmit,
  };

  const viewModel = useParentSuggestionsViewModel(props);

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { ParentSuggestionsViewModel, UseParentSuggestionsViewModelProps };
