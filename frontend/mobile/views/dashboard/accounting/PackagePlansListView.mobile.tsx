"use client";

import { AddOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, Skeleton, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatAccountingMoney,
  planActiveTone,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PackagePlansListViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlansListViewModel";
import { MobileFab, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

const SKELETON_KEYS = ["skeleton-0", "skeleton-1", "skeleton-2"] as const;

export function PackagePlansListMobile(props: Readonly<PackagePlansListViewModel>) {
  const { t, rows, loading, error } = props;
  const router = useRouter();

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      <Stack spacing={2} sx={{ pb: 10 }}>
        {error && rows.length === 0 ? (
          <Typography variant="bodyMd" sx={theme => ({ px: 2, color: theme.palette.error.main })}>
            {t.loadError}
          </Typography>
        ) : null}

        {loading && rows.length === 0
          ? SKELETON_KEYS.map(key => (
              <Box key={key} sx={{ px: 2 }}>
                <Skeleton variant="rounded" height={110} />
              </Box>
            ))
          : rows.map(row => (
              <Link key={row.id} href={`/accounting/packages/${row.id}/edit`} style={{ textDecoration: "none" }}>
                <Box
                  sx={theme => ({
                    mx: 2,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: theme.palette.surfaceContainerLow,
                    border: 1,
                    borderColor: theme.palette.outlineVariant,
                    opacity: row.active ? 1 : 0.72,
                  })}
                >
                  <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                      {row.displayName}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                      <Chip
                        size="small"
                        color={planActiveTone(Boolean(row.active))}
                        variant={row.active ? "filled" : "outlined"}
                        label={row.active ? t.columns.active : t.archived}
                      />
                      <EditOutlined
                        fontSize="small"
                        sx={theme => ({ color: theme.palette.onSurfaceVariant })}
                        aria-hidden
                      />
                    </Stack>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ mt: 1, justifyContent: "space-between", alignItems: "baseline" }}
                  >
                    <Typography variant="headlineMd" sx={{ fontWeight: 700 }}>
                      {`${formatAccountingMoney(row.priceAmount)} ${row.currency ?? ""}`}
                    </Typography>
                    <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                      {t.hoursUnit(Number(row.creditHours ?? 0).toFixed(0))}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ mt: 1, justifyContent: "space-between" }}>
                    <Typography
                      variant="labelSm"
                      sx={theme => ({ fontFamily: "monospace", color: theme.palette.text.secondary })}
                    >
                      {row.codename}
                    </Typography>
                    <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                      {`#${row.sortOrder ?? 0}`}
                    </Typography>
                  </Stack>
                </Box>
              </Link>
            ))}

        {!loading && rows.length === 0 && !error ? (
          <Typography variant="bodyMd" sx={{ px: 2, textAlign: "center", py: 4 }}>
            {t.empty}
          </Typography>
        ) : null}
      </Stack>

      <MobileFab icon={<AddOutlined />} label={t.createPlan} onClick={() => router.push("/accounting/packages/new")} />
    </MobilePageContainer>
  );
}
