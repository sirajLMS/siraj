"use client";

import { useQuery } from "@apollo/client/react";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Alert, Box, Button, CircularProgress, Drawer, IconButton, Stack, Typography, useTheme } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useState } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import { StatusBadge } from "@/frontend/common/components/ui";
import { LabeledField } from "@/frontend/common/components/ui/display/labeledField";
import { PersonProfileLink } from "@/frontend/common/components/ui/display/personProfileLink";
import type {
  CalculationStatus,
  CarryoverBalanceLinkedSessionsQuery_carryoverBalanceLinkedSessions,
  CarryoverBalanceQuery_carryoverBalance,
  CurrencyCode,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  carryoverBalanceLinkedSessionsQueryDocument,
  carryoverBalanceQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { UnpayCarryoverDialog } from "@/frontend/common/views/dashboard/accounting/carryover/UnpayCarryoverDialog";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { useAppLocale } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover, DashboardBillingPayroll, Translation } from "@/shared/locale/namespaces";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

type CarryoverDetail = CarryoverBalanceQuery_carryoverBalance;

const PAPER_SX = { width: { xs: "100%", sm: 460 }, maxWidth: "100%" } as const;

const SUMMARY_GRID_SX = {
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;

const FULL_WIDTH_SX = { gridColumn: "1 / -1" } as const;

const fieldLabelSx = (theme: Theme) => ({ color: theme.palette.onSurfaceVariant });

const HEADER_SX = (theme: Theme) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 1,
  px: 2.5,
  py: 2,
  borderBottom: `1px solid ${theme.palette.divider}`,
});

const FOOTER_SX = (theme: Theme) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: 1,
  px: 2.5,
  py: 2,
  borderTop: `1px solid ${theme.palette.divider}`,
});

const MINUTES_PER_HOUR = 60;

