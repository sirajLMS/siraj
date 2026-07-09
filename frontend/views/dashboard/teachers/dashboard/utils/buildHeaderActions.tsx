"use client";

import { AddOutlined, PrintOutlined } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { PrimaryPageAction } from "@/frontend/components/ui";

import type { TeacherDashboardLabels } from "@/frontend/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

export function buildHeaderActions({
  labels,
  canManualEntry,
  canPrintSchedule,
  canActivate,
  onPrintSchedule,
  onManualEntry,
  onNewSession,
}: {
  readonly labels: TeacherDashboardLabels;
  readonly canManualEntry: boolean;
  readonly canPrintSchedule: boolean;
  readonly canActivate: boolean;
  readonly onPrintSchedule: () => void;
  readonly onManualEntry: () => void;
  readonly onNewSession: () => void;
}) {
  const actions: ReactNode[] = [];

  if (canPrintSchedule) {
    actions.push(
      <Button key="print" startIcon={<PrintOutlined />} onClick={onPrintSchedule} sx={{ typography: "labelUppercase" }}>
        {labels.actions.printSchedule}
      </Button>
    );
  }

  if (canManualEntry) {
    actions.push(
      <PrimaryPageAction key="manual" startIcon={<AddOutlined />} onClick={onManualEntry}>
        {labels.actions.manualEntry}
      </PrimaryPageAction>
    );
  }

  if (canActivate) {
    actions.push(
      <PrimaryPageAction key="new-session" startIcon={<AddOutlined />} onClick={onNewSession}>
        {labels.actions.newSession}
      </PrimaryPageAction>
    );
  }

  if (actions.length === 0) {
    return undefined;
  }

  return (
    <Stack direction="row" spacing={1.5}>
      {actions}
    </Stack>
  );
}
