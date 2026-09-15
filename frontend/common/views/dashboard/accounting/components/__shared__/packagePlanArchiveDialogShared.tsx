"use client";

import { ArchiveOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import type { UsePackagePlanFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel";

interface PackagePlanArchiveDialogLabels {
  readonly title: string;
  readonly body: string;
  readonly cancel: string;
  readonly confirm: string;
}

interface PackagePlanArchiveDialogSharedProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly archiving: boolean;
  readonly labels: PackagePlanArchiveDialogLabels;
}

/** Confirmation dialog for archiving a package plan; shared across viewport tiers. */
function PackagePlanArchiveDialogShared({
  open,
  onClose,
  onConfirm,
  archiving,
  labels,
}: Readonly<PackagePlanArchiveDialogSharedProps>) {
  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={archiving}
      title={labels.title}
      body={labels.body}
      cancelLabel={labels.cancel}
      confirmLabel={labels.confirm}
    />
  );
}

export interface PackagePlanArchiveTriggerButtonProps {
  readonly archiving: boolean;
  readonly planActive: boolean;
  readonly onOpen: () => void;
  readonly label: string;
}

/** Button that opens the archive confirmation dialog; disabled while archiving or plans already inactive. */
export function PackagePlanArchiveTriggerButton({
  archiving,
  planActive,
  onOpen,
  label,
}: Readonly<PackagePlanArchiveTriggerButtonProps>) {
  return (
    <Button
      color="error"
      variant="outlined"
      startIcon={<ArchiveOutlined />}
      onClick={onOpen}
      disabled={archiving || !planActive}
    >
      {label}
    </Button>
  );
}

export type PackagePlanArchiveSectionSharedProps = Pick<
  UsePackagePlanFormViewModel,
  "t" | "existing" | "archiveDialogOpen" | "setArchiveDialogOpen" | "onArchive" | "archiving"
>;

/** Archive confirmation dialog wired to the package-plan form view-model; shared across viewport tiers. */
export function PackagePlanArchiveSectionShared({
  t,
  existing,
  archiveDialogOpen,
  setArchiveDialogOpen,
  onArchive,
  archiving,
}: Readonly<PackagePlanArchiveSectionSharedProps>) {
  return (
    <PackagePlanArchiveDialogShared
      open={archiveDialogOpen}
      onClose={() => setArchiveDialogOpen(false)}
      onConfirm={() => void onArchive()}
      archiving={archiving}
      labels={{
        title: t.archiveTitle,
        body: existing ? t.archiveBody(existing.displayName ?? "") : "",
        cancel: t.form.cancel,
        confirm: t.archiveConfirm,
      }}
    />
  );
}
