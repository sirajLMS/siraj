"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import {
  MetricCardIconWrap,
  MetricCardMotionWrapper,
} from "@/frontend/common/components/ui/card/MetricCard/metricCardShared";
import { buildMotionWrapperProps } from "@/frontend/common/components/ui/card/MetricCard/metricCardSharedUtils";
import {
  MotionStyledCard,
  StyledCard,
  StyledDefaultContentRoot,
  StyledLabel,
  StyledSubLabel,
  StyledValue,
} from "@/frontend/common/components/ui/card/MetricCard/styled";
import { formatValue, type MetricCardVariant } from "@/frontend/common/components/ui/card/MetricCard/utils";

export interface MetricCardProps {
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

export function MetricCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  subLabel,
  animated = true,
  animationIndex = 0,
  onClick,
  sx,
}: MetricCardProps) {
  const isError = variant === "error" || variant === "danger";
  const isHighlight = variant === "highlight";
  const iconSize = 44;
  const iconFontSize = 22;

  const labelTypography = (
    <StyledLabel variant="labelUppercase" title={label} isError={isError}>
      {label}
    </StyledLabel>
  );

  const valueTypography = (
    <StyledValue variant="headlineLg" metricVariant={variant}>
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
    <>
      <StyledDefaultContentRoot>
        {labelTypography}
        {valueTypography}
        {subLabel ? <StyledSubLabel variant="labelMd">{subLabel}</StyledSubLabel> : null}
      </StyledDefaultContentRoot>
      {iconWrap}
    </>
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
        delayMultiplier: 0.04,
      })}
    >
      {cardContent}
    </MetricCardMotionWrapper>
  );
}
