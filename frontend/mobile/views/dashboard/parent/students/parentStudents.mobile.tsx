"use client";

import { Typography } from "@mui/material";
import { buildParentStudentCardLabels } from "@/frontend/common/views/dashboard/parent/students/types/parentStudentCard.types";
import type { ParentStudentsViewModel } from "@/frontend/common/views/dashboard/parent/students/useParentStudentsViewModel";
import { MobileCardList, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ParentStudentMobileCard } from "@/frontend/mobile/views/dashboard/parent/students/components/parentStudentCard.mobile";

export function ParentStudentsMobileView({ labels, loading, error, rows }: Readonly<ParentStudentsViewModel>) {
  const cardLabels = buildParentStudentCardLabels(labels);

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {error ? (
        <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.errors.failedToLoad}</Typography>
      ) : (
        <MobileCardList
          rows={rows}
          loading={loading}
          emptyMessage={labels.noStudents}
          getKey={row => row.id}
          paginationOptions={{ mode: "client" }}
          layout="edge-to-edge"
          renderItem={row => <ParentStudentMobileCard row={row} labels={cardLabels} />}
        />
      )}
    </MobilePageContainer>
  );
}
