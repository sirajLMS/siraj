"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Skeleton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface ScheduleSessionCardSkeletonProps {
  readonly actionCount?: number;
}

const DEFAULT_ACTION_COUNT = 2;

export function ScheduleSessionCardSkeleton({
  actionCount = DEFAULT_ACTION_COUNT,
}: Readonly<ScheduleSessionCardSkeletonProps>) {
  return (
    <Box
      sx={{
        paddingBlock: 2,
        paddingInline: 2,
        width: "100%",
        minHeight: 220,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 1, mt: 0.5 }} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {Array.from({ length: actionCount }).map((_, i) => (
            <Skeleton key={String(i + actionCount)} variant="circular" width={28} height={28} />
          ))}
        </Box>
      </Box>
      <Skeleton variant="rectangular" height={42} sx={{ borderRadius: 1, mb: 1.5 }} />
      <Skeleton variant="rectangular" height={52} sx={{ borderRadius: 1, mb: 1.5 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, pt: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={70} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={70} />
        </Box>
      </Box>
    </Box>
  );
}

interface ScheduleSessionEmptyStateProps {
  readonly message: string;
  readonly icon: SvgIconComponent;
  readonly iconColorKey?: "primary" | "primaryContainer";
}

export function ScheduleSessionEmptyState({
  message,
  icon: Icon,
  iconColorKey = "primary",
}: Readonly<ScheduleSessionEmptyStateProps>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingBlock: 2,
        paddingInline: 2,
        minHeight: 220,
        width: "100%",
        boxSizing: "border-box",
        textAlign: "center",
        gap: 1.5,
        overflow: "hidden",
      }}
    >
      <Box
        sx={theme => {
          const isPrimaryContainer = iconColorKey === "primaryContainer";
          return isPrimaryContainer
            ? {
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: theme.palette.primaryContainer,
                color: theme.palette.onPrimaryContainer,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }
            : {
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              };
        }}
      >
        <Icon sx={{ fontSize: 24 }} />
      </Box>
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
        {message}
      </Typography>
    </Box>
  );
}
