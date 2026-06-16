"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ParentSuggestionsDesktopView } from "./ParentSuggestionsDesktopView";
import { ParentSuggestionsMobileView } from "./ParentSuggestionsMobileView";
import { suggestionFormSchema } from "./schemas/suggestionFormSchema";
import type { ParentSuggestionsViewProps } from "./types/suggestionsViewTypes";

export function ParentSuggestionsView({
  labels,
  isSubmitting,
  showSuccess,
  canSubmit,
  onSubmit,
  onDismissSuccess,
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

  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onDismissSuccess();
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, onDismissSuccess]);

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
    showSuccess,
    canSubmit,
    onDismissSuccess,
    onFormSubmit: handleFormSubmit,
  };

  if (isMobile) {
    return <ParentSuggestionsMobileView {...formProps} />;
  }

  return <ParentSuggestionsDesktopView {...formProps} />;
}
