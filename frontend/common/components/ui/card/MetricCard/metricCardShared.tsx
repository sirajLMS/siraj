"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { MetricCardMotionWrapperProps } from "@/frontend/common/components/ui/card/MetricCard/metricCardSharedUtils";
import { StyledIcon, StyledIconWrap } from "@/frontend/common/components/ui/card/MetricCard/styled";

const EMPTY_PROPS: Record<string, unknown> = {};

export function MetricCardIconWrap({
  icon: Icon,
  iconSize,
  iconFontSize,
  isError,
  isHighlight,
}: {
  readonly icon: SvgIconComponent;
  readonly iconSize: number;
  readonly iconFontSize: number;
  readonly isError: boolean;
  readonly isHighlight: boolean;
}) {
  return (
    <StyledIconWrap className="metric-icon-wrap" iconSize={iconSize} isError={isError} isHighlight={isHighlight}>
      <StyledIcon icon={Icon} fontSizeValue={iconFontSize} isError={isError} />
    </StyledIconWrap>
  );
}

export function MetricCardMotionWrapper({
  isHighlight,
  isError,
  isInteractive,
  onClick,
  animated,
  animationIndex,
  sx,
  children,
  MotionComponent,
  StaticComponent,
  delayMultiplier,
  extraProps = EMPTY_PROPS,
}: MetricCardMotionWrapperProps) {
  if (animated) {
    return (
      <MotionComponent
        interactive={false}
        onClick={onClick}
        isHighlight={isHighlight}
        isError={isError}
        isInteractive={isInteractive}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: animationIndex * delayMultiplier,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        sx={sx}
        {...extraProps}
      >
        {children}
      </MotionComponent>
    );
  }

  return (
    <StaticComponent
      interactive={false}
      onClick={onClick}
      isHighlight={isHighlight}
      isError={isError}
      isInteractive={isInteractive}
      sx={sx}
      {...extraProps}
    >
      {children}
    </StaticComponent>
  );
}
