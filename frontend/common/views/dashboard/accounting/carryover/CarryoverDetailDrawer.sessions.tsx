"use client";

import { useQuery } from "@apollo/client/react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { carryoverBalanceLinkedSessionsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { fieldLabelSx } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.constants";
import type {
  CarryoverStatusLabels,
  LinkedSession,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.helpers";
import { LinkedSessionsTable } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.sessionsTable";
import { useAppLocale } from "@/shared/locale";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

function LinkedSessionsBody({
  sessions,
  loading,
  hasError,
  locale,
  labels,
  commonLabels,
  statusLabels,
}: {
  readonly sessions: readonly LinkedSession[] | null;
  readonly loading: boolean;
  readonly hasError: boolean;
  readonly locale: string;
  readonly labels: CarryoverLabels;
  readonly commonLabels: CommonLabels;
  readonly statusLabels: CarryoverStatusLabels;
}) {
  if (loading && sessions === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-label={commonLabels.loading}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (hasError) {
    return <Alert severity="error">{labels.loadError}</Alert>;
  }
  if (sessions === null || sessions.length === 0) {
    return (
      <Typography variant="bodyMd" sx={fieldLabelSx}>
        {labels.drawer.noSessions}
      </Typography>
    );
  }
  return (
    <LinkedSessionsTable
      sessions={sessions}
      locale={locale}
      notSet={commonLabels.notSet}
      labels={labels}
      statusLabels={statusLabels}
    />
  );
}

/**
 * Linked-session list for the balance: an independent fetch gated by the
 * drawer's open state, with loading / error / empty / populated states. The
 * heading count prefers the fetched rows and falls back to the balance
 * record's snapshot count while rows load.
 */
export function LinkedSessionsSection({
  carryoverId,
  open,
  linkedSessionCount,
  labels,
  commonLabels,
  statusLabels,
}: {
  readonly carryoverId: string;
  readonly open: boolean;
  /** Snapshot count from the balance record; keeps the heading stable while rows load. */
  readonly linkedSessionCount: number | null;
  readonly labels: CarryoverLabels;
  readonly commonLabels: CommonLabels;
  readonly statusLabels: CarryoverStatusLabels;
}) {
  const locale = useAppLocale();
  const { data, loading, error } = useQuery(carryoverBalanceLinkedSessionsQueryDocument, {
    variables: { carryoverId },
    skip: !open,
  });
  const sessions = data?.carryoverBalanceLinkedSessions ?? null;
  const heading = labels.drawer.sessionsHeading(sessions?.length ?? linkedSessionCount ?? 0);
  return (
    <Box sx={{ mt: 4 }} aria-label={heading}>
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {heading}
      </Typography>
      <Box sx={{ mt: 1.5 }}>
        <LinkedSessionsBody
          sessions={sessions}
          loading={loading}
          hasError={Boolean(error)}
          locale={locale}
          labels={labels}
          commonLabels={commonLabels}
          statusLabels={statusLabels}
        />
      </Box>
    </Box>
  );
}
