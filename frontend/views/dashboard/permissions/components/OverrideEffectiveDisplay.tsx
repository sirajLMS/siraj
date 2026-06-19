"use client";

import { BlockOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { OverrideState } from "./OverridesTable";

const StyledEffectiveContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8,
});

const StyledAllowedIndicator = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  color: theme.palette.success.main,
  fontSize: "0.875rem",
  fontWeight: 600,
}));

const StyledDeniedIndicator = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  color: theme.palette.error.main,
  fontSize: "0.875rem",
  fontWeight: 600,
}));

const StyledNotSetText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledOverrideLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontSize: "0.75rem",
  marginLeft: theme.spacing(1),
}));

interface OverrideEffectiveDisplayProps {
  readonly effectiveState: "allowed" | "denied" | "not_set";
  readonly overrideState: OverrideState;
}

export function OverrideEffectiveDisplay({ effectiveState, overrideState }: Readonly<OverrideEffectiveDisplayProps>) {
  return (
    <StyledEffectiveContainer>
      {/* Status Indicator */}
      {effectiveState === "allowed" && (
        <StyledAllowedIndicator>
          <CheckCircleOutlined fontSize="small" />
          Allowed
        </StyledAllowedIndicator>
      )}
      {effectiveState === "denied" && (
        <StyledDeniedIndicator>
          <BlockOutlined fontSize="small" />
          Denied
        </StyledDeniedIndicator>
      )}
      {effectiveState === "not_set" && <StyledNotSetText variant="bodyMd">Not Set</StyledNotSetText>}
      {/* Override Label */}
      <StyledOverrideLabel variant="caption">
        {overrideState === "GRANTED" && "(Explicit Grant)"}
        {overrideState === "DENIED" && "(Explicit Deny)"}
        {overrideState === "INHERIT" && "(Inherited)"}
      </StyledOverrideLabel>
    </StyledEffectiveContainer>
  );
}
