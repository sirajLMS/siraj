"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import {
  MotionStyledCard,
  StyledCard,
  StyledCompactContentRoot,
  StyledCompactMiddleRow,
  StyledDefaultContentRoot,
  StyledIcon,
  StyledIconWrap,
  StyledLabel,
  StyledSubLabel,
  StyledValue,
  StyledValueContainer,
} from "@/frontend/common/components/ui/card/MetricCard/styled";
import {
  formatValue,
  type MetricCardSize,
  type MetricCardVariant,
} from "@/frontend/common/components/ui/card/MetricCard/utils";

export interface MetricCardProps {
  readonly icon: SvgIconComponent;
  readonly label: string;
  readonly value: number | string;
  readonly variant?: MetricCardVariant;
  readonly size?: MetricCardSize;
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
  size = "default",
  subLabel,
  animated = true,
  animationIndex = 0,
  onClick,
  sx,
}: MetricCardProps) {
  const isError = variant === "error" || variant === "danger";
  const isHighlight = variant === "highlight";
  const isCompactVariant = variant === "compact";
  const isCompactSize = size === "compact" || isCompactVariant;
  const iconSize = isCompactSize ? 32 : 44;
  const iconFontSize = isCompactSize ? 18 : 22;

  const labelTypography = (
    <StyledLabel variant="labelUppercase" title={label} isCompactSize={isCompactSize} isError={isError}>
      {label}
    </StyledLabel>
  );

  const valueTypography = (
    <StyledValue
      variant={isCompactSize ? "headlineMd" : "headlineLg"}
      metricVariant={variant === "compact" ? "default" : variant}
    >
      {formatValue(value)}
    </StyledValue>
  );

  const iconWrap = (
    <StyledIconWrap className="metric-icon-wrap" iconSize={iconSize} isError={isError} isHighlight={isHighlight}>
      <StyledIcon icon={Icon} fontSizeValue={iconFontSize} isError={isError} />
    </StyledIconWrap>
  );

  const cardContent = isCompactSize ? (
    <StyledCompactContentRoot>
      {labelTypography}
      <StyledCompactMiddleRow>
        <StyledValueContainer>{valueTypography}</StyledValueContainer>
        {iconWrap}
      </StyledCompactMiddleRow>
      {subLabel ? (
        <StyledSubLabel variant="labelMd" isCompactSize={isCompactSize}>
          {subLabel}
        </StyledSubLabel>
      ) : null}
    </StyledCompactContentRoot>
  ) : (
    <>
      <StyledDefaultContentRoot>
        {labelTypography}
        {valueTypography}
        {subLabel ? (
          <StyledSubLabel variant="labelMd" isCompactSize={isCompactSize}>
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
        isCompactSize={isCompactSize}
        isHighlight={isHighlight}
        isError={isError}
        isInteractive={Boolean(onClick)}
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
      isCompactSize={isCompactSize}
      isHighlight={isHighlight}
      isError={isError}
      isInteractive={Boolean(onClick)}
      sx={sx}
    >
      {cardContent}
    </StyledCard>
  );
}
