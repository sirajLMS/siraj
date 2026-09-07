"use client";

import {
  AccountCircleOutlined,
  EventNoteOutlined,
  HistoryOutlined,
  PaymentsOutlined,
  UpdateOutlined,
} from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { type ReactNode, useMemo } from "react";
import { BaseCard, StatusBadge } from "@/frontend/common/components/ui";
import {
  AppPermission,
  CalculationStatus,
  type ClassStatusEventsQuery_classStatusEvents,
  type CurrencyCode,
  type GroupClassAuditQuery_groupClassAudit as GroupClassAudit,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { CalculationStatusChip } from "@/frontend/common/views/dashboard/accounting/payroll/CalculationStatusChip";
import { formatAuditTimestamp } from "@/frontend/common/views/dashboard/classes/audit/utils";
import { useAppTranslation } from "@/shared/locale/client";
import { useAppLocale } from "@/shared/locale/localeContext";
import { DashboardBillingPayroll } from "@/shared/locale/namespaces";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

/** Audit-event type the payroll domain appends for every operator override. */
const PAYROLL_OVERRIDE_EVENT_TYPE = "PAYROLL_OVERRIDE";

/** Payroll calculation values surfaced on the audit drawer; payroll report rows satisfy the shape structurally. */
export interface ClassAuditPayrollSnapshot {
  readonly calculationStatus: CalculationStatus | null;
  readonly calculatedDuration: number | null;
  readonly teacherPaidAmount: string | null;
  readonly teacherPaidCurrency: CurrencyCode | null;
  readonly isPartialPercentage: number | null;
  readonly payrollNote: string | null;
}

interface ClassAuditDetailsCardProps {
  readonly audit: NonNullable<GroupClassAudit>;
  readonly labels: {
    readonly courseCode: string;
    readonly teacher: string;
    readonly originalDate: string;
    readonly rescheduledDate: string;
    readonly timeSlot: string;
    readonly venue: string;
    readonly auditTrailTitle: string;
    readonly auditTrailEmpty: string;
    readonly statusRescheduled: string;
    readonly classDetails: string;
  };
  /**
   * Current payroll calculation values for the instance; the payroll card is
   * omitted entirely while no snapshot is available.
   */
  readonly payroll?: ClassAuditPayrollSnapshot | null;
  /** Class status events for the instance; override rows are listed chronologically. */
  readonly statusEvents?: readonly ClassStatusEventsQuery_classStatusEvents[] | null;
  /** Override request raised to the parent, which owns the override dialog instance. */
  readonly onOverride?: () => void;
}

interface DetailFieldProps {
  readonly label: string;
  readonly children: ReactNode;
}

const StyledDetailLabel = styled(Typography)(({ theme }) => ({
  textTransform: "uppercase",
  color: theme.palette.onSurfaceVariant,
}));

const StyledHeaderBar = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
}));

const StyledHeaderEventIcon = styled(EventNoteOutlined)(({ theme }) => ({
  color: theme.palette.onPrimary,
  fontSize: 28,
}));

const StyledHeaderTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimary,
}));

const StyledEmphasizedFieldValue = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

const StyledTeacherIcon = styled(AccountCircleOutlined)(({ theme }) => ({
  fontSize: 20,
  color: theme.palette.primary.main,
}));

const StyledFieldValueText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));

const StyledOriginalDateText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textDecoration: "line-through",
  opacity: 0.6,
}));

const StyledAuditTrailSection = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(3),
  backgroundColor: theme.palette.surfaceContainerLow,
  borderTop: `1px solid ${theme.palette.border.light}`,
}));

const StyledAuditTrailIcon = styled(HistoryOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledRemarkQuoteBlock = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: 2,
  borderLeft: `4px solid ${theme.palette.header}`,
  boxShadow: theme.palette.shadow.card,
}));

const StyledRemarkItalicText = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.onSurface,
  lineHeight: 1.6,
}));

const StyledRemarkMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  marginTop: theme.spacing(1.5),
  color: theme.palette.onSurfaceVariant,
}));

const StyledCardStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

const StyledPayrollSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StyledPayrollHeaderRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
}));

const StyledPayrollTitleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledPayrollIcon = styled(PaymentsOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledOverrideHistorySection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  paddingTop: theme.spacing(3),
  borderTop: `1px solid ${theme.palette.border.light}`,
}));

const StyledHistoryTitleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const StyledHistoryEntry = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.25),
  paddingBlock: theme.spacing(1),
  "& + &": {
    borderTop: `1px solid ${theme.palette.border.light}`,
  },
}));

const StyledHistoryTimestamp = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

const StyledHistoryDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));

const StyledNoEventsText = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.onSurfaceVariant,
}));

function DetailField({ label, children }: DetailFieldProps) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "center",
      }}
    >
      <StyledDetailLabel variant="labelMd">{label}:</StyledDetailLabel>
      {children}
    </Box>
  );
}

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

function ClassAuditHeader({ auditName, statusLabel }: Readonly<{ auditName: string; statusLabel: string }>) {
  return (
    <StyledHeaderBar>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <StyledHeaderEventIcon />
        <StyledHeaderTitle variant="titleLg">{auditName}</StyledHeaderTitle>
      </Box>
      <StatusBadge category="trackingStatus" status="rescheduled" label={statusLabel} />
    </StyledHeaderBar>
  );
}

