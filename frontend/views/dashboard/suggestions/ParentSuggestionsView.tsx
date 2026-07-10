"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMediaQuery, useTheme } from "@mui/material";
import { useForm } from "react-hook-form";
import { ParentSuggestionsDesktopView } from "@/frontend/views/dashboard/suggestions/ParentSuggestionsDesktopView";
import { ParentSuggestionsMobileView } from "@/frontend/views/dashboard/suggestions/ParentSuggestionsMobileView";
import { suggestionFormSchema } from "@/frontend/views/dashboard/suggestions/schemas/suggestionFormSchema";
import type { ParentSuggestionsViewProps } from "@/frontend/views/dashboard/suggestions/types/suggestionsView.types";

export function ParentSuggestionsView({
  labels,
  isSubmitting,
  canSubmit,
  onSubmit,
}: Readonly<ParentSuggestionsViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const schema = suggestionFormSchema(labels.validation);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
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

  const formProps = {
    labels,
    control,
    errors,
    isSubmitting,
    canSubmit,
    onFormSubmit: handleFormSubmit,
  };

  if (isMobile) {
    return <ParentSuggestionsMobileView {...formProps} />;
  }

  return <ParentSuggestionsDesktopView {...formProps} />;
}
