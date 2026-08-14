"use client";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import NumbersOutlinedIcon from "@mui/icons-material/NumbersOutlined";
import { Box, Button, Card, CardContent, CardHeader, Grid, Skeleton, Stack, Typography, useTheme } from "@mui/material";
import Link from "next/link";
import { type ComponentType, type ReactElement, type ReactNode, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { useQuotaViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";
import { useAppLocale } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

interface PieShapeProps {
  readonly index: number;
  readonly cx?: number | string;
  readonly cy?: number | string;
  readonly innerRadius?: number | string;
  readonly outerRadius?: number | string;
  readonly startAngle?: number;
  readonly endAngle?: number;
  readonly midAngle?: number;
}

interface BarShapeProps {
  readonly index: number;
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly background?: { x: number | null; y: number | null; width: number | null; height: number | null };
}

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

function describeArc(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

function groupQuotasByMonth<T>(
  quotas: QuotaItem[],
  getDate: (q: QuotaItem) => string | null,
  init: T,
  accum: (agg: T, q: QuotaItem) => void,
  monthFormatter: Intl.DateTimeFormat
) {
  const monthMap: Map<string, T> = new Map();
  for (const q of quotas) {
    const dateStr = getDate(q);
    if (!dateStr) continue;
    const d = new Date(dateStr);
    const key = `${monthFormatter.format(d)} ${d.getFullYear()}`;
    const existing = monthMap.get(key) ?? structuredClone(init);
    accum(existing, q);
    monthMap.set(key, existing);
  }
  return Array.from(monthMap.entries()).toSorted((a, b) => a[0].localeCompare(b[0]));
}

function buildPurchasesOverTime(quotas: QuotaItem[], monthFormatter: Intl.DateTimeFormat) {
  const entries = groupQuotasByMonth(
    quotas,
    q => q.createdAt,
    { purchases: 0, classes: 0 },
    (agg, q) => {
      agg.purchases += 1;
      agg.classes += q.totalClasses ?? 0;
    },
    monthFormatter
  );
  return entries.map(([month, data]) => ({ month, purchases: data.purchases, classes: data.classes }));
}

function buildRedemptionByType(quotas: QuotaItem[], labels: QuotaLabels) {
  let pkg = 0;
  let periodic = 0;
  let onDemand = 0;
  for (const q of quotas) {
    const redeemed = (q.totalClasses ?? 0) - (q.remaining ?? 0);
    if (q.kind === QuotaKind.Package) pkg += redeemed;
    else if (q.kind === QuotaKind.Periodic) periodic += redeemed;
    else onDemand += redeemed;
  }
  const total = pkg + periodic + onDemand;
  if (total === 0) return [];
  return [
    { name: labels.charts.packageType, value: pkg, pct: Math.round((pkg / total) * 100) },
    { name: labels.charts.periodicType, value: periodic, pct: Math.round((periodic / total) * 100) },
    { name: labels.charts.onDemandType, value: onDemand, pct: Math.round((onDemand / total) * 100) },
  ].filter(d => d.value > 0);
}

// NOTE: Uses PACKAGE kind as proxy for on-demand — no ON_DEMAND kind exists in schema yet
function buildDeliveryRate(quotas: QuotaItem[], labels: QuotaLabels) {
  const onDemandQuotas = quotas.filter(q => q.kind === QuotaKind.Package);
  const committed = onDemandQuotas.filter(q => q.status === QuotaStatus.Active).length;
  const cancelled = onDemandQuotas.filter(q => q.status !== QuotaStatus.Active).length;
  return [
    { name: labels.charts.committed, count: committed },
    { name: labels.charts.cancelled, count: cancelled },
  ];
}

function buildExpiredSlippage(quotas: QuotaItem[], monthFormatter: Intl.DateTimeFormat) {
  const entries = groupQuotasByMonth(
    quotas,
    q => q.validUntil,
    { expired: 0, redeemed: 0 },
    (agg, q) => {
      if (q.status === QuotaStatus.Expired) {
        agg.expired += q.remaining ?? 0;
      }
      if (q.status === QuotaStatus.Active) {
        agg.redeemed += (q.totalClasses ?? 0) - (q.remaining ?? 0);
      }
    },
    monthFormatter
  );
  let cumExp = 0;
  let cumRed = 0;
  const result: { month: string; cumulativeExpired: number; cumulativeRedeemed: number }[] = [];
  for (const [monthKey, monthData] of entries) {
    cumExp += monthData.expired;
    cumRed += monthData.redeemed;
    result.push({ month: monthKey, cumulativeExpired: cumExp, cumulativeRedeemed: cumRed });
  }
  const seen = new Set<string>();
  return result.filter(r => {
    if (seen.has(r.month)) return false;
    seen.add(r.month);
    return true;
  });
}

interface ChartColors {
  readonly primary: string;
  readonly primaryLight: string;
  readonly success: string;
  readonly successLight: string;
  readonly warning: string;
  readonly error: string;
  readonly donutColors: string[];
  readonly barColors: string[];
}

interface InsightsBackButtonProps {
  readonly title: string;
  readonly cancelLabel: string;
}

function InsightsBackButton({ title, cancelLabel }: Readonly<InsightsBackButtonProps>) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Button startIcon={<ArrowBackOutlinedIcon />} component={Link} href="/quotas" color="inherit">
        {cancelLabel}
      </Button>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
    </Stack>
  );
}

type MetricCountLabel = (count: number) => string;

interface MetricCardLabels {
  readonly activeQuotasCount: MetricCountLabel;
  readonly totalClassesRemaining: MetricCountLabel;
  readonly expiringThisWeekCount: MetricCountLabel;
}

type MetricVariant = "primary" | "success" | "warning";

interface MetricCardProps {
  readonly icon: ComponentType;
  readonly value: ReactNode;
  readonly label: string;
  readonly bgcolor: string;
  readonly onColor: string;
}

function MetricCard({ icon: Icon, value, label, bgcolor, onColor }: Readonly<MetricCardProps>) {
  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box
              sx={() => ({
                p: 1.5,
                borderRadius: 2,
                bgcolor,
                color: onColor,
                display: "flex",
              })}
            >
              <Icon />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {value}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}

function MetricValue({ loading, value }: { readonly loading: boolean; readonly value: number }) {
  return loading ? <Skeleton width={60} /> : value;
}

interface MetricCardConfig {
  readonly variant: MetricVariant;
  readonly value: number;
  readonly label: string;
}

interface InsightsMetricCardsProps {
  readonly loading: boolean;
  readonly activeQuotasCount: number;
  readonly totalClassesRemaining: number;
  readonly expiringThisWeekCount: number;
  readonly labels: MetricCardLabels;
  readonly containers: Record<
    MetricVariant,
    { readonly icon: ComponentType; readonly bgcolor: string; readonly onColor: string }
  >;
}

function InsightsMetricCards({
  loading,
  activeQuotasCount,
  totalClassesRemaining,
  expiringThisWeekCount,
  labels,
  containers,
}: Readonly<InsightsMetricCardsProps>) {
  const configs: MetricCardConfig[] = [
    { variant: "primary", value: activeQuotasCount, label: labels.activeQuotasCount(activeQuotasCount) },
    { variant: "success", value: totalClassesRemaining, label: labels.totalClassesRemaining(totalClassesRemaining) },
    { variant: "warning", value: expiringThisWeekCount, label: labels.expiringThisWeekCount(expiringThisWeekCount) },
  ];
  return (
    <Grid container spacing={3}>
      {configs.map(config => (
        <MetricCard
          key={config.variant}
          icon={containers[config.variant].icon}
          value={<MetricValue loading={loading} value={config.value} />}
          label={config.label}
          bgcolor={containers[config.variant].bgcolor}
          onColor={containers[config.variant].onColor}
        />
      ))}
    </Grid>
  );
}

interface InsightsChartRow1Props {
  readonly purchasesOverTime: { readonly month: string; readonly purchases: number; readonly classes: number }[];
  readonly redemptionByType: { readonly name: string; readonly value: number; readonly pct: number }[];
  readonly deliveryRate: { readonly name: string; readonly count: number }[];
  readonly chartLabels: QuotaLabels["charts"];
  readonly chartColors: ChartColors;
}

function InsightsChartRow1({
  purchasesOverTime,
  redemptionByType,
  deliveryRate,
  chartLabels,
  chartColors,
}: Readonly<InsightsChartRow1Props>) {
  const donutShape = (props: PieShapeProps): ReactElement => {
    const { index, cx, cy, innerRadius, outerRadius, startAngle, endAngle } = props;
    const { donutColors } = chartColors;
    return (
      <path
        d={describeArc(
          Number(cx),
          Number(cy),
          Number(innerRadius),
          Number(outerRadius),
          Number(startAngle),
          Number(endAngle)
        )}
        fill={donutColors[index % donutColors.length]}
      />
    );
  };
  const barShape = (props: BarShapeProps): ReactElement => {
    const { index, x, y, width, height } = props;
    const { barColors } = chartColors;
    return <rect x={x} y={y} width={width} height={height} fill={barColors[index % barColors.length]} />;
  };

  return (
    <Grid container spacing={3}>
      {/* Quota Purchases Over Time — Area Chart */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card variant="outlined">
          <CardHeader title={chartLabels.quotaPurchasesOverTime} />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={purchasesOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  name={chartLabels.months}
                  fill={chartColors.primaryLight}
                  stroke={chartColors.primary}
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="classes"
                  name={chartLabels.classes}
                  fill={chartColors.successLight}
                  stroke={chartColors.success}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Redemption Rate by Type — Donut Chart */}
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <Card variant="outlined">
          <CardHeader title={chartLabels.redemptionRateByType} />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={redemptionByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => {
                    const pctNum = typeof percent === "number" ? Math.round(percent * 100) : 0;
                    return `${name} ${pctNum}%`;
                  }}
                  shape={donutShape}
                ></Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* On-Demand Delivery Rate — Bar Chart */}
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <Card variant="outlined">
          <CardHeader title={chartLabels.onDemandDeliveryRate} />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deliveryRate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name={chartLabels.deliveryRate} shape={barShape}></Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

interface InsightsChartRow2Props {
  readonly pendingBacklogCount: number;
  readonly expiredSlippage: {
    readonly month: string;
    readonly cumulativeExpired: number;
    readonly cumulativeRedeemed: number;
  }[];
  readonly chartLabels: QuotaLabels["charts"];
  readonly chartColors: Pick<ChartColors, "success" | "error">;
}

function InsightsChartRow2({
  pendingBacklogCount,
  expiredSlippage,
  chartLabels,
  chartColors,
}: Readonly<InsightsChartRow2Props>) {
  const gaugeShape = (props: PieShapeProps): ReactElement => {
    const { index, cx, cy, innerRadius, outerRadius, startAngle, endAngle } = props;
    return (
      <path
        d={describeArc(
          Number(cx),
          Number(cy),
          Number(innerRadius),
          Number(outerRadius),
          Number(startAngle),
          Number(endAngle)
        )}
        fill={index === 0 ? chartColors.error : "transparent"}
      />
    );
  };

  return (
    <Grid container spacing={2}>
      {/* PENDING_CREDIT Backlog Gauge */}
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <Card variant="outlined">
          <CardHeader title={chartLabels.pendingCreditBacklogGauge} />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: chartLabels.pendingCredits, value: pendingBacklogCount },
                    { name: "", value: Math.max(50 - pendingBacklogCount, 0) },
                  ]}
                  cx="50%"
                  cy="80%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius="90%"
                  outerRadius="100%"
                  dataKey="value"
                  shape={gaugeShape}
                ></Pie>
              </PieChart>
            </ResponsiveContainer>
            <Typography variant="h3" sx={{ textAlign: "center", fontWeight: 700, mt: -4 }}>
              {pendingBacklogCount}
            </Typography>
            <Typography variant="caption" sx={{ textAlign: "center", display: "block" }}>
              {chartLabels.pendingCredits}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Expired Slippage — Line Chart */}
      <Grid size={{ xs: 12, lg: 9 }}>
        <Card variant="outlined">
          <CardHeader title={chartLabels.expiredSlippage} />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={expiredSlippage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulativeExpired"
                  name={chartLabels.expiredClasses}
                  stroke={chartColors.error}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeRedeemed"
                  name={chartLabels.redeemedClasses}
                  stroke={chartColors.success}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export function QuotaInsightsContainer() {
  const { quotas, loading } = useQuotaViewModel();
  const t = useAppTranslation(DashboardBillingQuota);
  const theme = useTheme();
  const locale = useAppLocale();

  const monthFormatter = useMemo(() => Intl.DateTimeFormat(locale, { month: "short" }), [locale]);

  const purchasesOverTime = useMemo(() => buildPurchasesOverTime(quotas, monthFormatter), [quotas, monthFormatter]);
  const redemptionByType = useMemo(() => buildRedemptionByType(quotas, t), [quotas, t]);
  const deliveryRate = useMemo(() => buildDeliveryRate(quotas, t), [quotas, t]);
  const expiredSlippage = useMemo(() => buildExpiredSlippage(quotas, monthFormatter), [quotas, monthFormatter]);

  const {
    activeCount: activeQuotasCount,
    totalRemaining: totalClassesRemaining,
    expiringCount: expiringThisWeekCount,
    backlogCount: pendingBacklogCount,
  } = useMemo(() => {
    const activeCount = quotas.filter(q => q.status === QuotaStatus.Active).length;
    const totalRemaining = quotas.reduce((sum, q) => sum + (q.remaining ?? 0), 0);
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringCount = quotas.filter(q => {
      if (!q.validUntil) return false;
      const d = new Date(q.validUntil);
      return d >= now && d <= nextWeek;
    }).length;
    const backlogCount = activeCount;
    return { activeCount, totalRemaining, expiringCount, backlogCount };
  }, [quotas]);

  const chartLabels = t.charts;

  const p = theme.palette;
  const chartColors: ChartColors = {
    primary: p.primary.main,
    primaryLight: p.primary.light,
    success: p.success.main,
    successLight: p.success.light,
    warning: p.warning.main,
    error: p.error.main,
    donutColors: [p.primary.main, p.success.main, p.warning.main],
    barColors: [p.success.main, p.error.main],
  };

  return (
    <Stack spacing={3} sx={{ py: 3 }}>
      <InsightsBackButton title={t.insightsTitle} cancelLabel={t.actions.cancel} />
      <InsightsMetricCards
        loading={loading}
        activeQuotasCount={activeQuotasCount}
        totalClassesRemaining={totalClassesRemaining}
        expiringThisWeekCount={expiringThisWeekCount}
        labels={{
          activeQuotasCount: t.activeQuotasCount,
          totalClassesRemaining: t.totalClassesRemaining,
          expiringThisWeekCount: t.expiringThisWeekCount,
        }}
        containers={{
          primary: { icon: Inventory2OutlinedIcon, bgcolor: p.primaryContainer, onColor: p.onPrimaryContainer },
          success: { icon: NumbersOutlinedIcon, bgcolor: p.successContainer, onColor: p.onSuccessContainer },
          warning: { icon: EventBusyOutlinedIcon, bgcolor: p.warningContainer, onColor: p.onWarningContainer },
        }}
      />
      <InsightsChartRow1
        purchasesOverTime={purchasesOverTime}
        redemptionByType={redemptionByType}
        deliveryRate={deliveryRate}
        chartLabels={chartLabels}
        chartColors={chartColors}
      />
      <InsightsChartRow2
        pendingBacklogCount={pendingBacklogCount}
        expiredSlippage={expiredSlippage}
        chartLabels={chartLabels}
        chartColors={chartColors}
      />
    </Stack>
  );
}
