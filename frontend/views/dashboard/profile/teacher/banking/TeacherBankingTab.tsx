"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Grid, Skeleton, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ProfileMode } from "@/backend/types/profile/profile.types";
import { profileByUserIdQueryDocument } from "@/frontend/graphql/sharedDocuments/profile.documents";
import { TeacherBankingEmptyState } from "@/frontend/views/dashboard/profile/teacher/banking/TeacherBankingEmptyState";
import { TeacherBankingView } from "@/frontend/views/dashboard/profile/teacher/banking/TeacherBankingView";

type TeacherBankingTabProps = {
  readonly targetUserId: string;
  readonly mode: ProfileMode;
};

function BankingSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Skeleton variant="rounded" height={88} />
      <Box sx={{ borderRadius: 2, overflow: "hidden", border: theme => `1px solid ${theme.palette.divider}` }}>
        <Skeleton variant="rectangular" height={56} />
        <Grid container spacing={3} sx={{ p: 3 }}>
          {["a", "b", "c", "d", "e", "f"].map(id => (
            <Grid key={id} size={{ xs: 12, md: 6 }}>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rounded" height={48} sx={{ mt: 1 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={72} />
      </Box>
    </Box>
  );
}

export function TeacherBankingTab({ targetUserId, mode }: TeacherBankingTabProps) {
  const tc = useTranslations("profile");

  const { data, loading, error } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
    fetchPolicy: "cache-and-network",
  });

  const bankingSummary = data?.profileByUserId?.bankingSummary;

  if (loading && !bankingSummary) {
    return <BankingSkeleton />;
  }

  if (error) {
    return (
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.error.main }}>
        {tc("errors.failedToLoad")}
      </Typography>
    );
  }

  if (!bankingSummary) {
    return <TeacherBankingEmptyState />;
  }

  return <TeacherBankingView banking={bankingSummary} targetUserId={targetUserId} mode={mode} />;
}
