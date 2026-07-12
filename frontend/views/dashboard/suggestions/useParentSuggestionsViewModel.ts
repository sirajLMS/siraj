"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type Control, type FieldErrors, useForm } from "react-hook-form";
import {
  type SuggestionFormData,
  suggestionFormSchema,
} from "@/frontend/views/dashboard/suggestions/schemas/suggestionFormSchema";
import type { SuggestionsLabels } from "@/shared/messages/types/dashboard/suggestions/main";

/**
 * ParentSuggestions ViewModel.
 *
 * The container (`ParentSuggestionsContainer`) owns the GraphQL mutation,
 * notification side effects, and the `isSubmitting`/`canSubmit` flags
 * (read from the Zustand `parentSuggestionsStore`). It passes a flat prop
 * bag to this hook. The ViewModel owns the `react-hook-form` instance
 * (schema resolution, `control`, `errors`, `handleSubmit`, `reset`) and the
 * `onFormSubmit` handler. Per the Phase 4 migration plan and the established
 * Phase 3 pattern, form state lives in RHF because the hook sits above the
 * tier-switch unmount boundary (the switcher renders either the mobile or
 * desktop tree but the hook is shared), so the RHF state survives the
 * viewport tier switch. No viewport logic ever lives here.
 *
 * Note: `control` is a non-serializable function-bearing object and is
 * therefore intentionally NOT stored in the Zustand store — it is created
 * here in the hook and passed through to both tiers via the view model.
 */
export interface ParentSuggestionsViewModel {
  readonly labels: SuggestionsLabels["parent"];
  readonly control: Control<SuggestionFormData>;
  readonly errors: FieldErrors<SuggestionFormData>;
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly onFormSubmit: () => void;
}

export interface UseParentSuggestionsViewModelProps {
  readonly labels: SuggestionsLabels["parent"];
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly onSubmit: (data: SuggestionFormData) => void;
}

export function useParentSuggestionsViewModel(
  props: Readonly<UseParentSuggestionsViewModelProps>
): ParentSuggestionsViewModel {
  const { labels, isSubmitting, canSubmit, onSubmit } = props;

  const schema = suggestionFormSchema(labels.validation);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuggestionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      suggestion: "",
    },
  });

  const handleFormSubmit = () => {
    handleSubmit(data => {
      onSubmit(data);
      reset();
    })();
  };

  return {
    labels,
    control,
    errors,
    isSubmitting,
    canSubmit,
    onFormSubmit: handleFormSubmit,
  };
}
