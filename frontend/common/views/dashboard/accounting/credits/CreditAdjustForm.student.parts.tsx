"use client";

import { Alert, Box, Chip, Stack, Typography } from "@mui/material";
import { BaseAvatar } from "@/frontend/common/components/ui/avatar";
import { StudentAutocomplete } from "@/frontend/common/components/ui/input/userSelect/StudentAutocomplete";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import type { StudentByIdQuery_studentById } from "@/frontend/common/graphql/generated/gql/graphql";
import type { BalancePreview } from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.types";

interface SelectedStudentCardProps {
  readonly row: StudentByIdQuery_studentById;
  /** Caption prefixing the `remaining / total` balance chip. */
  readonly balanceLabel: string;
}

/**
 * Read-only live-context card for the selected student. The picker input
 * cannot echo a programmatic value, so the resolved record (name, teacher,
 * current balance) is surfaced here while the search field above stays
 * available to swap the student.
 */
function SelectedStudentCard({ row, balanceLabel }: SelectedStudentCardProps) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.5,
        mt: -1.5,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: theme.palette.outlineVariant,
        borderRadius: 2,
        backgroundColor: theme.palette.surface,
      })}
    >
      <BaseAvatar label={row.name ?? ""} src={row.avatarUrl ?? undefined} size={40} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 14,
            // Long names must yield before the balance caption, not collide
            // with it: the nowrap ellipsis trades full text for a guaranteed
            // gap at narrow widths.
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.name}
        </Typography>
        {row.teacherName ? (
          <Typography
            sx={theme => ({ fontSize: theme.typography.caption.fontSize, color: theme.palette.text.secondary })}
          >
            {row.teacherName}
          </Typography>
        ) : null}
      </Box>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexShrink: 0 }}>
        <Typography
          sx={theme => ({
            typography: "labelUppercase",
            fontSize: theme.typography.labelSm.fontSize,
            color: theme.palette.text.secondary,
          })}
        >
          {balanceLabel}
        </Typography>
        <Chip size="small" label={`${row.classesRemaining ?? "—"} / ${row.classesTotal ?? "—"}`} />
      </Stack>
    </Box>
  );
}

interface CreditAdjustStudentSectionProps {
  readonly displayedStudent: PersonOption | null;
  readonly onStudentChange: (next: PersonOption | null) => void;
  readonly studentError: string | undefined;
  readonly submitting: boolean;
  readonly studentSummary: StudentByIdQuery_studentById | null;
  readonly balancePreview: BalancePreview | null;
  readonly balanceLabel: string;
  readonly previewBalance: (from: number, to: number) => string;
}

export function CreditAdjustStudentSection({
  displayedStudent,
  onStudentChange,
  studentError,
  submitting,
  studentSummary,
  balancePreview,
  balanceLabel,
  previewBalance,
}: CreditAdjustStudentSectionProps) {
  return (
    <>
      <StudentAutocomplete
        value={displayedStudent}
        onChange={onStudentChange}
        error={studentError !== undefined}
        helperText={studentError}
        disabled={submitting}
        required
        fullWidth
      />
      {studentSummary !== null ? <SelectedStudentCard row={studentSummary} balanceLabel={balanceLabel} /> : null}
      {balancePreview !== null ? (
        // A negative outcome is what the server would reject with
        // INSUFFICIENT_CLASSES — flag it with the error tone up front.
        <Alert severity={balancePreview.to < 0 ? "error" : "info"}>
          {previewBalance(balancePreview.from, balancePreview.to)}
        </Alert>
      ) : null}
    </>
  );
}
