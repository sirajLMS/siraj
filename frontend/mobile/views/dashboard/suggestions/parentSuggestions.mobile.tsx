"use client";

import { Box } from "@mui/material";
import { BaseCard, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { ParentSuggestionsViewModel } from "@/frontend/common/views/dashboard/suggestions/useParentSuggestionsViewModel";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { SuggestionFormFieldsMobile } from "@/frontend/mobile/views/dashboard/suggestions/components/suggestionFormFields.mobile";
import { SuggestionHeroBannerMobile } from "@/frontend/mobile/views/dashboard/suggestions/components/suggestionHeroBanner.mobile";
import { SuggestionSocialProofMobile } from "@/frontend/mobile/views/dashboard/suggestions/components/suggestionSocialProof.mobile";
import { SuggestionSupportCardsMobile } from "@/frontend/mobile/views/dashboard/suggestions/components/suggestionSupportCards.mobile";

export function ParentSuggestionsMobileView({
  labels,
  control,
  errors,
  isSubmitting,
  canSubmit,
  onFormSubmit,
}: Readonly<ParentSuggestionsViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} edgeToEdge={false} />

      <MobileContentStack gap={2} paddingBottom={12}>
        <SuggestionHeroBannerMobile labels={labels} />

        <BaseCard>
          <SuggestionFormFieldsMobile control={control} errors={errors} labels={labels} />
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
            <SuggestionSocialProofMobile labels={labels} />
          </Box>
        </BaseCard>

        <SuggestionSupportCardsMobile labels={labels} />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
