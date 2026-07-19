"use client";

import { Box, Checkbox, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type {
  TeacherDueRow,
  TeacherDuesViewModel,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";

function DueCard({
  row,
  labels,
  selected,
  markingPaid,
  canMarkPaid,
  onToggle,
  onMarkPaid,
}: Readonly<{
  readonly row: TeacherDueRow;
  readonly labels: TeacherDuesViewModel["labels"];
  readonly selected: boolean;
  readonly markingPaid: boolean;
  readonly canMarkPaid: boolean;
  readonly onToggle: (id: string) => void;
  readonly onMarkPaid: (ids: string[]) => void;
}>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
          {canMarkPaid ? <Checkbox checked={selected} onChange={() => onToggle(row.id)} size="small" /> : null}
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
            <MobilePersonProfileLink
              href={profileHrefForTeacher({ userId: row.teacherUserId, teacherId: row.teacherId })}
              name={row.teacherName || row.teacherId}
              avatarUrl={row.teacherAvatarUrl}
            />
            <MobilePersonProfileLink
              href={row.studentId ? studentHref(row.studentId) : undefined}
              name={row.studentName || row.studentId}
              avatarUrl={row.studentAvatarUrl}
              label={labels.studentColumn}
            />
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.classDateColumn}: {row.classDate || "-"}
            </Typography>
          </Box>
          <MobileStatusBadge category="invoice" status={row.status ?? "PENDING"} label={row.status ?? "PENDING"} />
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

        {canMarkPaid ? (
          <MobilePrimaryPageAction
            size="small"
            onClick={() => onMarkPaid([row.id])}
            disabled={markingPaid}
            sx={{ alignSelf: "flex-start" }}
          >
            {labels.markAsPaidButton}
          </MobilePrimaryPageAction>
        ) : null}
      </Box>
    </MobileCardListItem>
  );
}

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

        {loading ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.loadingMessage}
          </Typography>
        ) : null}

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
