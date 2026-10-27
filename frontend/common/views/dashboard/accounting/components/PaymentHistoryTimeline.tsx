"use client";

import { HistoryOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { formatAccountingDate } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  type HistoryEvent,
  sortHistoryEvents,
} from "@/frontend/common/views/dashboard/accounting/components/PaymentHistoryTimeline.helpers";

interface PaymentHistoryTimelineProps {
  readonly events: readonly HistoryEvent[];
  readonly labels: Readonly<Record<string, string>>;
  readonly emptyLabel: string;
  readonly locale: string;
}

const kindDotTone: Readonly<Record<string, "info" | "success" | "warning" | "primary">> = {
  PAYMENT_RECORDED: "info",
  HOURS_CREDITED: "success",
  HOURS_ADJUSTED: "warning",
  MARKED_PAID: "primary",
};

/** Vertical timeline of derived payment events (newest first). */
export function PaymentHistoryTimeline({ events, labels, emptyLabel, locale }: Readonly<PaymentHistoryTimelineProps>) {
  const ordered = useMemo(() => sortHistoryEvents(events), [events]);

  if (events.length === 0) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Stack component="ol" sx={{ m: 0, p: 0, listStyle: "none" }} spacing={0}>
      {ordered.map((event, index) => {
        const isLast = index === ordered.length - 1;
        const tone = kindDotTone[String(event.kind)] ?? "info";
        return (
          <Stack key={event.id ?? `history-${index}`} component="li" spacing={0.5} sx={{ pb: isLast ? 0 : 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box
                sx={theme => ({
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: theme.palette[tone].main,
                  flexShrink: 0,
                })}
              />
              <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                {labels[String(event.kind)] ?? String(event.kind)}
                {event.hoursDelta != null ? (
                  <Box
                    component="span"
                    sx={theme => ({ color: theme.palette.onSurfaceVariant, fontWeight: 500, ml: 1 })}
                  >
                    {Number(event.hoursDelta) > 0 ? `+${Number(event.hoursDelta)}` : Number(event.hoursDelta)} h
                  </Box>
                ) : null}
              </Typography>
            </Stack>
            <Box
              sx={theme => ({
                ml: "4px",
                pl: 1.5,
                borderLeft: isLast ? 0 : 2,
                borderColor: theme.palette.outlineVariant,
              })}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <HistoryOutlined sx={theme => ({ fontSize: 14, color: theme.palette.onSurfaceVariant })} />
                <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {formatAccountingDate(
                    event.occurredAt instanceof Date ? event.occurredAt.toISOString() : event.occurredAt,
                    locale
                  )}
                </Typography>
              </Stack>
              {event.notes ? (
                <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant, mt: 0.5 })}>
                  {event.notes}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}
