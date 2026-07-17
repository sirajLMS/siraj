"use client";

import { Box, Typography } from "@mui/material";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";

interface StudentMobileMetricsScrollProps {
  readonly metrics: readonly MetricItem[];
}

export function StudentMobileMetricsScroll({ metrics }: Readonly<StudentMobileMetricsScrollProps>) {
  return (
    <Box sx={{ mx: -2, mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          overflowX: "auto",
          px: 2,
          pb: 1,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {metrics.map(metric => {
          const MetricIcon = metric.icon;
          const isError = metric.key === "suspended";

          return (
            <Box
              key={metric.key}
              sx={theme => ({
                flexShrink: 0,
                minWidth: 140,
                px: 2.5,
                py: 1.5,
                borderRadius: 10,
                border: `1px solid ${theme.palette.border.light}`,
                backgroundColor: theme.palette.background.paper,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                boxShadow: theme.palette.shadow.card,
              })}
            >
              <Box
                sx={theme => ({
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${isError ? theme.palette.error.main : theme.palette.header}`,
                  color: isError ? theme.palette.error.main : theme.palette.header,
                })}
              >
                <MetricIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography
                  sx={theme => ({
                    fontFamily: theme.typography.titleLg.fontFamily,
                    fontSize: theme.typography.titleLg.fontSize,
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    lineHeight: 1,
                  })}
                >
                  {typeof metric.count === "number" ? String(metric.count) : metric.count}
                </Typography>
                <Typography
                  sx={theme => ({
                    fontFamily: theme.typography.caption.fontFamily,
                    fontSize: theme.typography.labelSm.fontSize,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: theme.palette.text.secondary,
                  })}
                >
                  {metric.label ?? metric.labelKey}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
