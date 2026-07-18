"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { StudentCreditCardListMobileProps } from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { formatClassesLeft } from "@/frontend/common/views/dashboard/billing/utils/parentInvoiceFormatters";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";

const StyledCreditCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
}));

const StyledStudentNameTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

const StyledPlanTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export function StudentCreditCardListMobile({
  rows,
  labels,
  canManage,
  billingActionsDisabled = false,
  onSendReminder,
  loading = false,
  sendingReminderId = null,
}: Readonly<StudentCreditCardListMobileProps>) {
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
                <MobileStatusBadge
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
