"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import type { StudentCreditTransactionRow } from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import type { StudentCreditsViewModel } from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";

interface MobileTransactionItemProps {
  readonly row: StudentCreditTransactionRow;
  readonly locale: StudentCreditsViewModel["locale"];
  readonly reasonLabel: StudentCreditsViewModel["reasonLabel"];
}

export function MobileTransactionItem({ row, locale, reasonLabel }: MobileTransactionItemProps): ReactNode {
  const positive = row.changeAmount >= 0;
  const sign = positive ? "+" : "-";

  return (
    <MobileCardListItem variant="edge-to-edge">
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="bodyMd" sx={theme => ({ fontWeight: 600, color: theme.palette.onSurface })}>
            {reasonLabel(row.reason)}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {row.createdAt ? formatDate(row.createdAt, locale) : "—"}
          </Typography>
        </Box>
        <Typography
          variant="bodyMd"
          sx={theme => ({
            fontWeight: 700,
            whiteSpace: "nowrap",
            flexShrink: 0,
            color: positive ? theme.palette.success.main : theme.palette.error.main,
          })}
        >
          {sign}
          {row.isHours ? (
            <>
              {Math.abs(row.changeAmount).toFixed(2)}
              <Box component="span" sx={theme => ({ fontSize: "0.75em", color: theme.palette.onSurfaceVariant })}>
                {" h"}
              </Box>
            </>
          ) : (
            Math.abs(row.changeAmount)
          )}
        </Typography>
      </Stack>
      {row.notes ? (
        <Typography variant="labelMd" sx={theme => ({ mt: 1, color: theme.palette.onSurfaceVariant })}>
          {row.notes}
        </Typography>
      ) : null}
    </MobileCardListItem>
  );
}
