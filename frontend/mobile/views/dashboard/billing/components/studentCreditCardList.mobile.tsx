"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import type { StudentCreditCardListMobileProps } from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { formatClassesLeft } from "@/frontend/common/views/dashboard/billing/utils/parentInvoiceFormatters";
import { MobileCardList, MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";

export function StudentCreditCardListMobile({
  rows,
  labels,
  canManage,
  billingActionsDisabled = false,
  onSendReminder,
  loading = false,
  sendingReminderId = null,
}: Readonly<StudentCreditCardListMobileProps>) {
  return (
    <MobileCardList
      rows={rows}
      loading={loading}
      getKey={row => row.id}
      paginationOptions={{ mode: "client" }}
      layout="edge-to-edge"
      renderItem={row => {
        const isNegative = row.status === "negative_balance";
        return (
          <MobileCardListItem variant="edge-to-edge">
            <Typography
              variant="titleLg"
              sx={theme => ({ mb: 0.5, fontWeight: 700, color: theme.palette.primary.main })}
            >
              {row.studentName}
            </Typography>
            <Typography variant="bodyMd" sx={{ mb: 1 }}>
              {row.parentEmail}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ mb: 1.5, color: theme.palette.text.secondary })}>
              {row.planType}
            </Typography>
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
                {isNegative ? (
                  <WarningAmberOutlined sx={theme => ({ fontSize: 16, color: theme.palette.error.main })} />
                ) : null}
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
            {isNegative && canManage && !billingActionsDisabled ? (
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
            ) : null}
          </MobileCardListItem>
        );
      }}
    />
  );
}
