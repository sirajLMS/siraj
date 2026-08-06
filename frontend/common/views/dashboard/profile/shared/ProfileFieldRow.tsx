import type { SvgIconComponent } from "@mui/icons-material";
import { Link, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type * as React from "react";

interface ProfileFieldRowProps {
  readonly icon: SvgIconComponent;
  readonly label: string;
  readonly value: React.ReactNode;
  readonly href?: string | null;
  readonly fallback?: string;
  readonly hover?: boolean;
}

export function ProfileFieldRow({
  icon: Icon,
  label,
  value,
  href,
  fallback = "—",
  hover = false,
}: ProfileFieldRowProps) {
  const hasLink = Boolean(href);
  const linkHref = href ?? undefined;

  const valueIsEmptyString = typeof value === "string" && value.trim() === "";
  const displayValue: React.ReactNode = valueIsEmptyString ? fallback : value;

  // Render the value based on whether it's a link, plain text/number, or a React node
  const renderValue = (): React.ReactNode => {
    if (hasLink) {
      return (
        <Link
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ typography: "bodyMd", textDecoration: "none" }}
        >
          {displayValue}
        </Link>
      );
    }
    if (typeof displayValue === "string" || typeof displayValue === "number") {
      return <Typography sx={{ typography: "bodyMd" }}>{displayValue}</Typography>;
    }
    return displayValue;
  };

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        gap: 1.5,
        py: 1,
        px: 1.5,
        borderRadius: 1,
        ...(hover
          ? {
              "&:hover": {
                backgroundColor: (theme: Theme) => theme.palette.surfaceContainerLow,
              },
            }
          : {}),
      }}
    >
      <Stack
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: (theme: Theme) => theme.palette.surfaceContainer,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 18, color: (theme: Theme) => theme.palette.primary.main }} />
      </Stack>
      <Stack sx={{ gap: 0.25, minWidth: 0 }}>
        <Typography
          sx={{
            typography: "labelMd",
            color: (theme: Theme) => theme.palette.text.secondary,
          }}
        >
          {label}
        </Typography>
        {renderValue()}
      </Stack>
    </Stack>
  );
}
