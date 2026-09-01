import type { ReactElement } from "react";

export interface PieShapeProps {
  readonly index: number;
  readonly cx?: number | string;
  readonly cy?: number | string;
  readonly innerRadius?: number | string;
  readonly outerRadius?: number | string;
  readonly startAngle?: number;
  readonly endAngle?: number;
  readonly midAngle?: number;
}

export interface BarShapeProps {
  readonly index: number;
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly background?: { x: number | null; y: number | null; width: number | null; height: number | null };
}

export interface ChartColors {
  readonly primary: string;
  readonly primaryLight: string;
  readonly success: string;
  readonly successLight: string;
  readonly warning: string;
  readonly error: string;
  readonly donutColors: string[];
  readonly barColors: string[];
}

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

function describeArc(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

export function makeDonutShape(chartColors: ChartColors): (props: PieShapeProps) => ReactElement {
  return function DonutShape(props: PieShapeProps): ReactElement {
    const { index, cx, cy, innerRadius, outerRadius, startAngle, endAngle } = props;
    const { donutColors } = chartColors;
    return (
      <path
        d={describeArc(
          Number(cx),
          Number(cy),
          Number(innerRadius),
          Number(outerRadius),
          Number(startAngle),
          Number(endAngle)
        )}
        fill={donutColors[index % donutColors.length]}
      />
    );
  };
}

export function makeBarShape(chartColors: ChartColors): (props: BarShapeProps) => ReactElement {
  return function BarShape(props: BarShapeProps): ReactElement {
    const { index, x, y, width, height } = props;
    const { barColors } = chartColors;
    return <rect x={x} y={y} width={width} height={height} fill={barColors[index % barColors.length]} />;
  };
}

export function makeGaugeShape(chartColors: Pick<ChartColors, "error">): (props: PieShapeProps) => ReactElement {
  return function GaugeShape(props: PieShapeProps): ReactElement {
    const { index, cx, cy, innerRadius, outerRadius, startAngle, endAngle } = props;
    return (
      <path
        d={describeArc(
          Number(cx),
          Number(cy),
          Number(innerRadius),
          Number(outerRadius),
          Number(startAngle),
          Number(endAngle)
        )}
        fill={index === 0 ? chartColors.error : "transparent"}
      />
    );
  };
}
