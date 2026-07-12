"use client";

import { Box } from "@mui/material";
import { BaseCard, PageContainer, PrimaryPageAction } from "@/frontend/components/ui";
import { SuggestionFormFields } from "@/frontend/views/dashboard/suggestions/components/SuggestionFormFields";
import { SuggestionHeroBanner } from "@/frontend/views/dashboard/suggestions/components/SuggestionHeroBanner";
import { SuggestionSocialProof } from "@/frontend/views/dashboard/suggestions/components/SuggestionSocialProof";
import { SuggestionSupportCards } from "@/frontend/views/dashboard/suggestions/components/SuggestionSupportCards";
import type { ParentSuggestionsMobileViewProps } from "@/frontend/views/dashboard/suggestions/types/suggestionsView.types";

export function ParentSuggestionsMobileView({
  labels,
  control,
  errors,
  isSubmitting,
  canSubmit,
  onFormSubmit,
}: Readonly<ParentSuggestionsMobileViewProps>) {
  return (
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
  );
}
