import { Box, Typography } from "@mui/material";
import type { QuotaFormFieldProps } from "@/frontend/views/dashboard/students/quota/types";

export function QuotaFormField({ label, children, extraLabel, helperText }: QuotaFormFieldProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Typography
          variant="labelMd"
          sx={theme => ({
            color: theme.palette.onSurfaceVariant,
            textTransform: { md: "uppercase" },
            ml: { xs: 0.5, md: 0 },
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
