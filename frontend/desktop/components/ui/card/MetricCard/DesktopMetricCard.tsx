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
import {
  formatValue,
  type MetricCardDensity,
  type MetricCardVariant,
} from "@/frontend/common/components/ui/card/MetricCard/utils";

export interface DesktopMetricCardProps {
  readonly icon: SvgIconComponent;
  readonly label: string;
  readonly value: number | string;
  readonly variant?: MetricCardVariant;
  readonly subLabel?: string;
  readonly animated?: boolean;
  readonly animationIndex?: number;
  readonly onClick?: () => void;
  readonly sx?: SxProps;
  readonly density?: MetricCardDensity;
}

export function DesktopMetricCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  subLabel,
  animated = true,
  animationIndex = 0,
  onClick,
  sx,
  density = "default",
}: DesktopMetricCardProps) {
  const isError = variant === "error" || variant === "danger";
  const isHighlight = variant === "highlight";
  const isCompact = density === "compact";
  const iconSize = isCompact ? 36 : 44;
  const iconFontSize = isCompact ? 18 : 22;
  const formattedValue = formatValue(value);
  const isLongValue = typeof formattedValue === "string" && formattedValue.length > 18;

  const labelTypography = (
    <StyledLabel variant="labelUppercase" title={label} isError={isError} density={density}>
      {label}
    </StyledLabel>
  );

  const valueTypography = (
    <StyledValue
      variant={isCompact || isLongValue ? "titleLg" : "headlineLg"}
      metricVariant={variant}
      density={density}
      isLongValue={isLongValue}
    >
      {formattedValue}
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
      <StyledDefaultContentRoot density={density}>
        {labelTypography}
        {valueTypography}
        {subLabel ? (
          <StyledSubLabel variant="labelMd" density={density} useSecondaryColor>
            {subLabel}
          </StyledSubLabel>
        ) : null}
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
        extraProps: { density },
      })}
    >
      {cardContent}
    </MetricCardMotionWrapper>
  );
}
