"use client";

import { ScheduleTimezoneOffsetCell } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleTimezoneOffsetCell";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { ScheduleSessionMetaStatItem } from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout";
import type { ScheduleOverviewDataHeaders } from "@/frontend/common/views/dashboard/types/dashboard";

/** Builds the meta stats shown under the schedule card time highlight, including optional timezone cells. */
export function buildScheduleMetaItems(
  headers: ScheduleOverviewDataHeaders,
  row: DailyScheduleRow,
  duration: string,
  showTimezones: boolean
): ScheduleSessionMetaStatItem[] {
  return [
    ...(showTimezones
      ? ([
          {
            label: headers.teacherTime,
            value: (
              <ScheduleTimezoneOffsetCell
                timeValue={row.teacherTime}
                timezone={row.teacherTimezone}
                at={row.scheduledStartAt}
              />
            ),
            tone: "teacher",
          },
          {
            label: headers.studentTime,
            value: (
              <ScheduleTimezoneOffsetCell
                timeValue={row.studentTime}
                timezone={row.studentTimezone}
                at={row.scheduledStartAt}
              />
            ),
            tone: "student",
          },
        ] satisfies ScheduleSessionMetaStatItem[])
      : []),
    { label: headers.duration, value: duration, tone: "default" },
  ];
}
