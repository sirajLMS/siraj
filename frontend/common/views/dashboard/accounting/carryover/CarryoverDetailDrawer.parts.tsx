"use client";

import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { LabeledField } from "@/frontend/common/components/ui/display/labeledField";
import { PersonProfileLink } from "@/frontend/common/components/ui/display/personProfileLink";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { DetailDrawerState } from "@/frontend/common/views/dashboard/accounting/__shared__";
import {
  FULL_WIDTH_SX,
  HEADER_SX,
  SUMMARY_GRID_SX,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.constants";
import {
  type CarryoverDetail,
  resolveStudentsCount,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.helpers";
import { useAppLocale } from "@/shared/locale";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

interface DrawerHeaderProps {
  readonly balance: CarryoverDetail | null;
  readonly title: string;
  readonly labels: CarryoverLabels;
  readonly closeLabel: string;
  readonly onClose: () => void;
}

export function DrawerHeader({ balance, title, labels, closeLabel, onClose }: Readonly<DrawerHeaderProps>) {
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

export function DrawerBody({
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
  return (
    <DetailDrawerState
      loading={loading}
      hasError={hasError}
      hasData={balance !== null}
      loadError={labels.loadError}
      loadingLabel={commonLabels.loading}
    >
      {balance ? <BalanceSummary balance={balance} labels={labels} commonLabels={commonLabels} /> : null}
    </DetailDrawerState>
  );
}
