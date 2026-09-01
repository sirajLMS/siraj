"use client";

import { Paper, Stack, Typography } from "@mui/material";
import type { ReactElement } from "react";
import {
  formatDate,
  formatDelta,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceLedger.utils";
import { getLedgerReasonLabel } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceStatus.utils";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface LedgerEntry {
  readonly id: string | null;
  readonly delta: number | null;
  readonly reason: string | null;
  readonly createdAt: string | null;
}

export interface LedgerEntriesListProps {
  readonly entries: ReadonlyArray<LedgerEntry>;
  readonly t: StudentQuotaLabels;
}

export function LedgerEntriesList({ entries, t }: Readonly<LedgerEntriesListProps>): ReactElement {
  if (entries.length === 0) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {t.audience.noLedgerEntries}
      </Typography>
    );
  }
  return (
    <Stack sx={{ gap: 1 }}>
      {entries.map(entry => (
        <Paper key={entry.id ?? ""} variant="outlined" sx={{ p: 1.5 }}>
          <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Stack sx={{ gap: 0.5 }}>
              <Typography variant="labelSm">{getLedgerReasonLabel(entry.reason, t)}</Typography>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {formatDate(entry.createdAt)}
              </Typography>
            </Stack>
            <Typography
              variant="labelMd"
              sx={theme => ({
                fontWeight: 700,
                color: (entry.delta ?? 0) >= 0 ? theme.palette.success.main : theme.palette.error.main,
              })}
            >
              {formatDelta(entry.delta)}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
