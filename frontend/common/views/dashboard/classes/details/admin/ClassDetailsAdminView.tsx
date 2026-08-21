"use client";

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
import { ClassExecutionState, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import { ActivityHeatmap } from "@/frontend/common/views/dashboard/classes/details/admin/ActivityHeatmap";
import { AdminActionsBar } from "@/frontend/common/views/dashboard/classes/details/admin/AdminActionsBar";
import { ClassInfoCard } from "@/frontend/common/views/dashboard/classes/details/admin/ClassInfoCard";
import { LivePerformanceGrid } from "@/frontend/common/views/dashboard/classes/details/admin/LivePerformanceGrid";
import { MetadataCard } from "@/frontend/common/views/dashboard/classes/details/admin/MetadataCard";
import { TimezoneWarningBanner } from "@/frontend/common/views/dashboard/classes/details/teacher/TimezoneWarningBanner";
import type { AdminViewProps } from "@/frontend/common/views/dashboard/classes/details/types";
import type { AdminViewLabels } from "@/shared/locale";

const CURRENCY_CODE_VALUES = new Set<string>(Object.values(CurrencyCode).map((v): string => v));

function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCY_CODE_VALUES.has(value);
}

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

interface ClassDetailsTimezoneWarningProps {
  readonly instance: AdminViewProps["instance"];
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly labels: AdminViewLabels;
}

function ClassDetailsTimezoneWarning(props: Readonly<ClassDetailsTimezoneWarningProps>) {
  const { instance, isWarningDismissed, onDismissWarning, labels } = props;
  if (isWarningDismissed || !instance.hasTimezoneMismatch || !instance.studentTimezone || !instance.teacherTimezone) {
    return null;
  }
  return (
    <TimezoneWarningBanner
      studentTimezone={instance.studentTimezone}
      teacherTimezone={instance.teacherTimezone}
      onDismiss={onDismissWarning}
      labels={labels.timezone}
    />
  );
}

interface ClassDetailsInfoGridProps {
  readonly instance: AdminViewProps["instance"];
  readonly executionState: string;
  readonly showLiveMetadata: boolean;
  readonly formattedScheduledDate: string;
  readonly labels: AdminViewLabels;
}

function ClassDetailsInfoGrid(props: Readonly<ClassDetailsInfoGridProps>) {
  const { instance, executionState, showLiveMetadata, formattedScheduledDate, labels } = props;
  const student = instance.student;
  const teacher = instance.teacher;
  const performance = instance.performance;

  return (
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
  );
}

interface ClassDetailsPerformanceGridProps {
  readonly heatmapData: readonly number[];
  readonly metrics: readonly LivePerformanceMetricRow[];
  readonly hasData: boolean;
  readonly labels: AdminViewLabels;
}

function ClassDetailsPerformanceGrid(props: Readonly<ClassDetailsPerformanceGridProps>) {
  const { heatmapData, metrics, hasData, labels } = props;

  return (
    <Grid container spacing={{ xs: 2, lg: 3 }}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <ActivityHeatmap data={heatmapData} labels={labels.heatmap} />
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <LivePerformanceGrid metrics={metrics} hasData={hasData} labels={labels.performance} />
      </Grid>
    </Grid>
  );
}

interface OverrideRateDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly labels: AdminViewLabels;
  readonly overrideRateAmount: string;
  readonly onOverrideRateAmountChange: (value: string) => void;
  readonly overrideRateCurrency: CurrencyCode | null;
  readonly onOverrideRateCurrencyChange: (value: CurrencyCode | null) => void;
  readonly onSubmitOverride: (clearOverride: boolean) => void | Promise<void>;
}

function OverrideRateDialog(props: Readonly<OverrideRateDialogProps>) {
  const {
    open,
    onClose,
    labels,
    overrideRateAmount,
    onOverrideRateAmountChange,
    overrideRateCurrency,
    onOverrideRateCurrencyChange,
    onSubmitOverride,
  } = props;
  const currencyOptions = Object.values(CurrencyCode);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{labels.rate.overrideRateDialogTitle}</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.rate.overrideRateDialogDescription}
        </Typography>
        <TextField
          label={labels.rate.hourlyRateLabel}
          value={overrideRateAmount}
          onChange={event => onOverrideRateAmountChange(event.target.value)}
          type="text"
          fullWidth
        />
        <TextField
          select
          label={labels.rate.currencyLabel}
          value={overrideRateCurrency ?? ""}
          onChange={event => {
            const raw = event.target.value;
            onOverrideRateCurrencyChange(raw && isCurrencyCode(raw) ? raw : null);
          }}
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
        <Button onClick={onClose}>{labels.rate.cancelButton}</Button>
        <Button
          onClick={() => {
            void Promise.resolve(onSubmitOverride(true)).catch((err: Error) =>
              logger.error("Failed to clear override rate", err)
            );
          }}
        >
          {labels.rate.clearOverrideButton}
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            void Promise.resolve(onSubmitOverride(false)).catch((err: Error) =>
              logger.error("Failed to save override rate", err)
            );
          }}
        >
          {labels.rate.saveButton}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function useOverrideRateDialog(instance: AdminViewProps["instance"], handlers: AdminViewProps["handlers"]) {
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [overrideRateAmount, setOverrideRateAmount] = useState(instance.rateAmount ?? "");
  const [overrideRateCurrency, setOverrideRateCurrency] = useState<CurrencyCode | null>(instance.rateCurrency ?? null);

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

  return {
    isOverrideDialogOpen,
    overrideRateAmount,
    setOverrideRateAmount,
    overrideRateCurrency,
    setOverrideRateCurrency,
    handleOpenOverrideDialog,
    handleCloseOverrideDialog,
    handleSubmitOverride,
  };
}

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

  const overrideRateDialog = useOverrideRateDialog(instance, handlers);

  const executionState = instance.executionState ?? "";
  const performance = instance.performance;
  const showLiveMetadata =
    executionState === ClassExecutionState.Activated || executionState === ClassExecutionState.Running;
  const { metrics, hasData } = buildLivePerformanceMetrics(instance);
  const heatmapData = coerceHeatmapData(performance?.heatmapData);

  return (
    <Stack sx={{ gap: { xs: 2, lg: 3 } }}>
      <ClassDetailsTimezoneWarning
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={onDismissWarning}
        labels={labels}
      />

      <AdminActionsBar
        executionState={executionState}
        onForceActivate={onForceActivate}
        onStop={onStop}
        onGenerateLog={onGenerateLog}
        onReschedule={onReschedule}
        onDelete={onDelete}
        onOverrideRate={overrideRateDialog.handleOpenOverrideDialog}
        labels={labels.adminActions}
      />

      <ClassDetailsInfoGrid
        instance={instance}
        executionState={executionState}
        showLiveMetadata={showLiveMetadata}
        formattedScheduledDate={formattedScheduledDate}
        labels={labels}
      />

      <ClassDetailsPerformanceGrid heatmapData={heatmapData} metrics={metrics} hasData={hasData} labels={labels} />

      <OverrideRateDialog
        open={overrideRateDialog.isOverrideDialogOpen}
        onClose={overrideRateDialog.handleCloseOverrideDialog}
        labels={labels}
        overrideRateAmount={overrideRateDialog.overrideRateAmount}
        onOverrideRateAmountChange={overrideRateDialog.setOverrideRateAmount}
        overrideRateCurrency={overrideRateDialog.overrideRateCurrency}
        onOverrideRateCurrencyChange={overrideRateDialog.setOverrideRateCurrency}
        onSubmitOverride={overrideRateDialog.handleSubmitOverride}
      />
    </Stack>
  );
}
