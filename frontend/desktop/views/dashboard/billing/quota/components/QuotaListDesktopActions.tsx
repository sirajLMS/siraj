"use client";

import { AddOutlined } from "@mui/icons-material";
import { Stack } from "@mui/material";
import Link from "next/link";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export interface QuotaListDesktopActionsProps {
  readonly t: QuotaLabels;
}

export function QuotaListDesktopActions({ t }: Readonly<QuotaListDesktopActionsProps>) {
  return (
    <Stack direction="row" spacing={1.5}>
      <Link href="/quotas/new" style={{ textDecoration: "none" }}>
        <DesktopPrimaryPageAction startIcon={<AddOutlined />}>{t.newQuota}</DesktopPrimaryPageAction>
      </Link>
    </Stack>
  );
}
