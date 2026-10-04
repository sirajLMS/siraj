"use client";

import { Stack } from "@mui/material";
import { ClassExecutionState } from "@/frontend/common/graphql/generated/gql/graphql";
import { AdminActionsBar } from "@/frontend/common/views/dashboard/classes/details/admin/AdminActionsBar";
import {
  buildLivePerformanceMetrics,
  coerceHeatmapData,
} from "@/frontend/common/views/dashboard/classes/details/admin/classDetailsAdminView.helpers";
import { OverrideRateDialog } from "@/frontend/common/views/dashboard/classes/details/admin/classDetailsAdminViewOverrideRateDialog.parts";
import {
  ClassDetailsInfoGrid,
  ClassDetailsPerformanceGrid,
  ClassDetailsTimezoneWarning,
} from "@/frontend/common/views/dashboard/classes/details/admin/classDetailsAdminViewSections.parts";
import type {
  AdminViewProps,
  ClassDetailsMetricGridSlot,
} from "@/frontend/common/views/dashboard/classes/details/types";
import type { AdminViewLabels } from "@/shared/locale";

/**
 * Tier-neutral admin composition of the class-details sub-cards. Owns no state, queries, or
 * side-effects: it receives the store-backed override-rate dialog state and action callbacks, and
 * renders the admin cards, all of which read copy from the typed `AdminViewLabels` bag.
 * Tier-specific chrome (header variant, padding, section gaps) is the consuming wrapper's concern.
 */
interface ClassDetailsAdminViewProps extends AdminViewProps {
  readonly labels: AdminViewLabels;
  readonly livePerformanceMetricGrid: ClassDetailsMetricGridSlot;
}

export function ClassDetailsAdminView(props: Readonly<ClassDetailsAdminViewProps>) {
  const {
    instance,
    labels,
    overrideRateDialog,
    isWarningDismissed,
    onDismissWarning,
    onForceActivate,
    onStop,
    onGenerateLog,
    onReschedule,
    onDelete,
    formattedScheduledDate,
    livePerformanceMetricGrid,
  } = props;

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
        onOverrideRate={overrideRateDialog.onOpen}
        labels={labels.adminActions}
      />

      <ClassDetailsInfoGrid
        instance={instance}
        executionState={executionState}
        showLiveMetadata={showLiveMetadata}
        formattedScheduledDate={formattedScheduledDate}
        labels={labels}
      />

      <ClassDetailsPerformanceGrid
        heatmapData={heatmapData}
        metrics={metrics}
        hasData={hasData}
        labels={labels}
        metricGrid={livePerformanceMetricGrid}
      />

      <OverrideRateDialog dialog={overrideRateDialog} labels={labels} />
    </Stack>
  );
}
