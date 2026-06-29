"use client";

import { SendOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { BaseCard, PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/components/ui";
import { SuggestionFormFields } from "./components/SuggestionFormFields";
import { SuggestionHeroBanner } from "./components/SuggestionHeroBanner";
import { SuggestionSocialProof } from "./components/SuggestionSocialProof";
import { SuggestionSupportCards } from "./components/SuggestionSupportCards";
import type { ParentSuggestionsDesktopViewProps } from "./types/suggestionsView.types";

export function ParentSuggestionsDesktopView({
  labels,
  control,
  errors,
  isSubmitting,
  canSubmit,
  onFormSubmit,
}: Readonly<ParentSuggestionsDesktopViewProps>) {
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} />

      <SuggestionHeroBanner labels={labels} variant="desktop" />

      <Box sx={{ maxWidth: 960, mx: "auto", width: "100%" }}>
        <BaseCard>
          <SuggestionFormFields control={control} errors={errors} labels={labels} variant="desktop" />

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
            <SuggestionSocialProof labels={labels} />
          </Box>
        </BaseCard>

        <SuggestionSupportCards labels={labels} variant="desktop" />
      </Box>
    </PageContainer>
  );
}