const SESSIONS_TABLE_SX = (theme: Theme) => ({
  width: "100%",
  borderCollapse: "collapse",
  "& th": {
    pb: 1,
    pe: 1.5,
    textAlign: "start",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  "& td": {
    py: 1,
    pe: 1.5,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  "& th:last-child, & td:last-child": { pe: 0 },
  "& tr:last-child td": { borderBottom: "none" },
});

/** Session duration cell: minutes converted to locale-formatted hours, mirroring the billable-hours convention of the summary duration field. */
function formatSessionHours(minutes: number | null, locale: string, notSet: string): string {
  if (minutes === null || !Number.isFinite(minutes)) {
    return notSet;
  }
  return new Intl.NumberFormat(getLatnLocaleTag(locale), { maximumFractionDigits: 2 }).format(
    minutes / MINUTES_PER_HOUR
  );
}

/** Link-time snapshot amount paired with its snapshot currency; the pair is null-safe together. */
function formatSessionAmount(
  amount: string | null,
  currency: CurrencyCode | null,
  locale: string,
  notSet: string
): string {
  if (amount === null || currency === null) {
    return notSet;
  }
  return formatLockedAmount(amount, currency, locale);
}

/** Separator set for the free-text student roster: Latin and Arabic comma/semicolon. */
const STUDENTS_TEXT_SEPARATOR = /[,;،؛]/;

/**
 * Stored count wins when present; manual rows sometimes carry only the
 * free-text roster (comma- or semicolon-separated, Latin or Arabic marks), so
 * the count is derived from it before falling back to the not-set label.
 */
function resolveStudentsCount(value: number | null, studentsText: string | null, notSet: string): string {
  if (value !== null) {
    return String(value);
  }
  const text = studentsText?.trim() ?? "";
  if (text === "") {
    return notSet;
  }
  return String(text.split(STUDENTS_TEXT_SEPARATOR).filter(name => name.trim() !== "").length);
}

export interface CarryoverDetailDrawerProps {
  /** Carryover balance id to drill into; the detail query only runs while open. */
  readonly carryoverId: string;
  /** Whether the drawer is visible. */
  readonly open: boolean;
  /** Close request raised by the close button, Escape, or backdrop click. */
  readonly onClose: () => void;
}

interface DrawerHeaderProps {
  readonly balance: CarryoverDetail | null;
  readonly title: string;
  readonly labels: CarryoverLabels;
  readonly closeLabel: string;
  readonly onClose: () => void;
}

function DrawerHeader({ balance, title, labels, closeLabel, onClose }: Readonly<DrawerHeaderProps>) {
  const paid = balance?.isPaid ?? false;
  return (
    <Box sx={HEADER_SX}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {balance ? (
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            <StatusBadge
              category="session"
              status={paid ? "active" : "pending"}
              label={paid ? labels.chip.paid : labels.chip.unpaid}
            />
            {balance.isDisabledTeacher ? (
              <StatusBadge
                category="staffAccount"
                status="deactivated"
                label={labels.chip.disabledTeacher}
                icon={<BlockOutlinedIcon fontSize="small" />}
              />
            ) : null}
          </Stack>
        ) : null}
      </Box>
      <IconButton aria-label={closeLabel} onClick={onClose} size="small">
        <CloseOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

/** Teacher identity cell: profile-linked name with the snapshot avatar. */
function TeacherCell({ balance }: { readonly balance: CarryoverDetail }) {
  return (
    <PersonProfileLink
      name={balance.teacherName ?? ""}
      href={profileHrefForTeacher({ teacherId: balance.teacherId })}
      avatarUrl={balance.teacherAvatarUrl}
      avatarSize={32}
    />
  );
}

function PayableValue({ balance, notSet }: { readonly balance: CarryoverDetail; readonly notSet: string }) {
  const locale = useAppLocale();
  if (balance.payable === null || balance.teacherCurrency === null) {
    return <>{notSet}</>;
  }
  return (
    <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
      {formatLockedAmount(balance.payable, balance.teacherCurrency, locale)}
    </Typography>
  );
}

function BalanceSummary({
  balance,
  labels,
  commonLabels,
}: {
  readonly balance: CarryoverDetail;
  readonly labels: CarryoverLabels;
  readonly commonLabels: CommonLabels;
}) {
  const notSet = commonLabels.notSet;
  return (
    <Box sx={SUMMARY_GRID_SX}>
      <LabeledField label={labels.column.teacher} value={<TeacherCell balance={balance} />} />
      <LabeledField label={labels.modal.form.currency} value={balance.teacherCurrency ?? notSet} />
      <LabeledField
        label={labels.column.studentsCount}
        value={resolveStudentsCount(balance.studentsCount, balance.studentsText, notSet)}
      />
      <LabeledField label={labels.column.totalDuration} value={balance.totalDuration ?? notSet} />
      <LabeledField label={labels.column.fromDate} value={balance.fromDate ?? notSet} />
      <LabeledField label={labels.column.toDate} value={balance.toDate ?? notSet} />
      <LabeledField label={labels.column.paymentDate} value={balance.paymentDate ?? notSet} />
      <LabeledField label={labels.column.payable} value={<PayableValue balance={balance} notSet={notSet} />} />
      <LabeledField label={labels.column.studentsText} value={balance.studentsText ?? notSet} />
      <Box sx={FULL_WIDTH_SX}>
        <LabeledField label={labels.modal.form.note} value={balance.note ?? notSet} />
      </Box>
    </Box>
  );
}

type LinkedSession = CarryoverBalanceLinkedSessionsQuery_carryoverBalanceLinkedSessions;

function LinkedSessionRow({
  session,
  locale,
  notSet,
  statusLabels,
}: {
  readonly session: LinkedSession;
  readonly locale: string;
  readonly notSet: string;
  readonly statusLabels: Record<CalculationStatus, string>;
}) {
  return (
    <Box component="tr">
      <Box component="td">
        <Typography variant="bodyMd">
          {session.scheduledStartAt === null ? notSet : formatDate(session.scheduledStartAt, locale, notSet)}
        </Typography>
      </Box>
      <Box component="td">
        <Typography variant="bodyMd">{session.studentName ?? notSet}</Typography>
      </Box>
      <Box component="td">
        <Typography variant="bodyMd">{session.subjectName ?? notSet}</Typography>
      </Box>
      <Box component="td">
        <Typography variant="bodyMd">{formatSessionHours(session.durationMinutes, locale, notSet)}</Typography>
      </Box>
      <Box component="td">
        <Typography variant="bodyMd">
          {formatSessionAmount(session.originalAmount, session.originalCurrency, locale, notSet)}
        </Typography>
      </Box>
      <Box component="td">
        {session.currentStatus === null ? (
          <Typography variant="bodyMd">{notSet}</Typography>
        ) : (
          <StatusBadge
            category="payrollCalculation"
            status={session.currentStatus}
            label={statusLabels[session.currentStatus]}
          />
        )}
      </Box>
    </Box>
  );
}

function LinkedSessionsTable({
  sessions,
  locale,
  notSet,
  labels,
  statusLabels,
}: {
  readonly sessions: readonly LinkedSession[];
  readonly locale: string;
  readonly notSet: string;
  readonly labels: CarryoverLabels;
  readonly statusLabels: Record<CalculationStatus, string>;
}) {
  const headers = [
    labels.drawer.sessionDate,
    labels.drawer.student,
    labels.drawer.subject,
    labels.drawer.duration,
    labels.drawer.amount,
    labels.drawer.status,
  ];
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box component="table" sx={SESSIONS_TABLE_SX}>
        <Box component="thead">
          <Box component="tr">
            {headers.map(header => (
              <Box component="th" scope="col" key={header}>
                <Typography variant="labelUppercase" sx={fieldLabelSx}>
                  {header}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {sessions.map((session, index) => (
            <LinkedSessionRow
              key={session.id ?? index}
              session={session}
              locale={locale}
              notSet={notSet}
              statusLabels={statusLabels}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function LinkedSessionsBody({
  sessions,
  loading,
  hasError,
  locale,
  labels,
  commonLabels,
  statusLabels,
}: {
  readonly sessions: readonly LinkedSession[] | null;
  readonly loading: boolean;
  readonly hasError: boolean;
  readonly locale: string;
  readonly labels: CarryoverLabels;
  readonly commonLabels: CommonLabels;
  readonly statusLabels: Record<CalculationStatus, string>;
}) {
  if (loading && sessions === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-label={commonLabels.loading}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (hasError) {
    return <Alert severity="error">{labels.loadError}</Alert>;
  }
  if (sessions === null || sessions.length === 0) {
    return (
      <Typography variant="bodyMd" sx={fieldLabelSx}>
        {labels.drawer.noSessions}
      </Typography>
    );
  }
  return (
    <LinkedSessionsTable
      sessions={sessions}
      locale={locale}
      notSet={commonLabels.notSet}
      labels={labels}
      statusLabels={statusLabels}
    />
  );
}

/**
 * Linked-session list for the balance: an independent fetch gated by the
 * drawer's open state, with loading / error / empty / populated states. The
 * heading count prefers the fetched rows and falls back to the balance
 * record's snapshot count while rows load.
 */
function LinkedSessionsSection({
  carryoverId,
  open,
  linkedSessionCount,
  labels,
  commonLabels,
  statusLabels,
}: {
  readonly carryoverId: string;
  readonly open: boolean;
  /** Snapshot count from the balance record; keeps the heading stable while rows load. */
  readonly linkedSessionCount: number | null;
  readonly labels: CarryoverLabels;
  readonly commonLabels: CommonLabels;
  readonly statusLabels: Record<CalculationStatus, string>;
}) {
  const locale = useAppLocale();
  const { data, loading, error } = useQuery(carryoverBalanceLinkedSessionsQueryDocument, {
    variables: { carryoverId },
    skip: !open,
  });
  const sessions = data?.carryoverBalanceLinkedSessions ?? null;
  const heading = labels.drawer.sessionsHeading(sessions?.length ?? linkedSessionCount ?? 0);
  return (
    <Box sx={{ mt: 4 }} aria-label={heading}>
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {heading}
      </Typography>
      <Box sx={{ mt: 1.5 }}>
        <LinkedSessionsBody
          sessions={sessions}
          loading={loading}
          hasError={Boolean(error)}
          locale={locale}
          labels={labels}
          commonLabels={commonLabels}
          statusLabels={statusLabels}
        />
      </Box>
    </Box>
  );
}

function DrawerBody({
  balance,
  loading,
  hasError,
  labels,
  commonLabels,
}: {
  readonly balance: CarryoverDetail | null;
  readonly loading: boolean;
  readonly hasError: boolean;
  readonly labels: CarryoverLabels;
  readonly commonLabels: CommonLabels;
}) {
  if (loading && !balance) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }} aria-label={commonLabels.loading}>
        <CircularProgress size={32} />
      </Box>
    );
  }
  if (hasError) {
    return <Alert severity="error">{labels.loadError}</Alert>;
  }
  if (!balance) {
    return null;
  }
  return <BalanceSummary balance={balance} labels={labels} commonLabels={commonLabels} />;
}

/**
 * Right-side drill-down for a single carryover balance: the full record fields,
 * its paid/disabled chips, and the linked sessions table with per-session
 * snapshot amounts and current calculation statuses, all fetched on open.
 * Paid balances expose a pinned footer with the same unpay confirm flow the
 * list row menu uses.
 */
export function CarryoverDetailDrawer({ carryoverId, open, onClose }: Readonly<CarryoverDetailDrawerProps>) {
  const theme = useTheme();
  const labels = useAppTranslation(DashboardAccountingCarryover);
  const payrollLabels = useAppTranslation(DashboardBillingPayroll);
  const commonLabels = useAppTranslation(Translation.Common);
  const statusLabels: Record<CalculationStatus, string> = payrollLabels.status;
  const { data, loading, error, refetch } = useQuery(carryoverBalanceQueryDocument, {
    variables: { id: carryoverId },
    fetchPolicy: "cache-and-network",
    skip: !open,
  });
  const balance = data?.carryoverBalance ?? null;
  // Until the detail resolves there is no name to interpolate, so fall back to
  // the generic page title instead of the template's trailing empty slot.
  const teacherName = balance?.teacherName ?? "";
  const title = teacherName === "" ? labels.title : labels.drawer.title(teacherName);
  const [unpayOpen, setUnpayOpen] = useState(false);
  const canUnpay = balance !== null && (balance.isPaid ?? false);
  const handleUnpayDone = () => {
    void refetch();
  };

  return (
    <Drawer
      anchor={theme.direction === "rtl" ? "left" : "right"}
      open={open}
      onClose={onClose}
      aria-label={title}
      slotProps={{ paper: { sx: PAPER_SX } }}
      sx={drawerTheme => ({ zIndex: drawerTheme.zIndex.drawer + 2 })}
    >
      <DrawerHeader
        balance={balance}
        title={title}
        labels={labels}
        closeLabel={commonLabels.ariaClose}
        onClose={onClose}
      />
      <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 3 }}>
        <DrawerBody
          balance={balance}
          loading={loading}
          hasError={Boolean(error)}
          labels={labels}
          commonLabels={commonLabels}
        />
        {balance !== null ? (
          <LinkedSessionsSection
            carryoverId={carryoverId}
            open={open}
            linkedSessionCount={balance.linkedSessionCount}
            labels={labels}
            commonLabels={commonLabels}
            statusLabels={statusLabels}
          />
        ) : null}
      </Box>
      {canUnpay ? (
        <>
          <Box sx={FOOTER_SX}>
            <Button variant="outlined" color="error" onClick={() => setUnpayOpen(true)}>
              {labels.action.unpay}
            </Button>
          </Box>
          <UnpayCarryoverDialog
            open={unpayOpen}
            row={balance}
            onClose={() => setUnpayOpen(false)}
            onDone={handleUnpayDone}
          />
        </>
      ) : null}
    </Drawer>
  );
}
