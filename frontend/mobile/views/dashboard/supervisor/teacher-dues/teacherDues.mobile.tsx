"use client";

import { Typography } from "@mui/material";
import type { ReactNode } from "react";
import type {
  TeacherDueRow,
  TeacherDuesViewModel,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import {
  MobileCardList,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { DueCard } from "@/frontend/mobile/views/dashboard/supervisor/teacher-dues/teacherDues.mobile.parts";

export function TeacherDuesMobileView(props: Readonly<TeacherDuesViewModel>) {
  const { rows, loading, markingPaid, canMarkPaid, selectedDueIds, labels, onMarkPaid, onToggleDue } = props;

  const renderItem = (row: TeacherDueRow): ReactNode => (
    <DueCard
      row={row}
      labels={labels}
      selected={selectedDueIds.includes(row.id)}
      markingPaid={markingPaid}
      canMarkPaid={canMarkPaid}
      onToggle={onToggleDue}
      onMarkPaid={onMarkPaid}
    />
  );

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader
          title={labels.pageTitle}
          actions={
            canMarkPaid && selectedDueIds.length > 0 ? (
              <MobilePrimaryPageAction onClick={() => onMarkPaid(selectedDueIds)} disabled={markingPaid}>
                {labels.markAsPaidButton}
              </MobilePrimaryPageAction>
            ) : null
          }
        />

        {loading && (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.loadingMessage}
          </Typography>
        )}

        <MobileSectionPanel contentInset={false}>
          <MobileCardList<TeacherDueRow>
            rows={rows}
            emptyMessage={labels.noPendingDues}
            gap={2}
            layout="edge-to-edge"
            getKey={row => row.id}
            paginationOptions={{ mode: "client" }}
            renderItem={renderItem}
          />
        </MobileSectionPanel>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
