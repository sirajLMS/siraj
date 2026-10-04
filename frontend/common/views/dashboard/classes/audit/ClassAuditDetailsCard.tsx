"use client";

import { BaseCard } from "@/frontend/common/components/ui";
import {
  ClassAuditFields,
  ClassAuditHeader,
  ClassAuditTrail,
} from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.parts";
import { ClassAuditPayrollCard } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.payrollCard.parts";
import { StyledCardStack } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.styled";
import type { ClassAuditDetailsCardProps } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.types";

/**
 * Payroll snapshot consumed by the audit details card and the shared audit view
 * grid; kept on this module so existing type imports resolve unchanged.
 */
export type { ClassAuditPayrollSnapshot } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.types";

export function ClassAuditDetailsCard({
  audit,
  labels,
  payroll,
  statusEvents,
  onOverride,
}: ClassAuditDetailsCardProps) {
  return (
    <StyledCardStack>
      <BaseCard sx={{ p: 0, overflow: "hidden" }}>
        <ClassAuditHeader auditName={audit.className ?? ""} statusLabel={labels.statusRescheduled} />
        <ClassAuditFields audit={audit} labels={labels} />
        <ClassAuditTrail audit={audit} labels={labels} />
      </BaseCard>
      {payroll ? (
        <ClassAuditPayrollCard payroll={payroll} statusEvents={statusEvents ?? null} onOverride={onOverride} />
      ) : null}
    </StyledCardStack>
  );
}
