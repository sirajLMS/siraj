"use client";

import { Typography } from "@mui/material";
import { useMemo } from "react";
import { scheduleOverviewCardShellSx } from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import { MobileCardList, MobileCardListItem, MobileContentInset } from "@/frontend/mobile/components/ui";
import { HistoryDaySessionCardMobile } from "@/frontend/mobile/views/dashboard/student/history/components/historyDaySessionCard.mobile";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

function buildScheduleHeader(
  currentMonth: Date,
  effectiveSelectedDay: number,
  locale: string,
  scheduleFor: StudentHistoryViewModel["labels"]["scheduleFor"]
): string {
  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), effectiveSelectedDay);
  const localeTag = getLatnLocaleTag(locale);
  const weekday = new Intl.DateTimeFormat(localeTag, { weekday: "short" }).format(date);
  const month = new Intl.DateTimeFormat(localeTag, { month: "long" }).format(date);
  return scheduleFor(weekday, month, effectiveSelectedDay);
}

export interface HistoryDayScheduleSectionMobileProps {
  readonly currentMonth: StudentHistoryViewModel["currentMonth"];
  readonly effectiveSelectedDay: StudentHistoryViewModel["effectiveSelectedDay"];
  readonly sessions: readonly StudentHistorySessionRow[];
  readonly labels: StudentHistoryViewModel["labels"];
  readonly locale: string;
}

export function HistoryDayScheduleSectionMobile({
  currentMonth,
  effectiveSelectedDay,
  sessions,
  labels,
  locale,
}: Readonly<HistoryDayScheduleSectionMobileProps>) {
  const sectionTitle = useMemo(
    () => buildScheduleHeader(currentMonth, effectiveSelectedDay, locale, labels.scheduleFor),
    [currentMonth, effectiveSelectedDay, locale, labels.scheduleFor]
  );

  return (
    <MobileContentInset sx={{ mt: 2 }}>
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 700, mb: 1.5 })}>
        {sectionTitle}
      </Typography>
      <MobileCardList<StudentHistorySessionRow>
        rows={sessions}
        emptyMessage={labels.noHistory}
        getKey={row => row.id}
        gap={0}
        layout="edge-to-edge"
        paginationOptions={{ mode: "client" }}
        renderItem={row => (
          <MobileCardListItem
            variant="edge-to-edge"
            sx={theme => ({
              ...scheduleOverviewCardShellSx(theme),
              paddingBlock: theme.spacing(1.5),
            })}
          >
            <HistoryDaySessionCardMobile row={row} labels={labels} locale={locale} />
          </MobileCardListItem>
        )}
      />
    </MobileContentInset>
  );
}
