"use client";

import { BlockOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";
import { useAppTranslation } from "@/shared/locale";

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
  typography: "bodyMd",
  fontWeight: 600,
}));

const StyledDeniedIndicator = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  color: theme.palette.error.main,
  typography: "bodyMd",
  fontWeight: 600,
}));

const StyledNotSetText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledOverrideLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontSize: theme.typography.labelMd.fontSize,
  marginLeft: theme.spacing(1),
}));

interface OverrideEffectiveDisplayDesktopProps {
  readonly effectiveState: "allowed" | "denied" | "not_set";
  readonly overrideState: OverrideState;
}

export function OverrideEffectiveDisplayDesktop({
  effectiveState,
  overrideState,
}: Readonly<OverrideEffectiveDisplayDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  return (
    <StyledEffectiveContainer>
      {effectiveState === "allowed" && (
        <StyledAllowedIndicator>
          <CheckCircleOutlined fontSize="small" />
          {t.statusAllowed}
        </StyledAllowedIndicator>
      )}
      {effectiveState === "denied" && (
        <StyledDeniedIndicator>
          <BlockOutlined fontSize="small" />
          {t.statusDenied}
        </StyledDeniedIndicator>
      )}
      {effectiveState === "not_set" && <StyledNotSetText variant="bodyMd">{t.notSet}</StyledNotSetText>}
      <StyledOverrideLabel variant="caption">
        {overrideState === "GRANTED" && t.labelExplicitGrant}
        {overrideState === "DENIED" && t.labelExplicitDeny}
        {overrideState === "INHERIT" && t.labelInherited}
      </StyledOverrideLabel>
    </StyledEffectiveContainer>
  );
}
