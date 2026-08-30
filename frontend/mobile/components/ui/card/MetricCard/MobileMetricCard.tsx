"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Box, type SxProps } from "@mui/material";
import {
  MetricCardIconWrap,
  MetricCardMotionWrapper,
} from "@/frontend/common/components/ui/card/MetricCard/metricCardShared";
import { buildMotionWrapperProps } from "@/frontend/common/components/ui/card/MetricCard/metricCardSharedUtils";
import { StyledLabel, StyledSubLabel, StyledValue } from "@/frontend/common/components/ui/card/MetricCard/styled";
import { formatValue, type MetricCardVariant } from "@/frontend/common/components/ui/card/MetricCard/utils";
import {
  MotionStyledCard,
  StyledCard,
  StyledCompactContentRoot,
  StyledCompactMiddleRow,
  StyledValueContainer,
} from "@/frontend/mobile/components/ui/card/MetricCard/styled";

/**
 * Splits a formatted value ("12.50 h", "98 %") into its numeric main token and
 * a trailing unit suffix so the card can render the unit smaller and keep the
 * whole value on one line next to the trailing icon. Values without a
 * non-numeric trailing token ("1,284", "10:30") return `unit: null`.
 */
function splitMetricValue(value: number | string): { readonly main: string; readonly unit: string | null } {
  const text = formatValue(value);
  const trailingToken = /\s+(\S+)$/.exec(text);
  if (!trailingToken || /\d/.test(trailingToken[1])) {
    return { main: text, unit: null };
  }
  return { main: text.slice(0, trailingToken.index), unit: trailingToken[1] };
}

export interface MobileMetricCardProps {
  readonly icon: SvgIconComponent;
  readonly label: string;
  readonly value: number | string;
  readonly variant?: MetricCardVariant;
  readonly subLabel?: string;
  readonly animated?: boolean;
  readonly animationIndex?: number;
  readonly onClick?: () => void;
  readonly sx?: SxProps;
}

export function MobileMetricCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  subLabel,
  animated = true,
  animationIndex = 0,
  onClick,
  sx,
}: MobileMetricCardProps) {
  const isError = variant === "error" || variant === "danger";
  const isHighlight = variant === "highlight";
  const iconSize = 28;
  const iconFontSize = 18;

  const labelTypography = (
    <StyledLabel variant="labelUppercase" title={label} isError={isError} mbOverride={0}>
      {label}
    </StyledLabel>
  );

  const { main: valueMain, unit: valueUnit } = splitMetricValue(value);

  // nowrap: value+unit stay on one line beside the trailing icon.
  const valueTypography = (
    <StyledValue variant="headlineMd" metricVariant={variant} sx={{ whiteSpace: "nowrap" }}>
      {valueMain}
      {valueUnit ? (
        <Box component="span" sx={{ fontSize: "0.6em", fontWeight: 600 }}>
          {" "}
          {valueUnit}
        </Box>
      ) : null}
    </StyledValue>
  );

  const iconWrap = (
    <MetricCardIconWrap
      icon={Icon}
      iconSize={iconSize}
      iconFontSize={iconFontSize}
      isError={isError}
      isHighlight={isHighlight}
    />
  );

  const cardContent = (
    <StyledCompactContentRoot>
      {labelTypography}
      <StyledCompactMiddleRow>
        <StyledValueContainer>{valueTypography}</StyledValueContainer>
        {iconWrap}
      </StyledCompactMiddleRow>
      {subLabel ? (
        <StyledSubLabel variant="labelMd" mtOverride={0}>
          {subLabel}
        </StyledSubLabel>
      ) : null}
    </StyledCompactContentRoot>
  );

  return (
    <MetricCardMotionWrapper
      {...buildMotionWrapperProps({
        isHighlight,
        isError,
        onClick,
        animated,
        animationIndex,
        sx,
        MotionComponent: MotionStyledCard,
        StaticComponent: StyledCard,
        delayMultiplier: 0.02,
      })}
    >
      {cardContent}
    </MetricCardMotionWrapper>
  );
}
