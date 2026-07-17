"use client";

import { SendOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { ParentSuggestionsViewModel } from "@/frontend/common/views/dashboard/suggestions/useParentSuggestionsViewModel";
import { DesktopBaseCard, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
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
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} />

      <SuggestionHeroBannerDesktop labels={labels} />

      <Box sx={{ maxWidth: 960, mx: "auto", width: "100%" }}>
        <DesktopBaseCard>
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
            <DesktopPrimaryPageAction
              endIcon={<SendOutlined />}
              disabled={!canSubmit || isSubmitting}
              onClick={onFormSubmit}
              sx={{ px: 6, py: 2 }}
            >
              {labels.submit}
            </DesktopPrimaryPageAction>
            <SuggestionSocialProofDesktop labels={labels} />
          </Box>
        </DesktopBaseCard>

        <SuggestionSupportCardsDesktop labels={labels} />
      </Box>
    </DesktopPageContainer>
  );
}
