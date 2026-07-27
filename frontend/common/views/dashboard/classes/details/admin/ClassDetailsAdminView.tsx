// NEW FOR PLAN v5: tier-agnostic admin view composed from existing admin/ sub-components.
// specs.md §6.1 — this view lives in frontend/common/views/dashboard/classes/details/admin/ and
// is consumed by BOTH mobile and desktop ClassDetailsContent wrappers via `<ClassDetailsAdminView
// {...props} labels={labels} />` (see classDetailsContent.{mobile,desktop}.tsx). It owns no state,
// no queries, no side-effects — pure JSX composition of the admin-domain sub-cards, all of which
// receive labels from the `AdminViewLabels` typed prop bag (lifted via useAdminViewLabels).
// Tier-specific styling glue (PageHeader variant, padding, section gaps) is the responsibility of
// the tier-side consumer; here we render the tier-neutral composition with MUI Grid/Stack only.

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ActivityHeatmap } from "@/frontend/common/views/dashboard/classes/details/admin/ActivityHeatmap";
import { AdminActionsBar } from "@/frontend/common/views/dashboard/classes/details/admin/AdminActionsBar";
import { ClassInfoCard } from "@/frontend/common/views/dashboard/classes/details/admin/ClassInfoCard";
import { LivePerformanceGrid } from "@/frontend/common/views/dashboard/classes/details/admin/LivePerformanceGrid";
import { MetadataCard } from "@/frontend/common/views/dashboard/classes/details/admin/MetadataCard";
import { TimezoneWarningBanner } from "@/frontend/common/views/dashboard/classes/details/teacher/TimezoneWarningBanner";
import type { AdminViewProps } from "@/frontend/common/views/dashboard/classes/details/types";
import type { AdminViewLabels } from "@/shared/locale";

interface ClassDetailsAdminViewProps extends AdminViewProps {
  readonly labels: AdminViewLabels;
}

// HeatmapData is typed as JSON[] on the GraphQL side; ActivityHeatmap expects number[].
const coerceHeatmapData = (value: ReadonlyArray<unknown> | null | undefined): readonly number[] => {
  if (!value) return [];
  return value.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
};

// PerformanceMetric key/labelKey/value resolution for LivePerformanceGrid.
interface LivePerformanceMetricRow {
  readonly key: string;
  readonly labelKey: string;
  readonly value: string;
}

const buildLivePerformanceMetrics = (
  instance: AdminViewProps["instance"]
): { readonly metrics: readonly LivePerformanceMetricRow[]; readonly hasData: boolean } => {
  const perf = instance.performance;
  if (!perf) {
    return { metrics: [], hasData: false };
  }
  const metrics: readonly LivePerformanceMetricRow[] = [
    { key: "engagement", labelKey: "engagementScore", value: String(perf.engagementScore ?? "—") },
    { key: "assessment", labelKey: "assessmentProgress", value: String(perf.assessmentProgress ?? "—") },
    { key: "focus", labelKey: "focusLevel", value: perf.focusLevel ?? "—" },
    { key: "health", labelKey: "sessionHealth", value: perf.sessionHealth ?? "—" },
  ];
  const hasData = metrics.some(m => m.value !== "—");
  return { metrics, hasData };
};

