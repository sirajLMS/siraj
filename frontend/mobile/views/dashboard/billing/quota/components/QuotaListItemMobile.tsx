"use client";

import { Box, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import {
  formatQuotaDate,
  formatQuotaKind,
  formatQuotaStatus,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaFormatters";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export interface QuotaListItemMobileProps {
  readonly quota: QuotaItem;
  readonly t: QuotaLabels;
}

export function QuotaListItemMobile({ quota, t }: Readonly<QuotaListItemMobileProps>) {
  const { label: statusLabel } = formatQuotaStatus(quota.status ?? "", t);
  const kindLabel = formatQuotaKind(quota.kind ?? "", t);

  return (
    <Link href={`/quotas/${quota.id}`} style={{ textDecoration: "none" }}>
      <Box sx={{ display: "block" }}>
        <Stack spacing={1} sx={{ py: 1 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="headlineMd" sx={{ fontWeight: 700 }}>
              {quota.name ?? ""}
            </Typography>
            <MobileStatusBadge
              category="quotaStatus"
              status={quota.status ?? ""}
              label={statusLabel}
              size="small"
              component="output"
            />
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <MobileStatusBadge
              category="quotaStatus"
              status={quota.kind ?? ""}
              label={kindLabel}
              size="small"
              component="output"
            />
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.fields.validUntil}: {formatQuotaDate(quota.validUntil)}
            </Typography>
          </Stack>

          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography variant="bodyMd">
              {t.fields.remaining}:{" "}
              <Box component="span" sx={{ fontWeight: 700 }}>
                {quota.remaining ?? 0}
              </Box>{" "}
              / {quota.totalClasses ?? 0}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.fields.reservedClasses}: {quota.reservedClasses ?? 0}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Link>
  );
}
