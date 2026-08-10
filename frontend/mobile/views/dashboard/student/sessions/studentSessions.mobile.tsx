"use client";

import { CalendarToday, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, type Theme, Typography } from "@mui/material";
import { useMemo } from "react";
import { scheduleOverviewCardShellSx } from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentSessionsViewModel } from "@/frontend/common/views/dashboard/student/sessions/useStudentSessionsViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { HistorySessionCardMobile } from "@/frontend/mobile/views/dashboard/student/sessions/components/historySessionCard.mobile";

const navButtonSx = (theme: Theme) => ({
  minWidth: 40,
  transform: theme.direction === "rtl" ? ("scaleX(-1)" as const) : undefined,
});

function MonthNavigator({
  monthLabel,
  canGoNext,
  labels,
  onPrevMonth,
  onNextMonth,
}: Readonly<{
  monthLabel: string;
  canGoNext: boolean;
  labels: StudentSessionsViewModel["labels"];
  onPrevMonth: () => void;
  onNextMonth: () => void;
}>): React.ReactNode {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
      <Button aria-label={labels.previousMonth} onClick={onPrevMonth} sx={navButtonSx}>
        <ChevronLeft />
      </Button>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <CalendarToday sx={theme => ({ fontSize: 18, color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {monthLabel}
        </Typography>
      </Box>
      <Button
        aria-label={labels.nextMonth}
        onClick={onNextMonth}
        disabled={!canGoNext}
        sx={theme => ({ ...navButtonSx(theme), opacity: canGoNext ? 1 : 0.5 })}
      >
        <ChevronRight />
      </Button>
    </Box>
  );
}

function SessionsFilters({
  subjectFilter,
  statusFilter,
  subjectOptions,
  statusOptions,
  labels,
  onSubjectFilterChange,
  onStatusFilterChange,
}: Readonly<{
  subjectFilter: string;
  statusFilter: string;
  subjectOptions: readonly string[];
  statusOptions: readonly string[];
  labels: StudentSessionsViewModel["labels"];
  onSubjectFilterChange: StudentSessionsViewModel["onSubjectFilterChange"];
  onStatusFilterChange: StudentSessionsViewModel["onStatusFilterChange"];
}>): React.ReactNode {
  return (
    <MobileContentInset sx={{ pt: 2.5 }}>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="mobile-sessions-subject-filter" shrink>
            {labels.filterBySubject}
          </InputLabel>
          <Select
            labelId="mobile-sessions-subject-filter"
            label={labels.filterBySubject}
            value={subjectFilter}
            onChange={e => onSubjectFilterChange(e.target.value)}
          >
            <MenuItem value="">{labels.allSubjects}</MenuItem>
            {subjectOptions.map(subject => (
              <MenuItem key={subject} value={subject}>
                {subject}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="mobile-sessions-status-filter" shrink>
            {labels.filterByStatus}
          </InputLabel>
          <Select
            labelId="mobile-sessions-status-filter"
            label={labels.filterByStatus}
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value)}
          >
            <MenuItem value="">{labels.allStatuses}</MenuItem>
            {statusOptions.map(status => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </MobileContentInset>
  );
}

function SessionsList({
  listRows,
  labels,
  locale,
  onOpenMeetingUrl,
}: Readonly<{
  listRows: readonly StudentHistorySessionRow[];
  labels: StudentSessionsViewModel["labels"];
  locale: string;
  onOpenMeetingUrl: StudentSessionsViewModel["onOpenMeetingUrl"];
}>): React.ReactNode {
  return (
    <MobileCardList<StudentHistorySessionRow>
      rows={listRows}
      emptyMessage={labels.noHistory}
      getKey={row => row.id}
      gap={0}
      layout="edge-to-edge"
      paginationOptions={{ mode: "client" }}
      renderItem={row => (
        <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
          <HistorySessionCardMobile row={row} labels={labels} locale={locale} onOpenMeetingUrl={onOpenMeetingUrl} />
        </MobileCardListItem>
      )}
    />
  );
}

export function StudentSessionsMobileView({
  filteredSessions,
  subjectOptions,
  statusOptions,
  subjectFilter,
  statusFilter,
  monthLabel,
  selectedDay,
  canGoNext,
  labels,
  locale,
  loading,
  onOpenMeetingUrl,
  onPrevMonth,
  onNextMonth,
  onSubjectFilterChange,
  onStatusFilterChange,
}: Readonly<StudentSessionsViewModel>) {
  const listRows = useMemo(() => {
    if (selectedDay == null) return filteredSessions;
    return filteredSessions.filter(s => s.dayOfMonth === selectedDay);
  }, [filteredSessions, selectedDay]);

  if (loading && filteredSessions.length === 0) {
    return (
      <MobilePageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.pageTitle} titleVariant="headlineMd" />

        <MonthNavigator
          monthLabel={monthLabel}
          canGoNext={canGoNext}
          labels={labels}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
        />

        <MobileSectionPanel title={labels.pageTitle} contentInset={false} sx={{ mt: 2 }}>
          <SessionsFilters
            subjectFilter={subjectFilter}
            statusFilter={statusFilter}
            subjectOptions={subjectOptions}
            statusOptions={statusOptions}
            labels={labels}
            onSubjectFilterChange={onSubjectFilterChange}
            onStatusFilterChange={onStatusFilterChange}
          />
          <SessionsList listRows={listRows} labels={labels} locale={locale} onOpenMeetingUrl={onOpenMeetingUrl} />
        </MobileSectionPanel>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
