"use client";

import { Box, Typography } from "@mui/material";
import type { QuotaFormFieldProps } from "@/frontend/common/views/dashboard/students/quota/types";

export function QuotaFormFieldMobile({ label, children, extraLabel, helperText }: Readonly<QuotaFormFieldProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Typography
          variant="labelMd"
          sx={theme => ({
            color: theme.palette.onSurfaceVariant,
            ml: 0.5,
          })}
        >
          {label}
        </Typography>
        {extraLabel}
      </Box>
      {children}
      {helperText}
    </Box>
  );
}