export function ClassDetailsAdminView(props: Readonly<ClassDetailsAdminViewProps>) {
  const {
    instance,
    labels,
    handlers,
    isWarningDismissed,
    onDismissWarning,
    onForceActivate,
    onStop,
    onGenerateLog,
    onReschedule,
    onDelete,
    formattedScheduledDate,
  } = props;

  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [overrideRateAmount, setOverrideRateAmount] = useState(instance.rateAmount ?? "");
  const [overrideRateCurrency, setOverrideRateCurrency] = useState<CurrencyCode | null>(instance.rateCurrency ?? null);

  const executionState = instance.executionState ?? "";
  const student = instance.student;
  const teacher = instance.teacher;
  const performance = instance.performance;
  const showLiveMetadata = executionState === "ACTIVATED" || executionState === "RUNNING";
  const { metrics, hasData } = buildLivePerformanceMetrics(instance);
  const heatmapData = coerceHeatmapData(performance?.heatmapData);
  const currencyOptions = Object.values(CurrencyCode);

  const handleOpenOverrideDialog = () => {
    setOverrideRateAmount(instance.rateAmount ?? "");
    setOverrideRateCurrency(instance.rateCurrency ?? null);
    setIsOverrideDialogOpen(true);
  };

  const handleCloseOverrideDialog = () => {
    setIsOverrideDialogOpen(false);
  };

  const handleSubmitOverride = async (clearOverride: boolean) => {
    const normalizedAmount = overrideRateAmount.trim();
    const rateAmount = clearOverride || normalizedAmount.length === 0 ? null : normalizedAmount;
    const rateCurrency = rateAmount ? overrideRateCurrency : null;
    await handlers.handleOverrideRate(rateAmount, rateCurrency);
    setIsOverrideDialogOpen(false);
  };

  return (
    <Stack sx={{ gap: { xs: 2, lg: 3 } }}>
      {!isWarningDismissed && instance.hasTimezoneMismatch && instance.studentTimezone && instance.teacherTimezone ? (
        <TimezoneWarningBanner
          studentTimezone={instance.studentTimezone}
          teacherTimezone={instance.teacherTimezone}
          onDismiss={onDismissWarning}
          labels={labels.timezone}
        />
      ) : null}

      <AdminActionsBar
        executionState={executionState}
        onForceActivate={onForceActivate}
        onStop={onStop}
        onGenerateLog={onGenerateLog}
        onReschedule={onReschedule}
        onDelete={onDelete}
        onOverrideRate={handleOpenOverrideDialog}
        labels={labels.adminActions}
      />

      <Grid container spacing={{ xs: 2, lg: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ClassInfoCard
            courseName={instance.courseName ?? ""}
            subjectId={instance.subjectId ?? ""}
            subjectName={instance.subjectName ?? ""}
            subjectAvatarUrl={instance.subjectAvatarUrl}
            student={
              student ?? {
                id: null,
                name: null,
                avatarUrl: null,
                grade: null,
                level: null,
              }
            }
            teacher={teacher ?? { id: null, name: null, avatarUrl: null, title: null }}
            isActive={executionState === "ACTIVATED" || executionState === "RUNNING"}
            rateAmount={instance.rateAmount ?? null}
            rateCurrency={instance.rateCurrency ?? null}
            rateSource={instance.rateSource ?? null}
            isRateOverridden={instance.isRateOverridden ?? false}
            labels={labels}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <MetadataCard
            scheduledDate={formattedScheduledDate}
            durationMinutes={instance.durationMinutes ?? 0}
            latencyMs={performance?.latencyMs ?? null}
            authorizationLabel={performance?.authorizationLabel ?? null}
            showLiveMetadata={showLiveMetadata}
            labels={labels.metadata}
          />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, lg: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ActivityHeatmap data={heatmapData} labels={labels.heatmap} />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <LivePerformanceGrid metrics={metrics} hasData={hasData} labels={labels.performance} />
        </Grid>
      </Grid>

      <Dialog open={isOverrideDialogOpen} onClose={handleCloseOverrideDialog} fullWidth maxWidth="sm">
        <DialogTitle>{labels.rate.overrideRateDialogTitle}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.rate.overrideRateDialogDescription}
          </Typography>
          <TextField
            label={labels.rate.hourlyRateLabel}
            value={overrideRateAmount}
            onChange={event => setOverrideRateAmount(event.target.value)}
            type="text"
            fullWidth
          />
          <TextField
            select
            label={labels.rate.currencyLabel}
            value={overrideRateCurrency ?? ""}
            onChange={event => setOverrideRateCurrency((event.target.value as CurrencyCode) || null)}
            fullWidth
          >
            <MenuItem value="">{labels.rate.currencyLabel}</MenuItem>
            {currencyOptions.map(currency => (
              <MenuItem key={currency} value={currency}>
                {currency}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOverrideDialog}>{labels.rate.cancelButton}</Button>
          <Button onClick={() => void handleSubmitOverride(true)}>{labels.rate.clearOverrideButton}</Button>
          <Button variant="contained" onClick={() => void handleSubmitOverride(false)}>
            {labels.rate.saveButton}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
