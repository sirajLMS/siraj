"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/common/components/ui";
import type { StudentCreditRow, StudentCreditStatus } from "@/frontend/views/dashboard/billing/types/billingViewTypes";

interface StudentCreditCardListLabels {
  readonly classesLeft: string;
  readonly sendReminder: string;
  readonly creditStatusLabels: Record<StudentCreditStatus, string>;
}

interface StudentCreditCardListProps {
  readonly rows: readonly StudentCreditRow[];
  readonly labels: StudentCreditCardListLabels;
  readonly canManage: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly onSendReminder: (id: string) => void;
  readonly loading?: boolean;
  readonly sendingReminderId?: string | null;
}

function formatClassesLeft(row: StudentCreditRow): string {
  return `${row.classesLeft} / ${row.classesTotal}`;
}

// Credit card with outline border and surface background for student credit info
const StyledCreditCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
}));

// Student name styled with primary color and bold weight for emphasis
const StyledStudentNameTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

// Plan type text styled with secondary color for subdued appearance
const StyledPlanTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export function StudentCreditCardList({
  rows,
  labels,
  canManage,
  billingActionsDisabled = false,
  onSendReminder,
  loading = false,
  sendingReminderId = null,
}: Readonly<StudentCreditCardListProps>) {
  if (loading && rows.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map(row => {
        const isNegative = row.status === "negative_balance";

        return (
          <StyledCreditCard key={row.id} elevation={0}>
            <StyledStudentNameTypography variant="titleLg" sx={{ mb: 0.5 }}>
              {row.studentName}
            </StyledStudentNameTypography>
            <Typography variant="bodyMd" sx={{ mb: 1 }}>
              {row.parentEmail}
            </Typography>
            <StyledPlanTypography variant="labelMd" sx={{ mb: 1.5 }}>
              {row.planType}
            </StyledPlanTypography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: isNegative && canManage && !billingActionsDisabled ? 1.5 : 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <StatusBadge
                  category="invoice"
                  status={isNegative ? "OVERDUE" : "PAID"}
                  label={formatClassesLeft(row)}
                />
                {isNegative && (
                  <WarningAmberOutlined sx={theme => ({ fontSize: 16, color: theme.palette.error.main })} />
                )}
              </Box>
              <Typography
                variant="bodyMd"
                sx={theme => ({
                  fontWeight: isNegative ? 700 : 500,
                  color: isNegative ? theme.palette.error.main : theme.palette.onSecondaryContainer,
                })}
              >
                {labels.creditStatusLabels[row.status]}
              </Typography>
            </Box>
            {isNegative && canManage && !billingActionsDisabled && (
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  onSendReminder(row.id);
                }}
                disabled={sendingReminderId === row.id}
              >
                {sendingReminderId === row.id ? <CircularProgress size={18} color="inherit" /> : labels.sendReminder}
              </Button>
            )}
          </StyledCreditCard>
        );
      })}
    </Box>
  );
}
