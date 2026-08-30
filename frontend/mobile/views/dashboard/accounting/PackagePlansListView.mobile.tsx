"use client";

import { AddOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatAccountingMoney,
  planActiveTone,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  MobileListCardSkeletons,
  MobileListEmptyNotice,
  MobileListErrorNotice,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import type { PackagePlansListViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlansListViewModel";
import { MobileFab, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function PackagePlansListMobile(props: Readonly<PackagePlansListViewModel>) {
  const { t, rows, loading, error, canManagePackages } = props;
  const router = useRouter();

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      {/* pb 11 (88px): FAB height (56) + breathing room — the shell only reserves the bottom-nav height, so the last card can still scroll fully above the fixed MobileFab. */}
      <Stack spacing={2} sx={{ pb: 11 }}>
        <MobileListErrorNotice visible={error && rows.length === 0} message={t.loadError} />

        {loading && rows.length === 0 ? (
          <MobileListCardSkeletons height={110} />
        ) : (
          rows.map(row => (
            <Box
              key={row.id}
              {...(canManagePackages
                ? { component: Link, href: `/accounting/packages/${row.id}/edit`, style: { textDecoration: "none" } }
                : {})}
            >
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
                    {canManagePackages ? (
                      <EditOutlined
                        fontSize="small"
                        sx={theme => ({ color: theme.palette.onSurfaceVariant })}
                        aria-hidden
                      />
                    ) : null}
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
            </Box>
          ))
        )}

        <MobileListEmptyNotice visible={!loading && rows.length === 0 && !error} message={t.empty} />
      </Stack>

      {canManagePackages ? (
        <MobileFab
          icon={<AddOutlined />}
          label={t.createPlan}
          onClick={() => router.push("/accounting/packages/new")}
        />
      ) : null}
    </MobilePageContainer>
  );
}
