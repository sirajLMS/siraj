"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import {
  MotionStyledCard,
  StyledCard,
  StyledCompactContentRoot,
  StyledCompactMiddleRow,
  StyledIcon,
  StyledIconWrap,
  StyledLabel,
  StyledSubLabel,
  StyledValue,
  StyledValueContainer,
} from "@/frontend/mobile/components/ui/card/MetricCard/styled";
import { formatValue, type MetricCardVariant } from "@/frontend/mobile/components/ui/card/MetricCard/utils";

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
    <StyledLabel variant="labelUppercase" title={label} isError={isError}>
      {label}
    </StyledLabel>
  );

  const valueTypography = (
    <StyledValue variant="headlineMd" metricVariant={variant}>
      {formatValue(value)}
    </StyledValue>
  );

  const iconWrap = (
    <StyledIconWrap className="metric-icon-wrap" iconSize={iconSize} isError={isError} isHighlight={isHighlight}>
      <StyledIcon icon={Icon} fontSizeValue={iconFontSize} isError={isError} />
    </StyledIconWrap>
  );

  const cardContent = (
    <StyledCompactContentRoot>
      {labelTypography}
      <StyledCompactMiddleRow>
        <StyledValueContainer>{valueTypography}</StyledValueContainer>
        {iconWrap}
      </StyledCompactMiddleRow>
      {subLabel ? <StyledSubLabel variant="labelMd">{subLabel}</StyledSubLabel> : null}
    </StyledCompactContentRoot>
  );

  if (animated) {
    return (
      <MotionStyledCard
        interactive={false}
        onClick={onClick}
        isHighlight={isHighlight}
        isError={isError}
        isInteractive={Boolean(onClick)}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: animationIndex * 0.02,
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
      sx={sx}
    >
      {cardContent}
    </StyledCard>
  );
}