function ClassAuditFields({ audit, labels }: ClassAuditDetailsCardProps) {
  const locale = useAppLocale();
  return (
    <Box
      sx={{
        p: 3,
        display: { xs: "flex", md: "grid" },
        flexDirection: "column",
        gap: 3,
        gridTemplateColumns: { md: "1fr 1fr" },
      }}
    >
      <DetailField label={labels.courseCode}>
        <StyledEmphasizedFieldValue variant="bodyLg">{audit.courseCode ?? ""}</StyledEmphasizedFieldValue>
      </DetailField>
      <DetailField label={labels.teacher}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <StyledTeacherIcon />
          <StyledFieldValueText variant="bodyLg">{audit.teacherName ?? ""}</StyledFieldValueText>
        </Box>
      </DetailField>
      <DetailField label={labels.originalDate}>
        <StyledOriginalDateText variant="bodyLg">
          {formatAuditTimestamp(audit.originalDate, locale)}
        </StyledOriginalDateText>
      </DetailField>
      <DetailField label={labels.rescheduledDate}>
        <StyledEmphasizedFieldValue variant="bodyLg">
          {formatAuditTimestamp(audit.rescheduledDate, locale)}
        </StyledEmphasizedFieldValue>
      </DetailField>
      <DetailField label={labels.timeSlot}>
        <StyledFieldValueText variant="bodyLg" dir="ltr" sx={{ unicodeBidi: "isolate" }}>
          {audit.timeSlot ?? ""}
        </StyledFieldValueText>
      </DetailField>
      <DetailField label={labels.venue}>
        <StyledFieldValueText variant="bodyLg">{audit.venue ?? ""}</StyledFieldValueText>
      </DetailField>
    </Box>
  );
}

function ClassAuditTrail({ audit, labels }: ClassAuditDetailsCardProps) {
  const locale = useAppLocale();
  const hasRemark = (audit.auditRemark ?? "").trim() !== "";
  return (
    <StyledAuditTrailSection>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <StyledAuditTrailIcon />
        <StyledSectionTitle variant="titleLg">{labels.auditTrailTitle}</StyledSectionTitle>
      </Box>
      {hasRemark ? (
        <StyledRemarkQuoteBlock>
          <StyledRemarkItalicText variant="bodyMd">&ldquo;{audit.auditRemark}&rdquo;</StyledRemarkItalicText>
          <StyledRemarkMetaRow>
            <UpdateOutlined sx={{ fontSize: 14 }} />
            <Typography variant="labelMd">{formatAuditTimestamp(audit.auditLoggedAt, locale)}</Typography>
          </StyledRemarkMetaRow>
        </StyledRemarkQuoteBlock>
      ) : (
        <StyledNoEventsText variant="bodyMd">{labels.auditTrailEmpty}</StyledNoEventsText>
      )}
    </StyledAuditTrailSection>
  );
}

/** Bridges the locale status labels (literal keys) onto the generated enum keys the status chip consumes. */
function buildStatusLabels(status: PayrollLabels["status"]): Record<CalculationStatus, string> {
  return {
    [CalculationStatus.NotCalculated]: status.NOT_CALCULATED,
    [CalculationStatus.Calculated]: status.CALCULATED,
    [CalculationStatus.Partially]: status.PARTIALLY,
    [CalculationStatus.Refund]: status.REFUND,
    [CalculationStatus.WaitingPaid]: status.WAITING_PAID,
    [CalculationStatus.Paid]: status.PAID,
  };
}

/** Keeps the override history oldest-first whatever order the events query returns. */
function selectOverrideEvents(
  events: readonly ClassStatusEventsQuery_classStatusEvents[]
): ClassStatusEventsQuery_classStatusEvents[] {
  return events
    .filter(event => event.eventType === PAYROLL_OVERRIDE_EVENT_TYPE)
    .toSorted((first, second) => (first.createdAt ?? "").localeCompare(second.createdAt ?? ""));
}

function formatPaidAmount(amount: string | null, currency: CurrencyCode | null): string {
  if (amount === null) return "—";
  return currency === null ? amount : `${amount} ${currency}`;
}

interface ClassAuditPayrollCardProps {
  readonly payroll: ClassAuditPayrollSnapshot;
  readonly statusEvents: readonly ClassStatusEventsQuery_classStatusEvents[] | null;
  readonly onOverride: (() => void) | undefined;
}

function ClassAuditPayrollCard({ payroll, statusEvents, onOverride }: Readonly<ClassAuditPayrollCardProps>) {
  const locale = useAppLocale();
  const payrollLabels = useAppTranslation(DashboardBillingPayroll);
  const hasPermission = useUserStore(state => state.hasPermission);
  const canOverride = onOverride !== undefined && hasPermission(AppPermission.AccountingPayrollManage);
  const overrideEvents = useMemo(() => selectOverrideEvents(statusEvents ?? []), [statusEvents]);
  const statusLabels = useMemo(() => buildStatusLabels(payrollLabels.status), [payrollLabels.status]);

  return (
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
              <CalculationStatusChip status={payroll.calculationStatus} labels={statusLabels} />
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
  );
}
