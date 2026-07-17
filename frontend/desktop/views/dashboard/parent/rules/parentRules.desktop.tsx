"use client";

import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { ParentRulesViewModel } from "@/frontend/common/views/dashboard/parent/rules/useParentRulesViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function ParentRulesDesktopView({
  labels,
  handbookLoading,
  onDownloadHandbook,
}: Readonly<ParentRulesViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {handbookLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : null}
      <DesktopSectionPanel title={labels.sections.policies}>
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
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
