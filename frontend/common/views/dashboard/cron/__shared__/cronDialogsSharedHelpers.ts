import type { CronDialogsSharedProps } from "@/frontend/common/views/dashboard/cron/__shared__/cronDialogsShared";
import type { CronViewProps } from "@/frontend/common/views/dashboard/cron/types";

export function getCronDialogsProps(props: Readonly<CronViewProps>): Omit<CronDialogsSharedProps, "config"> {
  return {
    deletingSchedule: props.deletingSchedule,
    deleting: props.deleting,
    createOpen: props.createOpen,
    editingSchedule: props.editingSchedule,
    saving: props.saving,
    runsOpen: props.runsOpen,
    runsSchedule: props.runsSchedule,
    runs: props.runs,
    runsLoading: props.runsLoading,
    triggering: props.triggering,
    triggeringSchedule: props.triggeringSchedule,
    labels: props.labels,
    onDeleteClose: props.onDeleteClose,
    onDeleteConfirm: props.onDeleteConfirm,
    onEditClose: props.onEditClose,
    onCreateClose: props.onCreateClose,
    onSave: props.onSave,
    onPreviewNextRuns: props.onPreviewNextRuns,
    onRunsClose: props.onRunsClose,
    onTriggerClose: props.onTriggerClose,
    onTriggerConfirm: props.onTriggerConfirm,
  };
}
