"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import type { StudentCreditRow, StudentCreditStatus } from "@/frontend/stores/mockAdminBillingStore";

interface StudentCreditCardListLabels {
  readonly classesLeft: string;
  readonly sendReminder: string;
  readonly creditStatusLabels: Record<StudentCreditStatus, string>;
}

interface StudentCreditCardListProps {
  readonly rows: readonly StudentCreditRow[];
  readonly labels: StudentCreditCardListLabels;
  readonly canManage: boolean;
  readonly onSendReminder: (id: string) => void;
}

function formatClassesLeft(row: StudentCreditRow): string {
  return `${row.classesLeft} / ${row.classesTotal}`;
}

export function StudentCreditCardList({
  rows,
  labels,
  canManage,
  onSendReminder,
}: Readonly<StudentCreditCardListProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map(row => {
        const isNegative = row.status === "negative_balance";

        return (
          <Paper
            key={row.id}
            elevation={0}
            sx={theme => ({
              p: 2,
              borderRadius: theme.layout.radius.card,
              border: `1px solid ${theme.palette.outlineVariant}`,
              bgcolor: theme.palette.surfaceContainerLowest,
            })}
          >
            <Typography
              variant="titleLg"
              sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 })}
            >
              {row.studentName}
            </Typography>
            <Typography variant="bodyMd" sx={{ mb: 1 }}>
              {row.parentEmail}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, mb: 1.5 })}>
              {row.planType}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: isNegative && canManage ? 1.5 : 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={formatClassesLeft(row)}
                  size="small"
                  sx={theme => ({
                    fontWeight: 700,
                    bgcolor: isNegative ? theme.palette.errorContainer : theme.palette.secondaryContainer,
                    color: isNegative ? theme.palette.error.main : theme.palette.onSecondaryContainer,
                  })}
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
            {isNegative && canManage && (
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  onSendReminder(row.id);
                }}
              >
                {labels.sendReminder}
              </Button>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}
