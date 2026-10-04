"use client";

import { Dialog } from "@mui/material";
import type { ReactNode } from "react";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import type { ClassSubjectOption } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  MANUAL_CLASS_ENTRY_TITLE_ID,
  type ManualClassEntryLabels,
  type ManualClassEntrySubmitData,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/manualClassEntryDialog.helpers";
import { ManualClassEntryForm } from "@/frontend/common/views/dashboard/teachers/dashboard/components/manualClassEntryDialog.parts";

export interface ManualClassEntryDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (data: ManualClassEntrySubmitData) => Promise<void>;
  readonly defaultActive?: boolean;
  readonly studentSelect: ReactNode;
  readonly subjects: readonly ClassSubjectOption[];
  readonly subjectsLoading: boolean;
  readonly labels: ManualClassEntryLabels;
  /** Renders the dialog edge-to-edge; the mobile tier wrapper sets this. */
  readonly fullScreen?: boolean;
}

export function ManualClassEntryDialog({
  open,
  onClose,
  onSubmit,
  defaultActive = false,
  studentSelect,
  subjects,
  subjectsLoading,
  labels,
  fullScreen = false,
}: Readonly<ManualClassEntryDialogProps>) {
  return (
    <Dialog
      {...DialogPresets.info}
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      aria-labelledby={MANUAL_CLASS_ENTRY_TITLE_ID}
    >
      <ManualClassEntryForm
        key={open ? "open" : "closed"}
        onClose={onClose}
        onSubmit={onSubmit}
        defaultActive={defaultActive}
        studentSelect={studentSelect}
        subjects={subjects}
        subjectsLoading={subjectsLoading}
        labels={labels}
      />
    </Dialog>
  );
}
