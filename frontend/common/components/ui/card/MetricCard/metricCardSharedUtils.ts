import type { SvgIconComponent } from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import type { ElementType } from "react";

export interface MetricCardIconWrapProps {
  readonly icon: SvgIconComponent;
  readonly iconSize: number;
  readonly iconFontSize: number;
  readonly isError: boolean;
  readonly isHighlight: boolean;
}

export interface MetricCardMotionWrapperProps {
  readonly isHighlight: boolean;
  readonly isError: boolean;
  readonly isInteractive: boolean;
  readonly onClick?: () => void;
  readonly animated: boolean;
  readonly animationIndex: number;
  readonly sx?: SxProps;
  readonly MotionComponent: ElementType;
  readonly StaticComponent: ElementType;
  readonly delayMultiplier: number;
  readonly extraProps?: Record<string, unknown>;
  readonly children: import("react").ReactNode;
}

export function buildMotionWrapperProps(args: {
  readonly isHighlight: boolean;
  readonly isError: boolean;
  readonly onClick?: () => void;
  readonly animated: boolean;
  readonly animationIndex: number;
  readonly sx?: SxProps;
  readonly MotionComponent: ElementType;
  readonly StaticComponent: ElementType;
  readonly delayMultiplier: number;
  readonly extraProps?: Record<string, unknown>;
}): Omit<MetricCardMotionWrapperProps, "children"> {
  return {
    isHighlight: args.isHighlight,
    isError: args.isError,
    isInteractive: Boolean(args.onClick),
    onClick: args.onClick,
    animated: args.animated,
    animationIndex: args.animationIndex,
    sx: args.sx,
    MotionComponent: args.MotionComponent,
    StaticComponent: args.StaticComponent,
    delayMultiplier: args.delayMultiplier,
    extraProps: args.extraProps,
  };
}
