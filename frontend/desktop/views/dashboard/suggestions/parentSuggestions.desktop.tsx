"use client";

import { SendOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { BaseCard, PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { ParentSuggestionsViewModel } from "@/frontend/common/views/dashboard/suggestions/useParentSuggestionsViewModel";
import { SuggestionFormFieldsDesktop } from "@/frontend/desktop/views/dashboard/suggestions/components/suggestionFormFields.desktop";
import { SuggestionHeroBannerDesktop } from "@/frontend/desktop/views/dashboard/suggestions/components/suggestionHeroBanner.desktop";
import { SuggestionSocialProofDesktop } from "@/frontend/desktop/views/dashboard/suggestions/components/suggestionSocialProof.desktop";
import { SuggestionSupportCardsDesktop } from "@/frontend/desktop/views/dashboard/suggestions/components/suggestionSupportCards.desktop";

export function ParentSuggestionsDesktopView({
  labels,
  control,
  errors,
  isSubmitting,
  canSubmit,
  onFormSubmit,
}: Readonly<ParentSuggestionsViewModel>) {
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} />

      <SuggestionHeroBannerDesktop labels={labels} />

      <Box sx={{ maxWidth: 960, mx: "auto", width: "100%" }}>
        <BaseCard>
          <SuggestionFormFieldsDesktop control={control} errors={errors} labels={labels} />

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: 3,
              pt: 4,
            }}
          >
            <PrimaryPageAction
              endIcon={<SendOutlined />}
              disabled={!canSubmit || isSubmitting}
              onClick={onFormSubmit}
              sx={{ px: 6, py: 2 }}
            >
              {labels.submit}
            </PrimaryPageAction>
            <SuggestionSocialProofDesktop labels={labels} />
          </Box>
        </BaseCard>

        <SuggestionSupportCardsDesktop labels={labels} />
      </Box>
    </PageContainer>
  );
}
