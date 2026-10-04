import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
} from "@mui/material";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import type {
  TeacherGroup,
  TotalsSummary,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/CarryoverBulkCreateDialog.helpers";
import {
  type BreakdownCellLabels,
  type BreakdownColumnLabels,
  BreakdownTable,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/CarryoverBulkCreateDialog.table";

export interface CarryoverDialogPanelProps {
  readonly open: boolean;
  readonly submitting: boolean;
  readonly canSubmit: boolean;
  readonly rejectionMessage: string | null;
  readonly title: string;
  readonly closeAriaLabel: string;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
  readonly intro: string;
  readonly groupedSummary: string;
  readonly consequence: string;
  readonly locale: string;
  readonly teacherGroups: readonly TeacherGroup[];
  readonly totals: TotalsSummary;
  readonly cellLabels: BreakdownCellLabels;
  readonly columnLabels: BreakdownColumnLabels;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
}

/** Dialog chrome, breakdown body and submit/cancel actions for the bulk carryover creation. */
export function CarryoverDialogPanel({
  open,
  submitting,
  canSubmit,
  rejectionMessage,
  title,
  closeAriaLabel,
  cancelLabel,
  confirmLabel,
  intro,
  groupedSummary,
  consequence,
  locale,
  teacherGroups,
  totals,
  cellLabels,
  columnLabels,
  onClose,
  onSubmit,
}: Readonly<CarryoverDialogPanelProps>) {
  return (
    <Dialog {...DialogPresets.info} open={open} onClose={submitting ? undefined : onClose}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
        {title}
        <IconButton aria-label={closeAriaLabel} onClick={onClose} disabled={submitting} size="small">
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 2, pt: 1 }}>
          {rejectionMessage !== null ? <Alert severity="error">{rejectionMessage}</Alert> : null}
          <Alert severity="info" icon={<InfoOutlinedIcon fontSize="small" />}>
            {intro}
          </Alert>
          <Box component="p" sx={{ typography: "bodyMd", m: 0 }}>
            {groupedSummary}
          </Box>
          <BreakdownTable
            groups={teacherGroups}
            totals={totals}
            locale={locale}
            cellLabels={cellLabels}
            columnLabels={columnLabels}
          />
          <Alert severity="warning">{consequence}</Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="text"
          onClick={onClose}
          disabled={submitting}
          sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700, borderRadius: 1.5 })}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitting || !canSubmit}
          aria-busy={submitting}
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        >
          {submitting ? <CircularProgress size={20} color="inherit" /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
