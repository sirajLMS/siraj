"use client";

import { Box } from "@mui/material";
import type { ParentSuggestionsViewModel } from "@/frontend/common/views/dashboard/suggestions/useParentSuggestionsViewModel";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
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

        <MobileBaseCard>
          <SuggestionFormFieldsMobile control={control} errors={errors} labels={labels} />
          <Box sx={{ pt: 3 }}>
            <MobilePrimaryPageAction
              fullWidth
              disabled={!canSubmit || isSubmitting}
              onClick={onFormSubmit}
              sx={{ height: 56 }}
            >
              {labels.submit}
            </MobilePrimaryPageAction>
          </Box>
          <Box sx={{ pt: 3 }}>
            <SuggestionSocialProofMobile labels={labels} />
          </Box>
        </MobileBaseCard>

        <SuggestionSupportCardsMobile labels={labels} />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
