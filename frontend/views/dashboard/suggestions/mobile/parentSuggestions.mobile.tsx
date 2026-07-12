"use client";

import { Box } from "@mui/material";
import {
  BaseCard,
  MobileContentStack,
  MobilePageHeader,
  PageContainer,
  PrimaryPageAction,
} from "@/frontend/components/ui";
import { SuggestionFormFields } from "@/frontend/views/dashboard/suggestions/components/SuggestionFormFields";
import { SuggestionHeroBanner } from "@/frontend/views/dashboard/suggestions/components/SuggestionHeroBanner";
import { SuggestionSocialProof } from "@/frontend/views/dashboard/suggestions/components/SuggestionSocialProof";
import { SuggestionSupportCards } from "@/frontend/views/dashboard/suggestions/components/SuggestionSupportCards";
import type { ParentSuggestionsViewModel } from "@/frontend/views/dashboard/suggestions/useParentSuggestionsViewModel";

export function ParentSuggestionsMobileView({
  labels,
  control,
  errors,
  isSubmitting,
  canSubmit,
  onFormSubmit,
}: Readonly<ParentSuggestionsViewModel>) {
  return (
    <PageContainer>
      <MobilePageHeader title={labels.pageTitle} edgeToEdge={false} />

      <MobileContentStack gap={2} paddingBottom={12}>
        <SuggestionHeroBanner labels={labels} variant="mobile" />

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
      </MobileContentStack>
    </PageContainer>
  );
}
