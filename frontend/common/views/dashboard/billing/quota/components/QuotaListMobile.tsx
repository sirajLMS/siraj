"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import { Button, Card, CardContent, Chip, Fab, Skeleton, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { useQuotaViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";
import {
  formatQuotaDate,
  formatQuotaKind,
  formatQuotaStatus,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaFormatters";

export function QuotaListMobile(props: Readonly<ReturnType<typeof useQuotaViewModel>>) {
  const { t, quotas, loading } = props;

  function renderSkeletons() {
    const skeletonKeys = ["skeleton-0", "skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"] as const;
    return skeletonKeys.map(key => (
      <Card key={key} variant="outlined">
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="rectangular" height={40} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    ));
  }

  function renderEmptyState() {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography sx={{ textAlign: "center", py: 4 }}>{t.noQuotas}</Typography>
        </CardContent>
      </Card>
    );
  }

  function renderQuotaList() {
    const isLoading = loading;
    const hasNoQuotas = quotas.length === 0;

    if (isLoading) {
      return renderSkeletons();
    }

    if (hasNoQuotas) {
      return renderEmptyState();
    }

    return quotas.map(quota => {
      const { label, color } = formatQuotaStatus(quota.status ?? "", t);
      const quotaKind = formatQuotaKind(quota.kind ?? "", t);
      return (
        <Card key={quota.id} component={Link} href={`/quotas/${quota.id}`} sx={{ textDecoration: "none" }}>
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {quota.name ?? ""}
                </Typography>
                <Chip label={label} color={color} size="small" />
              </Stack>

              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Chip label={quotaKind} size="small" variant="outlined" />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t.fields.validUntil}: {formatQuotaDate(quota.validUntil)}
                </Typography>
              </Stack>

              <Stack direction="row" sx={{ justifyContent: "space-between", pt: 1 }}>
                <Typography variant="body2">
                  {t.fields.remaining}: <strong>{quota.remaining ?? 0}</strong> / {quota.totalClasses ?? 0}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {t.fields.reservedClasses}: {quota.reservedClasses ?? 0}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      );
    });
  }

  return (
    <Stack spacing={2} sx={{ pb: 8 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t.title}
        </Typography>
        <Button size="small" startIcon={<InsightsOutlinedIcon />} component={Link} href="/quotas/insights">
          {t.insights}
        </Button>
      </Stack>

      {renderQuotaList()}

      <Fab color="primary" component={Link} href="/quotas/new" sx={{ position: "fixed", bottom: 24, right: 24 }}>
        <AddOutlinedIcon />
      </Fab>
    </Stack>
  );
}
