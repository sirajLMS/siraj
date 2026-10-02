"use client";

import { DeleteOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton, Stack, Tooltip } from "@mui/material";
import Link from "next/link";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

interface QuotaListDesktopRowActionsProps {
  readonly t: QuotaLabels;
  readonly quotaId: string;
  readonly onDelete: (quotaId: string) => void;
}

export function QuotaListDesktopRowActions({ t, quotaId, onDelete }: Readonly<QuotaListDesktopRowActionsProps>) {
  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title={t.actions.viewLedger}>
        <Link href={`/quotas/${quotaId}`} style={{ textDecoration: "none" }}>
          <IconButton size="small" aria-label={t.actions.view}>
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Link>
      </Tooltip>
      <Tooltip title={t.actions.edit}>
        <Link href={`/quotas/${quotaId}/edit`} style={{ textDecoration: "none" }}>
          <IconButton size="small" aria-label={t.actions.edit}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Link>
      </Tooltip>
      <Tooltip title={t.actions.delete}>
        <IconButton size="small" aria-label={t.actions.delete} color="error" onClick={() => onDelete(quotaId)}>
          <DeleteOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
