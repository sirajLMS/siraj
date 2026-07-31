"use client";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import NumbersOutlinedIcon from "@mui/icons-material/NumbersOutlined";
import { Box, Button, Card, CardContent, CardHeader, Grid, Stack, Typography, useTheme } from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  // biome-ignore lint/suspicious/noDeprecatedImports: recharts Cell is still the only way to style individual cells in Pie/Bar charts
  Cell,
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
import { useQuotaViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";

function buildPurchasesOverTime(quotas: ReturnType<typeof useQuotaViewModel>["quotas"]) {
  const monthMap = new Map<string, { purchases: number; classes: number }>();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (const q of quotas) {
    const d = new Date(q.createdAt);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    const existing = monthMap.get(key) ?? { purchases: 0, classes: 0 };
    existing.purchases += 1;
    existing.classes += q.totalClasses;
    monthMap.set(key, existing);
  }
  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({ month, purchases: data.purchases, classes: data.classes }));
}

function buildRedemptionByType(quotas: ReturnType<typeof useQuotaViewModel>["quotas"]) {
  let pkg = 0;
  let periodic = 0;
  let onDemand = 0;
  for (const q of quotas) {
    const redeemed = q.totalClasses - q.remaining;
    if (q.kind === "PACKAGE") pkg += redeemed;
    else if (q.kind === "PERIODIC") periodic += redeemed;
    else onDemand += redeemed;
  }
  const total = pkg + periodic + onDemand;
  if (total === 0) return [];
  return [
    { name: "PACKAGE", value: pkg, pct: Math.round((pkg / total) * 100) },
    { name: "PERIODIC", value: periodic, pct: Math.round((periodic / total) * 100) },
    { name: "ON_DEMAND", value: onDemand, pct: Math.round((onDemand / total) * 100) },
  ].filter(d => d.value > 0);
}

function buildDeliveryRate(quotas: ReturnType<typeof useQuotaViewModel>["quotas"]) {
  const onDemandQuotas = quotas.filter(q => q.kind === "PACKAGE");
  const committed = onDemandQuotas.filter(q => q.status === "ACTIVE").length;
  const cancelled = onDemandQuotas.filter(q => q.status !== "ACTIVE").length;
  return [
    { name: "Committed", count: committed },
    { name: "Cancelled", count: cancelled },
  ];
}

function buildExpiredSlippage(quotas: ReturnType<typeof useQuotaViewModel>["quotas"]) {
  const monthMap = new Map<string, { expired: number; redeemed: number }>();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (const q of quotas) {
    if (!q.validUntil) continue;
    const d = new Date(q.validUntil);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    const existing = monthMap.get(key) ?? { expired: 0, redeemed: 0 };
    if (q.status === "EXPIRED") {
      existing.expired += q.remaining;
    }
    if (q.status === "ACTIVE") {
      existing.redeemed += q.totalClasses - q.remaining;
    }
    monthMap.set(key, existing);
  }
  const sorted = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let cumExp = 0;
  let cumRed = 0;
  const result: { month: string; cumulativeExpired: number; cumulativeRedeemed: number }[] = [];
  for (const [monthKey, monthData] of sorted) {
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

export function QuotaInsightsContainer() {
  const t = useAppTranslation(DashboardBillingQuota);
  const theme = useTheme();
  const { quotas, loading } = useQuotaViewModel();

  const purchasesOverTime = useMemo(() => buildPurchasesOverTime(quotas), [quotas]);
  const redemptionByType = useMemo(() => buildRedemptionByType(quotas), [quotas]);
  const deliveryRate = useMemo(() => buildDeliveryRate(quotas), [quotas]);
  const expiredSlippage = useMemo(() => buildExpiredSlippage(quotas), [quotas]);

  const { activeQuotasCount, totalClassesRemaining, expiringThisWeekCount, pendingBacklogCount } = useMemo(() => {
    const activeQuotasCount = quotas.filter(q => q.status === "ACTIVE").length;
    const totalClassesRemaining = quotas.reduce((sum, q) => sum + q.remaining, 0);
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringThisWeekCount = quotas.filter(q => {
      if (!q.validUntil) return false;
      const d = new Date(q.validUntil);
      return d >= now && d <= nextWeek;
    }).length;
    const pendingBacklogCount = activeQuotasCount;
    return { activeQuotasCount, totalClassesRemaining, expiringThisWeekCount, pendingBacklogCount };
  }, [quotas]);

  const chartLabels = t.charts;

  const p = theme.palette;
  const chartColors = {
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
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Button startIcon={<ArrowBackOutlinedIcon />} component={Link} href="/quotas" color="inherit">
          {t.actions.cancel}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t.insightsTitle}
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box
                  sx={() => ({
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: p.primary.light,
                    color: p.primary.main,
                    display: "flex",
                  })}
                >
                  <Inventory2OutlinedIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t.activeQuotasCount}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {loading ? "..." : activeQuotasCount}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box
                  sx={() => ({
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: p.success.light,
                    color: p.success.main,
                    display: "flex",
                  })}
                >
                  <NumbersOutlinedIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t.totalClassesRemaining}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {loading ? "..." : totalClassesRemaining}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box
                  sx={() => ({
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: p.warning.light,
                    color: p.warning.main,
                    display: "flex",
                  })}
                >
                  <EventBusyOutlinedIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t.expiringThisWeekCount}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {loading ? "..." : expiringThisWeekCount}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
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
                  >
                    {redemptionByType.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors.donutColors[index % chartColors.donutColors.length]} />
                    ))}
                  </Pie>
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
                  <Bar dataKey="count" name={chartLabels.deliveryRate}>
                    {deliveryRate.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors.barColors[index % chartColors.barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
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
                  >
                    <Cell fill={chartColors.error} />
                    <Cell fill="transparent" />
                  </Pie>
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
    </Stack>
  );
}
