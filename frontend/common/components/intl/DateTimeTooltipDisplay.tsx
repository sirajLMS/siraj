"use client";

import { Box, Tooltip, Typography, type TypographyProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { formatDate, formatTime } from "@/frontend/common/components/intl/dateFormat";

type DateTimeTooltipTone = "default" | "highlight" | "meta";

interface DateTimeTooltipDisplayProps {
  readonly value: string | null | undefined;
  readonly locale: string;
  readonly emptyFallback?: string;
  readonly tone?: DateTimeTooltipTone;
  readonly typographyVariant?: TypographyProps["variant"];
}

function getDisplaySx(tone: DateTimeTooltipTone): SxProps<Theme> {
  switch (tone) {
    case "highlight":
      return theme => ({
        color: theme.palette.onPrimaryContainer,
        fontWeight: 700,
        cursor: "default",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      });
    case "meta":
      return () => ({
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontWeight: 700,
        cursor: "default",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        width: "100%",
        display: "block",
        textAlign: "center",
      });
    default:
      return theme => ({ color: theme.palette.onSurface, cursor: "default" });
  }
}

function resolveTypographyVariant(
  tone: DateTimeTooltipTone,
  typographyVariant: TypographyProps["variant"] | undefined
): TypographyProps["variant"] {
  if (typographyVariant) {
    return typographyVariant;
  }
  return tone === "highlight" ? "bodyLg" : "bodyMd";
}

export function DateTimeTooltipDisplay({
  value,
  locale,
  emptyFallback = "—",
  tone = "default",
  typographyVariant,
}: Readonly<DateTimeTooltipDisplayProps>) {
  const displaySx = getDisplaySx(tone);
  const variant = resolveTypographyVariant(tone, typographyVariant);

  if (!value) {
    return (
      <Typography variant={variant} sx={displaySx}>
        {emptyFallback}
      </Typography>
    );
  }

  const dateLabel = formatDate(value, locale);
  const timeLabel = formatTime(value, locale);

  return (
    <Tooltip
      title={
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          <Typography variant="labelMd">{dateLabel}</Typography>
          <Typography variant="labelMd">{timeLabel}</Typography>
        </Box>
      }
    >
      <Typography component="span" variant={variant} sx={displaySx}>
        {dateLabel}
      </Typography>
    </Tooltip>
  );
}
