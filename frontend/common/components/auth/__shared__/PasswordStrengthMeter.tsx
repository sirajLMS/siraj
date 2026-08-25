"use client";

import { Box, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import { useMemo } from "react";
import { countPasswordClasses, PASSWORD_MIN_LENGTH } from "@/shared/utils/password-schema";

/**
 * Visual password-strength meter for login + onboarding forms.
 *
 * Reuses the unified `countPasswordClasses` + `PASSWORD_MIN_LENGTH` from
 * `@/shared/utils/password-schema` so the meter's notion of "strength" stays
 * aligned with the backend M5 policy (12 chars + ≥ 2 character classes).
 *
 * Strength scoring (0–100):
 *   - 0 pts for empty.
 *   - up to 50 pts for length (0 at length 0 → 50 at PASSWORD_MIN_LENGTH+).
 *   - up to 50 pts for character-class diversity (0/12.5/25/37.5/50 for 0–4 classes).
 *   The final score is clamped to [0, 100] and bucketed into Weak/Fair/Strong.
 *
 * The meter is purely advisory — it does NOT block submission. The actual
 * enforcement lives in the Zod schema (`createPasswordFieldSchema`).
 */
export interface PasswordStrengthMeterProps {
  readonly password: string;
  readonly labels: {
    readonly strength: string;
    readonly weak: string;
    readonly fair: string;
    readonly strong: string;
  };
  readonly minLength?: number;
}

type StrengthBucket = "empty" | "weak" | "fair" | "strong";

function bucketFor(score: number): StrengthBucket {
  if (score === 0) return "empty";
  if (score < 40) return "weak";
  if (score < 75) return "fair";
  return "strong";
}

function colorFor(bucket: StrengthBucket): "error" | "warning" | "success" | "primary" {
  switch (bucket) {
    case "weak":
      return "error";
    case "fair":
      return "warning";
    case "strong":
      return "success";
    default:
      return "primary";
  }
}

function labelFor(bucket: StrengthBucket, labels: PasswordStrengthMeterProps["labels"]): string {
  switch (bucket) {
    case "weak":
      return labels.weak;
    case "fair":
      return labels.fair;
    case "strong":
      return labels.strong;
    default:
      return "";
  }
}

export function PasswordStrengthMeter({
  password,
  labels,
  minLength = PASSWORD_MIN_LENGTH,
}: Readonly<PasswordStrengthMeterProps>) {
  const { score, bucket }: { score: number; bucket: StrengthBucket } = useMemo(() => {
    if (!password) return { score: 0, bucket: "empty" };
    const lengthPts = Math.min((password.length / minLength) * 50, 50);
    const classPts = Math.min(countPasswordClasses(password) * 12.5, 50);
    const s = Math.round(Math.max(0, Math.min(100, lengthPts + classPts)));
    return { score: s, bucket: bucketFor(s) };
  }, [password, minLength]);

  if (!password) return null;

  return (
    <Stack
      spacing={0.5}
      sx={{
        mt: 0.5,
        // Smooth transitions so the bar + label don't jump on each keystroke.
        transition: "all 150ms ease-in-out",
      }}
      aria-live="polite"
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary }}>
          {labels.strength}
        </Typography>
        {bucket !== "empty" && (
          <Tooltip title={`${score}%`} arrow placement="top">
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                cursor: "help",
                color: theme => theme.palette[colorFor(bucket)].main,
              }}
            >
              {labelFor(bucket, labels)}
            </Typography>
          </Tooltip>
        )}
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        color={colorFor(bucket)}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: theme => theme.palette.action.hover,
          "& .MuiLinearProgress-bar": {
            borderRadius: 3,
            transition: "all 250ms ease-in-out",
          },
        }}
      />
    </Stack>
  );
}
