"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import {
  MotionStyledCard,
  StyledCard,
  StyledDefaultContentRoot,
  StyledIcon,
  StyledIconWrap,
  StyledLabel,
  StyledSubLabel,
  StyledValue,
} from "@/frontend/desktop/components/ui/card/MetricCard/styled";
import { formatValue, type MetricCardVariant } from "@/frontend/desktop/components/ui/card/MetricCard/utils";

export type MetricCardDensity = "default" | "compact";

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
    <StyledIconWrap className="metric-icon-wrap" iconSize={iconSize} isError={isError} isHighlight={isHighlight}>
      <StyledIcon icon={Icon} fontSizeValue={iconFontSize} isError={isError} />
    </StyledIconWrap>
  );

  const cardContent = (
    <>
      <StyledDefaultContentRoot density={density}>
        {labelTypography}
        {valueTypography}
        {subLabel ? (
          <StyledSubLabel variant="labelMd" density={density}>
            {subLabel}
          </StyledSubLabel>
        ) : null}
      </StyledDefaultContentRoot>
      {iconWrap}
    </>
  );

  if (animated) {
    return (
      <MotionStyledCard
        interactive={false}
        onClick={onClick}
        isHighlight={isHighlight}
        isError={isError}
        isInteractive={Boolean(onClick)}
        density={density}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: animationIndex * 0.04,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        sx={sx}
      >
        {cardContent}
      </MotionStyledCard>
    );
  }

  return (
    <StyledCard
      interactive={false}
      onClick={onClick}
      isHighlight={isHighlight}
      isError={isError}
      isInteractive={Boolean(onClick)}
      density={density}
      sx={sx}
    >
      {cardContent}
    </StyledCard>
  );
}
