"use client";

import type { ComponentType } from "react";
import type { BaseDeleteDialogSharedProps } from "@/frontend/common/components/ui/dialog/types/baseDeleteDialogShared.types";
import { CronManualTriggerDialog } from "@/frontend/common/views/dashboard/cron/components/CronManualTriggerDialog";
import { CronRunsDialog } from "@/frontend/common/views/dashboard/cron/components/CronRunsDialog";
import { CronScheduleCreateEditDialog } from "@/frontend/common/views/dashboard/cron/components/CronScheduleCreateEditDialog";
import type { CronViewProps } from "@/frontend/common/views/dashboard/cron/types";

export interface CronDialogsSharedConfig {
  readonly BaseDeleteDialog: ComponentType<Readonly<BaseDeleteDialogSharedProps>>;
}

export interface CronDialogsSharedProps {
  readonly deletingSchedule: CronViewProps["deletingSchedule"];
  readonly deleting: CronViewProps["deleting"];
  readonly createOpen: CronViewProps["createOpen"];
  readonly editingSchedule: CronViewProps["editingSchedule"];
  readonly saving: CronViewProps["saving"];
  readonly runsOpen: CronViewProps["runsOpen"];
  readonly runsSchedule: CronViewProps["runsSchedule"];
  readonly runs: CronViewProps["runs"];
  readonly runsLoading: CronViewProps["runsLoading"];
  readonly triggering: CronViewProps["triggering"];
  readonly triggeringSchedule: CronViewProps["triggeringSchedule"];
  readonly labels: CronViewProps["labels"];
  readonly onDeleteClose: CronViewProps["onDeleteClose"];
  readonly onDeleteConfirm: CronViewProps["onDeleteConfirm"];
  readonly onEditClose: CronViewProps["onEditClose"];
  readonly onCreateClose: CronViewProps["onCreateClose"];
  readonly onSave: CronViewProps["onSave"];
  readonly onPreviewNextRuns: CronViewProps["onPreviewNextRuns"];
  readonly onRunsClose: CronViewProps["onRunsClose"];
  readonly onTriggerClose: CronViewProps["onTriggerClose"];
  readonly onTriggerConfirm: CronViewProps["onTriggerConfirm"];
  readonly config: Readonly<CronDialogsSharedConfig>;
}

export function CronDialogsShared({
  deletingSchedule,
  deleting,
  createOpen,
  editingSchedule,
  saving,
  runsOpen,
  runsSchedule,
  runs,
  runsLoading,
  triggering,
  triggeringSchedule,
  labels,
  onDeleteClose,
  onDeleteConfirm,
  onEditClose,
  onCreateClose,
  onSave,
  onPreviewNextRuns,
  onRunsClose,
  onTriggerClose,
  onTriggerConfirm,
  config,
}: Readonly<CronDialogsSharedProps>) {
  const { BaseDeleteDialog } = config;
  return (
    <>
      <BaseDeleteDialog
        open={Boolean(deletingSchedule)}
        onClose={onDeleteClose}
        onConfirm={onDeleteConfirm}
        isLoading={deleting}
        title={labels.actionDelete}
        body={`${labels.actionDelete}: ${deletingSchedule?.name ?? ""}`}
        cancelLabel={labels.actionCancel}
        confirmLabel={labels.actionDelete}
      />

      <CronScheduleCreateEditDialog
        open={createOpen || editingSchedule != null}
        editingSchedule={editingSchedule}
        labels={labels}
        saving={saving}
        previewNextRuns={onPreviewNextRuns}
        onClose={editingSchedule ? onEditClose : onCreateClose}
        onSave={onSave}
      />

      <CronRunsDialog
        open={runsOpen}
        scheduleName={runsSchedule?.name ?? null}
        labels={labels}
        runs={runs}
        loading={runsLoading}
        onClose={onRunsClose}
      />

      <CronManualTriggerDialog
        open={triggering}
        schedule={triggeringSchedule ?? null}
        labels={labels}
        triggering={triggering}
        onConfirm={onTriggerConfirm}
        onClose={onTriggerClose}
      />
    </>
  );
}
