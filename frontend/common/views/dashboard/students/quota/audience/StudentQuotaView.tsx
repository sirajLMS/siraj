"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Typography } from "@mui/material";
import type { ReactElement } from "react";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { QuotaEmptyState } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceBalanceCard";
import { QuotaAudienceContent } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceContent";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface StudentQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

export function StudentQuotaAudienceView({ t }: Readonly<StudentQuotaViewProps>): ReactElement {
  const user = useUserStore(s => s.user);
  const studentId = user?.id ?? "";

  const { data: meData } = useQuery(meQueryDocument, { skip: studentId !== "" });
  const effectiveStudentId = studentId || (meData?.me?.id ?? "");

  if (!effectiveStudentId) {
    logger.warn("StudentQuotaAudienceView: No student ID available");
    return <QuotaEmptyState message={t.audience.noQuotaAssigned} />;
  }

  return (
    <Box component="output" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="titleLg">{t.audience.studentTitle}</Typography>
      <QuotaAudienceContent studentId={effectiveStudentId} t={t} />
    </Box>
  );
}
