"use client";

import { Box, Typography } from "@mui/material";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import { StatusBadge } from "@/frontend/common/components/ui";
import {
  fieldLabelSx,
  SESSIONS_TABLE_SX,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.constants";
import {
  type CarryoverStatusLabels,
  formatSessionAmount,
  formatSessionHours,
  type LinkedSession,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.helpers";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

function LinkedSessionRow({
  session,
  locale,
  notSet,
  statusLabels,
}: {
  readonly session: LinkedSession;
  readonly locale: string;
  readonly notSet: string;
  readonly statusLabels: CarryoverStatusLabels;
}) {
  return (
    <Box component="tr">
      <Box component="td">
        <Typography variant="bodyMd">
          {session.scheduledStartAt === null ? notSet : formatDate(session.scheduledStartAt, locale, notSet)}
        </Typography>
      </Box>
      <Box component="td">
        <Typography variant="bodyMd">{session.studentName ?? notSet}</Typography>
      </Box>
      <Box component="td">
        <Typography variant="bodyMd">{session.subjectName ?? notSet}</Typography>
      </Box>
      <Box component="td">
        <Typography variant="bodyMd">{formatSessionHours(session.durationMinutes, locale, notSet)}</Typography>
      </Box>
      <Box component="td">
        <Typography variant="bodyMd">
          {formatSessionAmount(session.originalAmount, session.originalCurrency, locale, notSet)}
        </Typography>
      </Box>
      <Box component="td">
        {session.currentStatus === null ? (
          <Typography variant="bodyMd">{notSet}</Typography>
        ) : (
          <StatusBadge
            category="payrollCalculation"
            status={session.currentStatus}
            label={statusLabels[session.currentStatus]}
          />
        )}
      </Box>
    </Box>
  );
}

export function LinkedSessionsTable({
  sessions,
  locale,
  notSet,
  labels,
  statusLabels,
}: {
  readonly sessions: readonly LinkedSession[];
  readonly locale: string;
  readonly notSet: string;
  readonly labels: CarryoverLabels;
  readonly statusLabels: CarryoverStatusLabels;
}) {
  const headers = [
    labels.drawer.sessionDate,
    labels.drawer.student,
    labels.drawer.subject,
    labels.drawer.duration,
    labels.drawer.amount,
    labels.drawer.status,
  ];
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box component="table" sx={SESSIONS_TABLE_SX}>
        <Box component="thead">
          <Box component="tr">
            {headers.map(header => (
              <Box component="th" scope="col" key={header}>
                <Typography variant="labelUppercase" sx={fieldLabelSx}>
                  {header}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {sessions.map((session, index) => (
            <LinkedSessionRow
              key={session.id ?? index}
              session={session}
              locale={locale}
              notSet={notSet}
              statusLabels={statusLabels}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
