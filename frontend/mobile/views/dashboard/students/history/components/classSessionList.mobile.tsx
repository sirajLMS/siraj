"use client";

import { Box } from "@mui/material";
import type { ClassSessionListProps } from "@/frontend/common/views/dashboard/students/history/types";
import { useStudentHistoryLabels } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryLabels";
import { MobileCardList } from "@/frontend/mobile/components/ui";
import {
  formatDuration,
  getStatusLabel,
} from "@/frontend/mobile/views/dashboard/students/history/components/classSessionList.mobile.helpers";
import {
  ClassSessionCard,
  SessionListHeader,
} from "@/frontend/mobile/views/dashboard/students/history/components/classSessionList.mobile.parts";

export function ClassSessionListMobile({ dateStr, sessions }: Readonly<ClassSessionListProps>) {
  const labels = useStudentHistoryLabels();
  const t = labels.classDetails;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <SessionListHeader title={t.title} dateStr={dateStr} />

      <MobileCardList
        rows={sessions}
        emptyMessage={t.noSessions}
        getKey={session => session.id}
        paginationOptions={false}
        layout="edge-to-edge"
        renderItem={session => (
          <ClassSessionCard
            session={session}
            statusLabel={getStatusLabel(session.status, t.status)}
            durationLabel={formatDuration(session.duration, labels)}
          />
        )}
      />
    </Box>
  );
}
