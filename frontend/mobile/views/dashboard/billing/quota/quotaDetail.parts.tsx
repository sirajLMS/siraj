"use client";

import { Skeleton, Stack, type Theme, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { QuotaLedgerItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { formatQuotaDate } from "@/frontend/common/views/dashboard/billing/quota/utils/quotaFormatters";
import { MobileCardListItem, MobilePageContainer } from "@/frontend/mobile/components/ui";

const SKELETON_KEYS = ["skeleton-0", "skeleton-1", "skeleton-2"] as const;

function getDeltaColor(value: number, theme: Theme) {
  if (value > 0) return { color: theme.palette.success.main };
  if (value < 0) return { color: theme.palette.error.main };
  return { color: theme.palette.text.primary };
}

export function MobileQuotaLedgerSkeleton(): ReactNode {
  return SKELETON_KEYS.map(key => (
    <MobileCardListItem key={key} variant="edge-to-edge">
      <Stack spacing={1} sx={{ py: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </Stack>
    </MobileCardListItem>
  ));
}

export function MobileQuotaLedgerItem({ entry, index }: Readonly<{ entry: QuotaLedgerItem; index: number }>) {
  return (
    <MobileCardListItem
      variant="edge-to-edge"
      sx={{
        animation: `ledgerGrowIn 300ms ease ${index * 50}ms both`,
        "@keyframes ledgerGrowIn": {
          from: { opacity: 0, transform: "scaleY(0.8)" },
          to: { opacity: 1, transform: "scaleY(1)" },
        },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <Stack spacing={0.5} sx={{ width: "100%" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {entry.reason}
          </Typography>
          <Typography
            variant="body2"
            sx={(theme: Theme) => ({ fontWeight: 700, ...getDeltaColor(entry.delta ?? 0, theme) })}
          >
            {(entry.delta ?? 0) > 0 ? `+${entry.delta}` : entry.delta}
          </Typography>
        </Stack>
        {entry.reasonNote ? (
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
            {entry.reasonNote}
          </Typography>
        ) : null}
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
          {formatQuotaDate(entry.createdAt)}
        </Typography>
      </Stack>
    </MobileCardListItem>
  );
}

export function MobileQuotaDetailSkeleton() {
  return (
    <MobilePageContainer>
      <Stack spacing={2} aria-busy="true" sx={{ py: 2 }}>
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
      </Stack>
    </MobilePageContainer>
  );
}
