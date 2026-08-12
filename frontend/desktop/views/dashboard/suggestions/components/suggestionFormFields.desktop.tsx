"use client";

import { SuggestionFormFieldsShared } from "@/frontend/common/views/dashboard/suggestions/components/__shared__/suggestionFormFieldsShared";
import type { SuggestionFormFieldsProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

export function SuggestionFormFieldsDesktop({
  control,
  errors,
  labels,
}: Readonly<Omit<SuggestionFormFieldsProps, "variant">>) {
  return (
    <SuggestionFormFieldsShared control={control} errors={errors} labels={labels} fieldGap={4} suggestionMinRows={6} />
  );
}
