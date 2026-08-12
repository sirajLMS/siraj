"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { SxProps } from "@mui/material";
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

  const valueTypography = (
    <StyledValue variant="headlineMd" metricVariant={variant}>
      {formatValue(value)}
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
