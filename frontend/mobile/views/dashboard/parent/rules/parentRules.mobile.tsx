"use client";

import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import type { ParentRulesViewModel } from "@/frontend/common/views/dashboard/parent/rules/useParentRulesViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function ParentRulesMobileView({ labels, handbookLoading, onDownloadHandbook }: Readonly<ParentRulesViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {handbookLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : null}
      <SectionPanel title={labels.sections.policies}>
        <Stack spacing={2}>
          <Typography sx={{ typography: "bodyLg", color: theme => theme.palette.text.secondary }}>
            {labels.policyIntro}
          </Typography>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {labels.policyLeave}
          </Typography>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {labels.policyBilling}
          </Typography>
          <Button variant="outlined" onClick={onDownloadHandbook}>
            {labels.downloadHandbook}
          </Button>
        </Stack>
      </SectionPanel>
    </MobilePageContainer>
  );
}
