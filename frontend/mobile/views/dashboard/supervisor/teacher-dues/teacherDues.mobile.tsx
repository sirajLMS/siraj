"use client";

import { Box, Checkbox, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import type { TeacherDueRow } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import type { TeacherDuesViewModel } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/useTeacherDuesViewModel";
import {
  MobileCardList,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";

interface DueCardProps {
  readonly row: TeacherDueRow;
  readonly labels: TeacherDuesViewModel["labels"];
  readonly selected: boolean;
  readonly markingPaid: boolean;
  readonly onToggle: (id: string) => void;
  readonly onMarkPaid: (ids: string[]) => void;
}

function DueCard({ row, labels, selected, markingPaid, onToggle, onMarkPaid }: Readonly<DueCardProps>) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        backgroundColor: theme.palette.surfaceContainer,
        borderRadius: theme.layout.radius.section,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      })}
    >
      <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
        <Checkbox checked={selected} onChange={() => onToggle(row.id)} size="small" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 500 })}>
            {row.teacherId}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.studentColumn}: {row.studentId}
          </Typography>
        </Box>
        <StatusBadge category="invoice" status={row.status ?? "PENDING"} label={row.status ?? "PENDING"} />
      </Stack>

      <Stack sx={{ flexDirection: "row", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.hoursColumn}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
            {row.hours}
          </Typography>
        </Box>
        <Box>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.amountColumn}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
            {row.currency} {row.amount}
          </Typography>
        </Box>
        <Box>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.approvedDateColumn}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
            {row.approvedAt || "-"}
          </Typography>
        </Box>
      </Stack>

      <PrimaryPageAction
        size="small"
        onClick={() => onMarkPaid([row.id])}
        disabled={markingPaid}
        sx={{ alignSelf: "flex-start" }}
      >
        {labels.markAsPaidButton}
      </PrimaryPageAction>
    </Box>
  );
}

interface TeacherDuesMobileViewProps extends TeacherDuesViewModel {
  readonly toggleDueId?: (id: string) => void;
}

export function TeacherDuesMobileView({
  rows,
  loading,
  markingPaid,
  selectedDueIds,
  labels,
  onMarkPaid,
  onToggleDue,
}: Readonly<TeacherDuesMobileViewProps>) {
  const renderItem = (row: TeacherDueRow): ReactNode => (
    <DueCard
      row={row}
      labels={labels}
      selected={selectedDueIds.includes(row.id)}
      markingPaid={markingPaid}
      onToggle={onToggleDue}
      onMarkPaid={onMarkPaid}
    />
  );

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.pageTitle} />

        {loading ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.loadingMessage}
          </Typography>
        ) : null}

        <SectionPanel>
          <MobileCardList<TeacherDueRow>
            rows={rows}
            emptyMessage={labels.noPendingDues}
            gap={2}
            layout="edge-to-edge"
            getKey={row => row.id}
            renderItem={renderItem}
          />
        </SectionPanel>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
