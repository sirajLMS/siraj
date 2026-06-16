"use client";

import { Box } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { BaseCard, PageContainer, PrimaryPageAction } from "@/frontend/components/ui";
import type { SuggestionsParentLabels } from "@/frontend/messages/types/dashboard/suggestions/main";
import { SubmissionSuccessBanner } from "@/frontend/views/dashboard/shared/SubmissionSuccessBanner";
import { SuggestionFormFields } from "./components/SuggestionFormFields";
import { SuggestionHeroBanner } from "./components/SuggestionHeroBanner";
import { SuggestionSocialProof } from "./components/SuggestionSocialProof";
import { SuggestionSupportCards } from "./components/SuggestionSupportCards";
import type { SuggestionFormData } from "./schemas/suggestionFormSchema";

interface ParentSuggestionsMobileViewProps {
  readonly labels: SuggestionsParentLabels;
  readonly control: Control<SuggestionFormData>;
  readonly errors: FieldErrors<SuggestionFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
  readonly onDismissSuccess: () => void;
  readonly onFormSubmit: () => void;
}

export function ParentSuggestionsMobileView({
  labels,
  control,
  errors,
  isSubmitting,
  showSuccess,
  canSubmit,
  onDismissSuccess,
  onFormSubmit,
}: Readonly<ParentSuggestionsMobileViewProps>) {
  return (
    <>
      {showSuccess ? (
        <Box sx={{ px: 2, pt: 1 }}>
          <SubmissionSuccessBanner message={labels.successMessage} onDismiss={onDismissSuccess} />
        </Box>
      ) : null}

      <PageContainer>
        <SuggestionHeroBanner labels={labels} variant="mobile" />

        <Box sx={{ pb: 12 }}>
          <BaseCard>
            <SuggestionFormFields control={control} errors={errors} labels={labels} variant="mobile" />
            <Box sx={{ pt: 3 }}>
              <PrimaryPageAction
                fullWidth
                disabled={!canSubmit || isSubmitting}
                onClick={onFormSubmit}
                sx={{ height: 56 }}
              >
                {labels.submit}
              </PrimaryPageAction>
            </Box>
            <Box sx={{ pt: 3 }}>
              <SuggestionSocialProof labels={labels} />
            </Box>
          </BaseCard>

          <SuggestionSupportCards labels={labels} variant="mobile" />
        </Box>
      </PageContainer>
    </>
  );
}
