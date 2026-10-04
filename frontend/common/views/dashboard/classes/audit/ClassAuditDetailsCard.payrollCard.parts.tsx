"use client";

import { Box, Button } from "@mui/material";
import { useMemo } from "react";
import { BaseCard, StatusBadge } from "@/frontend/common/components/ui";
import {
  AppPermission,
  type ClassStatusEventsQuery_classStatusEvents,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { DetailField } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.parts";
import {
  buildStatusLabels,
  formatPaidAmount,
  PAYROLL_SECTION_ID,
  selectOverrideEvents,
  usePayrollHighlight,
} from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.payrollCard.helpers";
import {
  StyledAuditTrailIcon,
  StyledFieldValueText,
  StyledHistoryDescription,
  StyledHistoryEntry,
  StyledHistoryTimestamp,
  StyledHistoryTitleRow,
  StyledNoEventsText,
  StyledOverrideHistorySection,
  StyledPayrollHeaderRow,
  StyledPayrollIcon,
  StyledPayrollSection,
  StyledPayrollTitleRow,
  StyledSectionTitle,
} from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.styled";
import type { ClassAuditPayrollSnapshot } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.types";
import { formatAuditTimestamp } from "@/frontend/common/views/dashboard/classes/audit/utils";
import { useAppTranslation } from "@/shared/locale/client";
import { useAppLocale } from "@/shared/locale/localeContext";
import { DashboardBillingPayroll } from "@/shared/locale/namespaces";

interface ClassAuditPayrollCardProps {
  readonly payroll: ClassAuditPayrollSnapshot;
  readonly statusEvents: readonly ClassStatusEventsQuery_classStatusEvents[] | null;
  readonly onOverride: (() => void) | undefined;
}

export function ClassAuditPayrollCard({ payroll, statusEvents, onOverride }: Readonly<ClassAuditPayrollCardProps>) {
  const locale = useAppLocale();
  const payrollLabels = useAppTranslation(DashboardBillingPayroll);
  const hasPermission = useUserStore(state => state.hasPermission);
  const canOverride = onOverride !== undefined && hasPermission(AppPermission.AccountingPayrollManage);
  const overrideEvents = useMemo(() => selectOverrideEvents(statusEvents ?? []), [statusEvents]);
  const statusLabels = useMemo(() => buildStatusLabels(payrollLabels.status), [payrollLabels.status]);
  const { sectionRef, isHighlighted } = usePayrollHighlight();

  return (
    <Box
      id={PAYROLL_SECTION_ID}
      ref={sectionRef}
      sx={theme => ({
        outline: isHighlighted ? `2px solid ${theme.palette.primary.main}` : undefined,
        outlineOffset: 2,
        borderRadius: theme.shape.borderRadius,
      })}
    >
      <BaseCard sx={{ p: 0, overflow: "hidden" }}>
        <StyledPayrollSection>
          <StyledPayrollHeaderRow>
            <StyledPayrollTitleRow>
              <StyledPayrollIcon />
              <StyledSectionTitle variant="titleLg">{payrollLabels.audit.title}</StyledSectionTitle>
            </StyledPayrollTitleRow>
            {canOverride ? (
              <Button size="small" variant="outlined" onClick={onOverride}>
                {payrollLabels.override.action}
              </Button>
            ) : null}
          </StyledPayrollHeaderRow>
          <Box
            sx={{
              mt: 3,
              display: { xs: "flex", md: "grid" },
              flexDirection: "column",
              gap: 3,
              gridTemplateColumns: { md: "1fr 1fr" },
            }}
          >
            <DetailField label={payrollLabels.column.status}>
              {payroll.calculationStatus === null ? (
                <StyledFieldValueText variant="bodyLg">—</StyledFieldValueText>
              ) : (
                <StatusBadge
                  category="payrollCalculation"
                  status={payroll.calculationStatus}
                  label={statusLabels[payroll.calculationStatus]}
                />
              )}
            </DetailField>
            <DetailField label={payrollLabels.column.calculatedDuration}>
              <StyledFieldValueText variant="bodyLg">{payroll.calculatedDuration ?? "—"}</StyledFieldValueText>
            </DetailField>
            <DetailField label={payrollLabels.column.paidAmount}>
              <StyledFieldValueText variant="bodyLg">
                {formatPaidAmount(payroll.teacherPaidAmount, payroll.teacherPaidCurrency)}
              </StyledFieldValueText>
            </DetailField>
            {payroll.isPartialPercentage !== null ? (
              <DetailField label={payrollLabels.column.partialPercentage}>
                <StyledFieldValueText variant="bodyLg">{payroll.isPartialPercentage}</StyledFieldValueText>
              </DetailField>
            ) : null}
            {payroll.payrollNote !== null && payroll.payrollNote !== "" ? (
              <DetailField label={payrollLabels.column.note}>
                <StyledFieldValueText variant="bodyLg">{payroll.payrollNote}</StyledFieldValueText>
              </DetailField>
            ) : null}
          </Box>
          <StyledOverrideHistorySection>
            <StyledHistoryTitleRow>
              <StyledAuditTrailIcon />
              <StyledSectionTitle variant="titleLg">{payrollLabels.audit.overrideHistory}</StyledSectionTitle>
            </StyledHistoryTitleRow>
            {overrideEvents.length === 0 ? (
              <StyledNoEventsText variant="bodyMd">{payrollLabels.audit.noOverrideEvents}</StyledNoEventsText>
            ) : (
              overrideEvents.map(event => (
                <StyledHistoryEntry key={event.id ?? `${event.createdAt ?? "event"}-${event.description ?? ""}`}>
                  <StyledHistoryTimestamp variant="labelMd">
                    {formatAuditTimestamp(event.createdAt, locale)}
                  </StyledHistoryTimestamp>
                  <StyledHistoryDescription variant="bodyMd">{event.description ?? "—"}</StyledHistoryDescription>
                </StyledHistoryEntry>
              ))
            )}
          </StyledOverrideHistorySection>
        </StyledPayrollSection>
      </BaseCard>
    </Box>
  );
}
