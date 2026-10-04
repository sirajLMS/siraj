import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { StudentCreditRow } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import { formatClassesLeft } from "@/frontend/common/views/dashboard/billing/utils/parentInvoiceFormatters";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";

const StyledWarningIcon = styled(WarningAmberOutlined)(({ theme }) => ({
  fontSize: theme.typography.bodyLg.fontSize,
  color: theme.palette.warning.main,
}));

interface StudentCreditClassesLeftCellProps {
  readonly row: StudentCreditRow;
}

export function StudentCreditClassesLeftCell({ row }: Readonly<StudentCreditClassesLeftCellProps>) {
  const isNegative = row.status === "negative_balance";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: "100%" }}>
      <Typography
        variant="bodyMd"
        sx={theme => ({
          fontWeight: isNegative ? 700 : 500,
          color: isNegative ? theme.palette.warning.main : theme.palette.text.primary,
        })}
      >
        {formatClassesLeft(row)}
      </Typography>
      {isNegative && <StyledWarningIcon />}
    </Box>
  );
}

interface StudentCreditQuickActionCellProps {
  readonly row: StudentCreditRow;
  readonly sendReminderLabel: string;
  readonly enabled: boolean;
  readonly isSending: boolean;
  readonly onSendReminder: (id: string) => void;
}

export function StudentCreditQuickActionCell({
  row,
  sendReminderLabel,
  enabled,
  isSending,
  onSendReminder,
}: Readonly<StudentCreditQuickActionCellProps>) {
  if (!enabled || row.status !== "negative_balance") {
    return null;
  }
  return (
    <DesktopPrimaryPageAction
      size="small"
      onClick={() => {
        onSendReminder(row.id);
      }}
      disabled={isSending}
    >
      {isSending ? <CircularProgress size={18} color="inherit" /> : sendReminderLabel}
    </DesktopPrimaryPageAction>
  );
}
