"use client";

import type { ButtonProps } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import {
  buildClassAuditBreadcrumbs,
  type ClassAuditHeaderBreadcrumb,
  classAuditGenerateReportButtonSx,
} from "@/frontend/common/views/dashboard/classes/audit/components/__shared__/classAuditHeaderShared.helpers";

/** Minimal heading contract both tier page headers satisfy. */
export interface ClassAuditHeaderSlotProps {
  readonly title: string;
  readonly breadcrumbs: readonly ClassAuditHeaderBreadcrumb[];
  readonly actions: ReactNode;
}

export interface ClassAuditHeaderSlots {
  readonly PageHeader: ComponentType<ClassAuditHeaderSlotProps>;
  readonly FilterButton: ComponentType<ButtonProps>;
  readonly PrimaryAction: ComponentType<ButtonProps>;
}

export interface ClassAuditHeaderSharedProps {
  readonly title: string;
  readonly labels: ClassAuditViewProps["labels"];
  readonly onGenerateReport: ClassAuditViewProps["onGenerateReport"];
  readonly onEditClass: ClassAuditViewProps["onEditClass"];
  readonly slots: ClassAuditHeaderSlots;
}

/**
 * Shared class-audit page header: breadcrumbs plus the "generate report" and
 * "edit class" actions, rendered through the tier-specific header and button
 * components supplied via slots.
 */
export function ClassAuditHeaderShared({
  title,
  labels,
  onGenerateReport,
  onEditClass,
  slots,
}: Readonly<ClassAuditHeaderSharedProps>) {
  const { PageHeader, FilterButton, PrimaryAction } = slots;

  return (
    <PageHeader
      title={title}
      breadcrumbs={buildClassAuditBreadcrumbs(labels)}
      actions={
        <>
          <FilterButton id="audit-generate-report-btn" onClick={onGenerateReport} sx={classAuditGenerateReportButtonSx}>
            {labels.generateReport}
          </FilterButton>
          <PrimaryAction id="audit-edit-class-btn" onClick={onEditClass}>
            {labels.editClass}
          </PrimaryAction>
        </>
      }
    />
  );
}
