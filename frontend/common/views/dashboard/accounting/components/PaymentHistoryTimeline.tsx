"use client";

import { HistoryOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { formatAccountingDate } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";

type HistoryEvent = {
  readonly id: string | null;
  readonly kind: string | null;
  readonly occurredAt: string | Date | null;
  readonly hoursDelta: string | null;
  readonly notes: string | null;
};

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

const toMillis = (value: string | Date | null): number =>
  value instanceof Date ? value.getTime() : new Date(String(value ?? 0)).getTime();

/** Vertical timeline of derived payment events (newest first). */
export function PaymentHistoryTimeline({ events, labels, emptyLabel, locale }: Readonly<PaymentHistoryTimelineProps>) {
  if (events.length === 0) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {emptyLabel}
      </Typography>
    );
  }

  const ordered = [...events].toSorted((a, b) => toMillis(b.occurredAt) - toMillis(a.occurredAt));

  return (
    <Stack component="ol" sx={{ m: 0, p: 0, listStyle: "none" }} spacing={0}>
      {ordered.map((event, index) => {
        const isLast = index === ordered.length - 1;
        const tone = kindDotTone[String(event.kind)] ?? "info";
        return (
          <Stack
            key={event.id ?? `history-${index}`}
            direction="row"
            spacing={2}
            component="li"
            sx={{ alignItems: "stretch" }}
          >
            <Stack sx={{ alignItems: "center", width: 20 }}>
              <Box
                sx={theme => ({
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  mt: 1,
                  bgcolor: theme.palette[tone].main,
                  flexShrink: 0,
                })}
              />
              {isLast ? null : <Box sx={theme => ({ width: 2, flex: 1, bgcolor: theme.palette.outlineVariant })} />}
            </Stack>
            <Stack sx={{ pb: isLast ? 0 : 3, minWidth: 0 }}>
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
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}
