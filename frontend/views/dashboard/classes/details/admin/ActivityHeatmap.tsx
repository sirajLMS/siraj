"use client";

import { Box, Divider, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { BaseCard } from "@/frontend/components/ui";

interface ActivityHeatmapProps {
  readonly data: readonly number[];
  readonly labels: {
    readonly activityHeatmap: string;
    readonly studentInput: string;
    readonly teacherResponse: string;
  };
}

interface Bar {
  id: string;
  height: number;
}

export function ActivityHeatmap({ data, labels }: ActivityHeatmapProps) {
  const [bars, setBars] = useState<Bar[]>(() => data.map((h, i) => ({ id: `bar-${i}`, height: h })));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setBars(prev => {
        const next = [...prev];
        const [r1, r2] = crypto.getRandomValues(new Uint8Array(2));
        const idx = r1 % next.length;
        next[idx] = { ...next[idx], height: (r2 % 80) + 10 };
        return next;
      });
    }, 1500);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <BaseCard sx={{ p: 0, overflow: "hidden", mt: 3 }}>
      <Stack
        direction="row"
        sx={theme => ({
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2.5,
          borderBottom: 1,
          borderColor: theme.palette.border.light,
          bgcolor: theme.palette.background.paper,
        })}
      >
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {labels.activityHeatmap}
        </Typography>
        <Stack direction="row" sx={{ gap: 3 }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <Box
              sx={theme => ({
                width: 12,
                height: 12,
                bgcolor: theme.palette.primary.main,
                borderRadius: 0.5,
              })}
            />
            <Typography variant="caption" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.studentInput}
            </Typography>
          </Stack>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <Box
              sx={theme => ({
                width: 12,
                height: 12,
                bgcolor: theme.palette.secondary.main,
                borderRadius: 0.5,
              })}
            />
            <Typography variant="caption" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.teacherResponse}
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      <Box sx={{ px: 4, pb: 4, pt: 2, height: 300, position: "relative" }}>
        {/* Grid lines */}
        <Box
          sx={{
            position: "absolute",
            inset: "16px 32px 32px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            pointerEvents: "none",
          }}
        >
          {[0, 1, 2].map(i => (
            <Divider key={i} sx={theme => ({ borderColor: theme.palette.outlineVariant, opacity: 0.4 })} />
          ))}
        </Box>

        {/* Bars */}
        <Stack
          direction="row"
          sx={{
            alignItems: "flex-end",
            height: "100%",
            gap: 0.5,
          }}
        >
          {bars.map((bar, i) => (
            <Box
              key={bar.id}
              sx={theme => ({
                flex: 1,
                height: `${bar.height}%`,
                borderRadius: "4px 4px 0 0",
                bgcolor: i % 2 === 0 ? theme.palette.primary.main : theme.palette.secondary.main,
                opacity: i % 2 === 0 ? 0.85 : 0.5,
                transition: "height 0.6s ease",
                "&:hover": { opacity: 1, filter: "brightness(1.15)" },
                cursor: "pointer",
              })}
            />
          ))}
        </Stack>
      </Box>
    </BaseCard>
  );
}
