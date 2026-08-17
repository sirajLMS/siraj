"use client";

import { AddOutlined, InsightsOutlined, SearchOutlined } from "@mui/icons-material";
import {
  Button,
  Fade,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Skeleton,
  Stack,
  TextField,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import type { QuotaListViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";
import { buildQuotaListMetrics } from "@/frontend/common/views/dashboard/billing/quota/utils";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobileEmptyState,
  MobileFab,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { QuotaListItemMobile } from "@/frontend/mobile/views/dashboard/billing/quota/components/QuotaListItemMobile";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

const SKELETON_KEYS = ["skeleton-0", "skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"] as const;

function renderSkeletons(): ReactNode {
  return SKELETON_KEYS.map(key => (
    <MobileCardListItem key={key} variant="edge-to-edge">
      <Stack spacing={1} sx={{ py: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="rectangular" height={40} sx={{ mt: 1 }} />
      </Stack>
    </MobileCardListItem>
  ));
}

interface MobileFilterControlsProps {
  readonly t: QuotaLabels;
  readonly searchQuery: string;
  readonly filterStatus: QuotaStatus | null;
  readonly filterKind: QuotaKind | null;
  readonly setSearchQuery: (query: string) => void;
  readonly setFilterStatus: (status: QuotaStatus | null) => void;
  readonly setFilterKind: (kind: QuotaKind | null) => void;
}

function MobileFilterControls({
  t,
  searchQuery,
  filterStatus,
  filterKind,
  setSearchQuery,
  setFilterStatus,
  setFilterKind,
}: Readonly<MobileFilterControlsProps>) {
  return (
    <Stack spacing={1.5}>
      <TextField
        size="small"
        fullWidth
        placeholder={t.listTitle}
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      <Stack direction="row" spacing={1}>
        <FormControl size="small" fullWidth>
          <InputLabel>{t.fields.status}</InputLabel>
          <Select<QuotaStatus | "">
            value={filterStatus ?? ""}
            label={t.fields.status}
            onChange={(e: SelectChangeEvent<QuotaStatus | "">) => {
              const val = e.target.value;
              setFilterStatus(val === "" ? null : val);
            }}
          >
            <MenuItem value="">{t.fields.all}</MenuItem>
            <MenuItem value={QuotaStatus.Active}>{t.statuses.ACTIVE}</MenuItem>
            <MenuItem value={QuotaStatus.Expired}>{t.statuses.EXPIRED}</MenuItem>
            <MenuItem value={QuotaStatus.Archived}>{t.statuses.ARCHIVED}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>{t.fields.kind}</InputLabel>
          <Select<QuotaKind | "">
            value={filterKind ?? ""}
            label={t.fields.kind}
            onChange={(e: SelectChangeEvent<QuotaKind | "">) => {
              const val = e.target.value;
              setFilterKind(val === "" ? null : val);
            }}
          >
            <MenuItem value="">{t.fields.all}</MenuItem>
            <MenuItem value={QuotaKind.Package}>{t.kinds.PACKAGE}</MenuItem>
            <MenuItem value={QuotaKind.Periodic}>{t.kinds.PERIODIC}</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  );
}

export function QuotaListMobile(props: Readonly<QuotaListViewModel>) {
  const {
    t,
    quotas,
    totalCount,
    loading,
    page,
    pageSize,
    setPage,
    filterStatus,
    filterKind,
    searchQuery,
    setFilterStatus,
    setFilterKind,
    setSearchQuery,
  } = props;

  const router = useRouter();
  const metrics = buildQuotaListMetrics(t, totalCount, quotas);

  const renderItem = (quota: QuotaItem, index: number): ReactNode => (
    <MobileCardListItem
      variant="edge-to-edge"
      interactive
      sx={{
        animation: `quotaGrowIn 300ms ease ${index * 50}ms both`,
        "@keyframes quotaGrowIn": {
          from: { opacity: 0, transform: "scaleY(0.8)" },
          to: { opacity: 1, transform: "scaleY(1)" },
        },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <QuotaListItemMobile quota={quota} t={t} />
    </MobileCardListItem>
  );

  return (
    <Fade in timeout={300}>
      <div>
        <MobilePageContainer>
          <MobilePageHeader
            title={t.title}
            breadcrumbs={[{ label: t.title, current: true }]}
            actions={
              <Button
                component={Link}
                href="/quotas/insights"
                variant="outlined"
                size="small"
                startIcon={<InsightsOutlined />}
              >
                {t.insights}
              </Button>
            }
          />

          <MobileContentStack gap={3} paddingBottom={4}>
            <MobileMetricCardGrid metrics={metrics} />

            <MobileSectionPanel title={t.listTitle} contentInset={false}>
              <MobileFilterControls
                t={t}
                searchQuery={searchQuery}
                filterStatus={filterStatus}
                filterKind={filterKind}
                setSearchQuery={setSearchQuery}
                setFilterStatus={setFilterStatus}
                setFilterKind={setFilterKind}
              />
            </MobileSectionPanel>

            {quotas.length === 0 && !loading ? (
              <MobileSectionPanel contentInset={false}>
                <MobileEmptyState title={t.noQuotas} subtitle={t.emptyListMessage} />
              </MobileSectionPanel>
            ) : (
              <MobileCardList<QuotaItem>
                rows={quotas}
                renderItem={renderItem}
                getKey={quota => quota.id ?? ""}
                loading={loading}
                emptyMessage={t.noQuotas}
                renderSkeleton={renderSkeletons}
                layout="edge-to-edge"
                paginationOptions={buildServerPaginationOptions({
                  page,
                  pageSize,
                  totalCount,
                  onPageChange: (newPage: number) => setPage(newPage),
                })}
              />
            )}
          </MobileContentStack>
        </MobilePageContainer>

        <MobileFab icon={<AddOutlined />} label={t.newQuota} onClick={() => router.push("/quotas/new")} />
      </div>
    </Fade>
  );
}
