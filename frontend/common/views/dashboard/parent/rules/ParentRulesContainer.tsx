"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { parentHandbookUrlQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAppTranslation } from "@/shared/locale";

export function ParentRulesContainer() {
  const t = useAppTranslation().dashboardTranslations.parentRules;
  const [handbookRequested, setHandbookRequested] = useState(false);
  const { data: handbookData, loading: handbookLoading } = useQuery(parentHandbookUrlQueryDocument, {
    skip: !handbookRequested,
  });

  useEffect(() => {
    if (handbookRequested && !handbookLoading) {
      if (handbookData?.parentHandbookUrl?.url) {
        globalThis.open(handbookData.parentHandbookUrl.url, "_blank");
      }
      setHandbookRequested(false);
    }
  }, [handbookRequested, handbookLoading, handbookData]);

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewFamily]}>
      <PageContainer>
        <PageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />
        {handbookLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : null}
        <SectionPanel title={t.sections.policies}>
          <Stack spacing={2}>
            <Typography sx={{ typography: "bodyLg", color: theme => theme.palette.text.secondary }}>
              {t.policyIntro}
            </Typography>
            <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
              {t.policyLeave}
            </Typography>
            <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
              {t.policyBilling}
            </Typography>
            <Button variant="outlined" onClick={() => setHandbookRequested(true)}>
              {t.downloadHandbook}
            </Button>
          </Stack>
        </SectionPanel>
      </PageContainer>
    </RequirePermission>
  );
}
